/**
 * AI Chatbot Service
 * Customer service chatbot for load status and invoice inquiries.
 * Loads agent config (system prompt, model, temperature) from AIAgent table.
 */

import { AIService } from './AIService';
import { prisma } from '@/lib/prisma';
import { KnowledgeBaseService } from './KnowledgeBaseService';
import { AIAgentService } from './AIAgentService';

interface ChatbotInput {
  message: string;
  companyId: string;
  customerId?: string;
  userId?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  systemContext?: string;
  agentSlug?: string;
}

export class AIChatbotService extends AIService {
  /**
   * Process chatbot message (streaming — for web UI)
   */
  async processMessage(input: ChatbotInput): Promise<ReadableStream> {
    const agent = await this.loadAgent(input.companyId, input.agentSlug || 'web-chatbot');
    const contextData = await this.buildContext(input, agent?.id);

    const prompt = `${agent?.systemPrompt || this.getDefaultSystemContext()}

${contextData ? `*** CRITICAL CONTEXT DATA ***\n${contextData}\n` : ''}

USER MESSAGE: ${input.message}

${input.conversationHistory?.length ? `
CONVERSATION HISTORY:
${input.conversationHistory.slice(-5).map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n')}
` : ''}

Return plain text response. Be concise and authoritative.`;

    return this.callAIStream(prompt, {
      temperature: agent?.temperature ?? 0.3,
      maxTokens: agent?.maxTokens ?? 1000,
      systemPrompt: agent?.systemPrompt || 'You are a TMS AI Assistant. Prioritize Knowledge Base over general knowledge.',
    });
  }

  /**
   * Non-streaming chat for internal use (e.g. Telegram auto-reply)
   */
  async chat(input: ChatbotInput): Promise<string> {
    const agent = await this.loadAgent(input.companyId, input.agentSlug || 'telegram-driver');
    const contextData = await this.buildContext(input, agent?.id);

    const prompt = `${agent?.systemPrompt || this.getDefaultSystemContext()}

${contextData ? `*** CONTEXT DATA ***\n${contextData}\n` : ''}

USER MESSAGE: ${input.message}

${input.conversationHistory?.length ? `
CONVERSATION HISTORY:
${input.conversationHistory.slice(-5).map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n')}
` : ''}

IMPORTANT: Return ONLY valid JSON. Format: { "response": "answer" }.`;

    const result = await this.callAI<any>(prompt, {
      temperature: agent?.temperature ?? 0.3,
      maxTokens: agent?.maxTokens ?? 500,
      systemPrompt: agent?.systemPrompt || 'You are a TMS Dispatch AI. Return valid JSON.',
      stream: false,
      jsonMode: true,
    });

    console.log('[AIChatbot] Raw AI Result:', JSON.stringify(result.data, null, 2));

    if (typeof result.data === 'string') return result.data;
    return result.data?.response || "I couldn't generate a response.";
  }

  /**
   * Load agent config from DB (auto-seeds defaults on first access)
   */
  private async loadAgent(companyId: string, slug: string) {
    try {
      const agentService = new AIAgentService();
      return await agentService.getAgent(companyId, slug);
    } catch (error) {
      console.warn('[AIChatbot] Failed to load agent config, using defaults:', error);
      return null;
    }
  }

  /**
   * Build context string with entity lookups + KB search
   */
  private async buildContext(input: ChatbotInput, agentId?: string | null): Promise<string> {
    let contextData = '';

    // Load lookup
    const loadMatch = input.message.match(/load\s+([A-Z0-9-]+)/i);
    if (loadMatch) {
      const load = await prisma.load.findFirst({
        where: {
          companyId: input.companyId,
          loadNumber: { contains: loadMatch[1], mode: 'insensitive' },
          deletedAt: null,
        },
        include: {
          customer: { select: { name: true } },
          driver: { include: { user: { select: { firstName: true, lastName: true } } } },
          truck: { select: { truckNumber: true } },
        },
      });
      if (load) {
        contextData += `LOAD INFORMATION:
- Load Number: ${load.loadNumber}
- Status: ${load.status}
- Pickup: ${load.pickupCity}, ${load.pickupState} on ${load.pickupDate?.toISOString().split('T')[0] || 'N/A'}
- Delivery: ${load.deliveryCity}, ${load.deliveryState} on ${load.deliveryDate?.toISOString().split('T')[0] || 'N/A'}
- Revenue: $${load.revenue?.toFixed(2) || '0.00'}
- Driver: ${load.driver ? `${load.driver.user?.firstName || ''} ${load.driver.user?.lastName || ''}`.trim() : 'Not assigned'}
- Truck: ${load.truck?.truckNumber || 'Not assigned'}
`;
      }
    }

    // Invoice lookup
    const invoiceMatch = input.message.match(/invoice\s+([A-Z0-9-]+)/i);
    if (invoiceMatch) {
      const invoice = await prisma.invoice.findFirst({
        where: {
          customer: { companyId: input.companyId },
          invoiceNumber: { contains: invoiceMatch[1], mode: 'insensitive' },
        },
        include: { customer: { select: { name: true } } },
      });
      if (invoice) {
        contextData += `INVOICE INFORMATION:
- Invoice Number: ${invoice.invoiceNumber}
- Status: ${invoice.status}
- Total: $${invoice.total.toFixed(2)}
- Balance: $${invoice.balance.toFixed(2)}
- Due Date: ${invoice.dueDate.toISOString().split('T')[0]}
- Customer: ${invoice.customer?.name || 'N/A'}
`;
      }
    }

    // KB search (agent-scoped)
    const kbService = new KnowledgeBaseService(input.companyId);
    console.log(`[AIChatbot] Searching KB for: "${input.message}" (agent: ${agentId || 'all'})`);
    const kbResults = await kbService.search(input.message, 5, agentId || undefined);
    console.log(`[AIChatbot] Found ${kbResults.length} KB results`);

    // Additional system context
    if (input.systemContext) {
      contextData += `\nADDITIONAL CONTEXT:\n${input.systemContext}\n`;
    }

    if (kbResults.length > 0) {
      contextData += `\nKNOWLEDGE BASE INFORMATION:\n`;
      kbResults.forEach((result, index) => {
        contextData += `[Result ${index + 1} from "${result.documentTitle}"]: ${result.content}\n\n`;
      });
    }

    return contextData;
  }

  /**
   * Fallback system context when no agent config exists in DB
   */
  private getDefaultSystemContext(): string {
    return `You are an AI Assistant for a TMS (Transportation Management System).
Be professional, helpful, and concise.
Prioritize Knowledge Base information over general knowledge.
If the answer is not in the context, say so honestly.`;
  }
}

/**
 * AI Chatbot Service
 * Customer service chatbot for load status and invoice inquiries
 */

import { AIService } from './AIService';
import { prisma } from '@/lib/prisma';

interface ChatbotInput {
  message: string;
  companyId: string;
  customerId?: string;
  userId?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

interface ChatbotResponse {
  response: string;
  suggestions?: string[];
  data?: any; // Structured data if query is about specific entity
}

export class AIChatbotService extends AIService {
  /**
   * Process chatbot message
   */
  async processMessage(input: ChatbotInput): Promise<ChatbotResponse> {
    // Fetch relevant data based on message context
    let contextData = '';

    // Check if message is about a specific load
    const loadNumberMatch = input.message.match(/load\s+([A-Z0-9-]+)/i);
    if (loadNumberMatch) {
      const loadNumber = loadNumberMatch[1];
      const load = await prisma.load.findFirst({
        where: {
          companyId: input.companyId,
          loadNumber: { contains: loadNumber, mode: 'insensitive' },
          deletedAt: null,
        },
        include: {
          customer: { select: { name: true } },
          driver: {
            include: {
              user: { select: { firstName: true, lastName: true, phone: true } },
            },
          },
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

    // Check if message is about invoices
    const invoiceMatch = input.message.match(/invoice\s+([A-Z0-9-]+)/i);
    if (invoiceMatch) {
      const invoiceNumber = invoiceMatch[1];
      const invoice = await prisma.invoice.findFirst({
        where: {
          customer: {
            companyId: input.companyId,
          },
          invoiceNumber: { contains: invoiceNumber, mode: 'insensitive' },
        },
        include: {
          customer: { select: { name: true } },
        },
      });

      if (invoice) {
        contextData += `INVOICE INFORMATION:
- Invoice Number: ${invoice.invoiceNumber}
- Status: ${invoice.status}
- Total: $${invoice.total.toFixed(2)}
- Balance: $${invoice.balance.toFixed(2)}
- Invoice Date: ${invoice.invoiceDate.toISOString().split('T')[0]}
- Due Date: ${invoice.dueDate.toISOString().split('T')[0]}
- Customer: ${invoice.customer?.name || 'N/A'}
`;
      }
    }

    // Build AI prompt
    const prompt = `You are a helpful customer service chatbot for a trucking company. Answer the user's question helpfully and accurately.

${contextData ? `CONTEXT DATA:\n${contextData}\n` : ''}

USER MESSAGE: ${input.message}

${input.conversationHistory && input.conversationHistory.length > 0 ? `
CONVERSATION HISTORY:
${input.conversationHistory.slice(-5).map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n')}
` : ''}

CAPABILITIES:
- Check load status by load number
- Check invoice status and balance
- Answer general questions about trucking operations
- Provide contact information
- Help with common questions

Return JSON with:
- response: string (helpful response to the user)
- suggestions: array of strings (optional follow-up questions or actions)
- data: object (optional structured data if query is about specific entity)

Be friendly, professional, and concise. If you don't have enough information, ask clarifying questions.`;

    const result = await this.callAI<ChatbotResponse>(
      prompt,
      {
        temperature: 0.7,
        maxTokens: 1000,
        systemPrompt: 'You are a helpful customer service chatbot. Return ONLY valid JSON with your response.',
      }
    );

    return result.data;
  }
}


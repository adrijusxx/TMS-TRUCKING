/**
 * AI Chatbot Service (Updated)
 * Customer service chatbot for load status and invoice inquiries
 */

import { AIService } from './AIService';
import { prisma } from '@/lib/prisma';
import { KnowledgeBaseService } from './KnowledgeBaseService';

interface ChatbotInput {
  message: string;
  companyId: string;
  customerId?: string;
  userId?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  systemContext?: string;
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
  async processMessage(input: ChatbotInput): Promise<ReadableStream> {
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

    // Search Knowledge Base
    const kbService = new KnowledgeBaseService(input.companyId);
    console.log(`[AIChatbot] Searching KB for: "${input.message}"`);
    // Increased to 5 results to provide better context
    const kbResults = await kbService.search(input.message, 5);
    console.log(`[AIChatbot] Found ${kbResults.length} KB results`);

    // Add System Context
    contextData += this.getSystemContext();
    if (input.systemContext) {
      contextData += `\nADDITIONAL CONTEXT:\n${input.systemContext}\n`;
    }

    if (kbResults.length > 0) {
      contextData += `\nKNOWLEDGE BASE INFORMATION:\n`;
      kbResults.forEach((result, index) => {
        contextData += `[Result ${index + 1} from "${result.documentTitle}"]: ${result.content}\n\n`;
      });
    }

    // Build AI prompt
    const prompt = `You are an expert TMS AI Assistant. Your goal is to provide specific, actionable answers based on the company's Knowledge Base.

${contextData ? `*** CRITICAL CONTEXT DATA ***\n${contextData}\n` : ''}

USER MESSAGE: ${input.message}

${input.conversationHistory && input.conversationHistory.length > 0 ? `
CONVERSATION HISTORY:
${input.conversationHistory.slice(-5).map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n')}
` : ''}

INSTRUCTIONS:
1. **SEARCH FIRST**: Look at the "KNOWLEDGE BASE INFORMATION" section above.
2. **PRECEDENCE**: If you see a similar situation in the logs (e.g. "Breakdown" transcript), recommend the *exact steps* taken in that successful case (e.g. "Record video", "Send to Compliance").
3. **SPECIFICITY**: Do not give generic advice like "Call a mechanic" unless the KB says so. Use specific company terminology found in the context.
4. **HONESTY**: If the answer is not in the context, say "I don't have a specific policy for this in my Knowledge Base, but generally..."

Return plain text response. Be concise and authoritative.`;

    // Note: We are switching to streaming, so we return the stream directly
    // The route handler will pipe this stream to the response
    return this.callAIStream(prompt, {
      temperature: 0.3, // Lower temperature for more factual answers
      maxTokens: 1000,
      systemPrompt: 'You are a TMS Dispatch AI. You strictly follow the procedures found in KNOWLEDGE BASE INFORMATION. You prioritize specific company history over general knowledge.',
    });
  }

  /**
   * Non-streaming chat for internal use (e.g. Telegram auto-reply)
   */
  async chat(input: ChatbotInput): Promise<string> {
    // 1. Build Context (Same as processMessage)
    let contextData = '';

    // Check for load/invoice in message (Simplified duplication for now)
    const loadNumberMatch = input.message.match(/load\s+([A-Z0-9-]+)/i);
    // ... we can support load look, but for Auto-Replies it's usually breakdown/general
    // Let's rely on KB and System Context primarily for this fix.

    // KB Search
    const kbService = new KnowledgeBaseService(input.companyId);
    console.log(`[AIChatbot] Searching KB for: "${input.message}"`);
    const kbResults = await kbService.search(input.message, 3);

    // System Context
    contextData += this.getSystemContext();
    if (input.systemContext) {
      contextData += `\nADDITIONAL CONTEXT:\n${input.systemContext}\n`;
    }

    if (kbResults.length > 0) {
      contextData += `\nKNOWLEDGE BASE INFORMATION:\n`;
      kbResults.forEach((result, index) => {
        contextData += `[Result ${index + 1} from "${result.documentTitle}"]: ${result.content}\n\n`;
      });
    }

    // Build Prompt
    const prompt = `You are an expert TMS AI Assistant acting as a friendly, human dispatcher.
    
${contextData ? `*** CONTEXT DATA ***\n${contextData}\n` : ''}

USER MESSAGE: ${input.message}

INSTRUCTIONS:
1. **PERSONA**: Friendly, helpful, confident. Short texts (max 2 sentences).
2. **KNOWLEDGE**: Use the "KNOWLEDGE BASE INFORMATION" if available.
3. **GAP FILLING**: If the exact answer is missing, use general trucking common sense. **NEVER say "I don't have a specific policy" or "As an AI".**
4. **STYLE**: verification needed? ask for a photo. advice needed? give it clearly.
5. **HISTORY**: If you see past conversations, follow their tone.

IMPORTANT: Return ONLY valid JSON. Format: { "response": "answer" }.`;

    const result = await this.callAI<any>(prompt, {
      temperature: 0.3,
      maxTokens: 500,
      systemPrompt: 'You are a TMS Dispatch AI. You strictly follow local procedures. Return valid JSON.',
      stream: false,
      jsonMode: true
    });

    console.log('[AIChatbot] Raw AI Result:', JSON.stringify(result.data, null, 2));

    if (typeof result.data === 'string') {
      return result.data;
    }
    return result.data?.response || "I couldn't generate a response.";
  }

  /**
   * Get system-wide context (Default Knowledge Base)
   */
  private getSystemContext(): string {
    return `
SYSTEM INFORMATION (TMS DEFAULT KNOWLEDGE):
- **Role**: You are the AI Assistant for "Four Ways Cargo" TMS, a comprehensive transport management system.
- **Tone**: Professional, helpful, concise.

### 🚛 OPERATIONS & DISPATCH
- **Loads**: Central unit of work. Status flow: PENDING -> DISPATCHED -> PICKED_UP -> DELIVERED -> COMPLETED.
- **Dispatching**: Assign Drivers, Trucks, and Trailers to Loads. Dispatchers can send SMS updates.
- **Tracking**: Loads have Pickup/Delivery dates, times, and locations. Map view available.

### 💰 ACCOUNTING & FINANCE
- **Invoices**: Generated from Completed Loads. Can be factored or direct bill.
- **Settlements**: Weekly pay statements for Drivers. specialized logic for "Split Loads" (Team Drivers).
- **Driver Pay**: Supports "Per Mile", "Percentage" (of Gross), or "Flat Rate".
- **Expenses**: Recurring deductions (Insurance, ELD) and one-time deductions (Cash Advance, Repairs).

### 🛡️ SAFETY & COMPLIANCE
- **Driver Qualification**: Tracks CDL Expiry, Medical Cards, MVR checks, Drug Tests.
- **Maintenance**: Tracks Service intervals, Inspections (DVIR), and Breakdowns.
- **Alerts**: System auto-flags expiring documents. Drivers with expired credentials cannot be dispatched.

### 👥 USERS & ROLES
- **Admin**: Full access. Can manage settings, users, and all financial data.
- **Dispatcher**: Read/Write for Loads, Drivers, and Trucks. Restricted financial view.
- **Driver**: Mobile app access. Can view assigned loads and settlements.
- **Safety**: manages compliance documents and incidents.

### 🆘 HELP & SUPPORT
- **Contact**: Telegram (@adrianvia) is the fastest way to get human support.
- **Docs**: Uploaded documents in "Knowledge Base" (e.g. company policies) override this default knowledge.
`;
  }
}

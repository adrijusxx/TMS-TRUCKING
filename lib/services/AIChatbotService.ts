/**
 * AI Chatbot Service
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

    if (kbResults.length > 0) {
      contextData += `\nKNOWLEDGE BASE INFORMATION:\n`;
      kbResults.forEach((result, index) => {
        contextData += `[Result ${index + 1} from "${result.documentTitle}"]: ${result.content}\n\n`;
      });
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
- Answer questions based on uploaded company documents
- Provide contact information
- Help with common questions

Return plain text response. Do NOT return JSON. Be friendly, professional, and concise.`;

    // Note: We are switching to streaming, so we return the stream directly
    // The route handler will pipe this stream to the response
    return this.callAIStream(prompt, {
      temperature: 0.5, // Lower temperature for more factual answers
      maxTokens: 1000,
      systemPrompt: 'You are a helpful customer service chatbot. You MUST prioritize the provided CONTEXT DATA (Knowledge Base, Loads, Invoices) to answer questions. If the answer is in the context, use it. If not, be helpful but admit you don\'t know specific details.',
    });
  }

  /**
   * Get system-wide context (Default Knowledge Base)
   */
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

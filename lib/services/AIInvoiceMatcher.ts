/**
 * Smart Invoice Matching Service
 * Matches bank deposits to invoices using AI
 */

import { AIService } from './AIService';
import { prisma } from '@/lib/prisma';
import { AIVerificationService } from './AIVerificationService';

interface InvoiceMatch {
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  invoiceTotal: number;
  amountPaid: number;
  balance: number;
  matchAmount: number; // Amount from deposit that matches this invoice
  matchConfidence: number; // 0-100
  matchReason: string;
  isPartialMatch: boolean;
}

interface InvoiceMatchingInput {
  companyId: string;
  depositAmount: number;
  depositDate: Date;
  depositReference?: string;
  depositDescription?: string;
}

const verificationService = new AIVerificationService();

export class AIInvoiceMatcher extends AIService {
  /**
   * Match a bank deposit to invoices
   */
  async matchDepositToInvoices(input: InvoiceMatchingInput): Promise<InvoiceMatch[]> {
    // Fetch unpaid or partially paid invoices
    const invoices = await prisma.invoice.findMany({
      where: {
        customer: {
          companyId: input.companyId,
        },
        status: { in: ['SENT', 'PARTIAL'] },
      },
      include: {
        customer: {
          select: {
            name: true,
            paymentTerms: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
      take: 100,
    });

    if (invoices.length === 0) {
      return [];
    }

    const prompt = `Match a bank deposit to one or more invoices. Handle partial payments and multiple invoice matches.

DEPOSIT DETAILS:
- Amount: $${input.depositAmount.toFixed(2)}
- Date: ${input.depositDate.toISOString().split('T')[0]}
- Reference: ${input.depositReference || 'Not provided'}
- Description: ${input.depositDescription || 'Not provided'}

UNPAID/PARTIALLY PAID INVOICES:
${JSON.stringify(invoices.map(inv => ({
  id: inv.id,
  invoiceNumber: inv.invoiceNumber,
  customerName: inv.customer.name,
  total: inv.total,
  amountPaid: inv.amountPaid || 0,
  balance: inv.balance || inv.total,
  dueDate: inv.dueDate,
  invoiceDate: inv.invoiceDate,
  paymentTerms: inv.customer.paymentTerms,
})), null, 2)}

MATCHING RULES:
1. Exact amount matches are highest confidence
2. Partial matches (deposit covers part of invoice) are valid
3. Multiple invoices can be matched to one deposit
4. Consider customer payment history and terms
5. Reference numbers and descriptions can help identify matches
6. Date proximity matters (recent invoices more likely)

Return JSON array of matches, each with:
- invoiceId: string
- invoiceNumber: string
- customerName: string
- invoiceTotal: number
- amountPaid: number (current amount paid)
- balance: number (remaining balance)
- matchAmount: number (amount from deposit that matches this invoice)
- matchConfidence: number (0-100)
- matchReason: string (explanation)
- isPartialMatch: boolean

The sum of matchAmount should not exceed depositAmount.`;

    const result = await this.callAI<InvoiceMatch[]>(
      prompt,
      {
        temperature: 0.2,
        maxTokens: 3000,
        systemPrompt: 'You are an expert in invoice matching and payment reconciliation. Return ONLY valid JSON array.',
      }
    );

    return result.data;
  }

  /**
   * Create suggestions for invoice matches (requires approval)
   */
  async createMatchSuggestions(
    companyId: string,
    depositId: string,
    matches: InvoiceMatch[]
  ): Promise<void> {
    for (const match of matches) {
      if (match.matchConfidence >= 70) {
        // Only create suggestions for high-confidence matches
        await verificationService.createSuggestion({
          companyId,
          suggestionType: 'INVOICE_MATCHING',
          entityType: 'INVOICE',
          entityId: match.invoiceId,
          aiConfidence: match.matchConfidence,
          aiReasoning: match.matchReason,
          suggestedValue: {
            depositId,
            matchAmount: match.matchAmount,
            isPartialMatch: match.isPartialMatch,
          },
          originalValue: {
            amountPaid: match.amountPaid,
            balance: match.balance,
          },
        });
      }
    }
  }
}


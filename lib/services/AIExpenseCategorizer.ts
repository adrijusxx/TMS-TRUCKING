/**
 * AI Expense Categorization Service
 * Automatically categorizes expenses from receipts, invoices, and descriptions
 */

import { AIService } from './AIService';
import { prisma } from '@/lib/prisma';

interface ExpenseCategorizationInput {
  description: string;
  vendor?: string;
  amount?: number;
  receiptText?: string; // OCR text from receipt
  invoiceText?: string; // Text from invoice
  companyId: string;
  mcNumberId?: string;
}

interface ExpenseCategorizationResult {
  categoryId?: string;
  categoryName?: string;
  expenseTypeId?: string;
  expenseTypeName?: string;
  confidence: number;
  reasoning: string;
  suggestedAmount?: number;
  suggestedVendor?: string;
}

export class AIExpenseCategorizer extends AIService {
  /**
   * Categorize an expense using AI
   */
  async categorizeExpense(input: ExpenseCategorizationInput): Promise<ExpenseCategorizationResult> {
    // Fetch available expense categories and types for the company
    const categories = await prisma.expenseCategory.findMany({
      where: {
        companyId: input.companyId,
        mcNumberId: input.mcNumberId || null,
        isActive: true,
        deletedAt: null,
      },
      include: {
        expenseTypes: {
          where: {
            isActive: true,
            deletedAt: null,
          },
        },
      },
    });

    // Build category/type list for AI
    const categoryList = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      code: cat.code || '',
      description: cat.description || '',
      types: cat.expenseTypes.map(type => ({
        id: type.id,
        name: type.name,
        code: type.code || '',
        description: type.description || '',
      })),
    }));

    // Build prompt with context
    const textContent = input.receiptText || input.invoiceText || input.description;
    const prompt = `Categorize this trucking company expense. Return JSON with category and expense type recommendations.

EXPENSE DETAILS:
- Description: ${input.description}
- Vendor: ${input.vendor || 'Not provided'}
- Amount: ${input.amount ? `$${input.amount.toFixed(2)}` : 'Not provided'}
${input.receiptText ? `- Receipt Text:\n${this.truncateText(input.receiptText, 2000)}` : ''}
${input.invoiceText ? `- Invoice Text:\n${this.truncateText(input.invoiceText, 2000)}` : ''}

AVAILABLE CATEGORIES AND TYPES:
${categoryList.map((cat, i) => `
Category ${i + 1}: ${cat.name}${cat.code ? ` (${cat.code})` : ''}
${cat.description ? `  Description: ${cat.description}` : ''}
  Types:
${cat.types.map((type, j) => `    - ${type.name}${type.code ? ` (${type.code})` : ''}${type.description ? `: ${type.description}` : ''}`).join('\n')}
`).join('\n')}

COMMON TRUCKING EXPENSE PATTERNS:
- Fuel: Gas stations, truck stops, fuel cards (Pilot, Love's, TA, etc.)
- Maintenance: Repair shops, parts vendors, tire shops, oil changes
- Tolls: Toll roads, bridges, E-ZPass, toll tags
- Permits: Overweight permits, trip permits, IRP, IFTA
- Insurance: Vehicle insurance, cargo insurance, liability
- Driver Expenses: Meals, lodging, showers, parking
- Equipment: Tires, parts, accessories, tools
- Compliance: DOT inspections, drug tests, medical exams
- Communication: Phone bills, ELD subscriptions, GPS services
- Office/Admin: Office supplies, software subscriptions, accounting

Return JSON with:
- categoryId: string (ID of best matching category, or null if no match)
- categoryName: string (name of category)
- expenseTypeId: string (ID of best matching expense type, or null)
- expenseTypeName: string (name of expense type)
- confidence: number (0-100, how confident the match is)
- reasoning: string (brief explanation of why this category/type was chosen)
- suggestedAmount: number (if amount not provided, suggest based on description/vendor)
- suggestedVendor: string (if vendor not provided, extract from text)

If no good match exists, set categoryId and expenseTypeId to null but still provide reasoning.`;

    const result = await this.callAI<ExpenseCategorizationResult>(
      prompt,
      {
        temperature: 0.2,
        maxTokens: 2000,
        systemPrompt: 'You are an expert in trucking company expense categorization. Return ONLY valid JSON with category recommendations.',
      }
    );

    return result.data;
  }

  /**
   * Batch categorize multiple expenses
   */
  async categorizeExpenses(
    inputs: ExpenseCategorizationInput[]
  ): Promise<ExpenseCategorizationResult[]> {
    const results = await Promise.all(
      inputs.map(input => this.categorizeExpense(input))
    );
    return results;
  }
}




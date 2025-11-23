import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { AIExpenseCategorizer } from '@/lib/services/AIExpenseCategorizer';
import { AIVerificationService } from '@/lib/services/AIVerificationService';
import { z } from 'zod';

const verificationService = new AIVerificationService();

const expenseCategorizationSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  vendor: z.string().optional(),
  amount: z.number().optional(),
  receiptText: z.string().optional(),
  invoiceText: z.string().optional(),
  expenseId: z.string().optional(), // Optional: if categorizing existing expense
  mcNumberId: z.string().optional(),
  autoApplyThreshold: z.number().optional().default(100), // Amount threshold for auto-apply
  autoApplyConfidence: z.number().optional().default(80), // Confidence threshold for auto-apply
});

const batchExpenseCategorizationSchema = z.object({
  expenses: z.array(expenseCategorizationSchema).min(1),
  mcNumberId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Check if this is a batch request
    const isBatch = 'expenses' in body && Array.isArray(body.expenses);

    if (isBatch) {
      const validated = batchExpenseCategorizationSchema.parse(body);
      const categorizer = new AIExpenseCategorizer();

      const results = await categorizer.categorizeExpenses(
        validated.expenses.map(exp => ({
          ...exp,
          companyId: session.user.companyId,
          mcNumberId: validated.mcNumberId || session.user.mcNumberId,
        }))
      );

      return NextResponse.json({
        success: true,
        data: results,
      });
    } else {
      const validated = expenseCategorizationSchema.parse(body);
      const categorizer = new AIExpenseCategorizer();

      const result = await categorizer.categorizeExpense({
        ...validated,
        companyId: session.user.companyId,
        mcNumberId: validated.mcNumberId || session.user.mcNumberId,
      });

      // Determine if we should auto-apply or require approval
      const shouldAutoApply =
        result.confidence >= validated.autoApplyConfidence &&
        (validated.amount || 0) < validated.autoApplyThreshold;

      // If auto-apply conditions are met, return directly
      if (shouldAutoApply && result.categoryId) {
        return NextResponse.json({
          success: true,
          data: {
            ...result,
            requiresApproval: false,
            autoApplied: true,
          },
        });
      }

      // Otherwise, create a suggestion requiring approval if expenseId is provided
      if (result.categoryId && validated.expenseId) {
        const suggestion = await verificationService.createSuggestion({
          companyId: session.user.companyId,
          suggestionType: 'EXPENSE_CATEGORIZATION',
          entityType: 'EXPENSE',
          entityId: validated.expenseId,
          aiConfidence: result.confidence,
          aiReasoning: result.reasoning,
          suggestedValue: {
            categoryId: result.categoryId,
            expenseTypeId: result.expenseTypeId,
            categoryName: result.categoryName,
            expenseTypeName: result.expenseTypeName,
          },
          originalValue: await getExpenseOriginalValue(validated.expenseId),
        });

        return NextResponse.json({
          success: true,
          data: {
            ...result,
            suggestionId: suggestion.id,
            requiresApproval: true,
          },
        });
      }

      // If no expenseId, just return the categorization
      return NextResponse.json({
        success: true,
        data: {
          ...result,
          requiresApproval: false,
        },
      });
    }
  } catch (error) {
    console.error('AI expense categorization error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to categorize expense',
        },
      },
      { status: 500 }
    );
  }
}

async function getExpenseOriginalValue(expenseId: string) {
  const { prisma } = await import('@/lib/prisma');
  const expense = await prisma.loadExpense.findUnique({
    where: { id: expenseId },
    select: { category: true, expenseType: true },
  });
  return expense || null;
}


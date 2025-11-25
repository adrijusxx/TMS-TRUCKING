import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { AIInvoiceMatcher } from '@/lib/services/AIInvoiceMatcher';
import { z } from 'zod';

const invoiceMatchingSchema = z.object({
  depositAmount: z.number().positive('Deposit amount must be positive'),
  depositDate: z.string().datetime().or(z.string()),
  depositReference: z.string().optional(),
  depositDescription: z.string().optional(),
  createSuggestions: z.boolean().optional().default(true),
  depositId: z.string().optional(), // Optional: if matching existing deposit
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
    const validated = invoiceMatchingSchema.parse(body);

    const matcher = new AIInvoiceMatcher();
    const matches = await matcher.matchDepositToInvoices({
      companyId: session.user.companyId,
      depositAmount: validated.depositAmount,
      depositDate: new Date(validated.depositDate),
      depositReference: validated.depositReference,
      depositDescription: validated.depositDescription,
    });

    // Create suggestions if requested
    if (validated.createSuggestions && validated.depositId) {
      await matcher.createMatchSuggestions(
        session.user.companyId,
        validated.depositId,
        matches
      );
    }

    return NextResponse.json({
      success: true,
      data: matches,
    });
  } catch (error) {
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
    console.error('AI Invoice Matching error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to match invoices',
        },
      },
      { status: 500 }
    );
  }
}




import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { SettlementManager } from '@/lib/managers/SettlementManager';
import { z } from 'zod';

const approvalSchema = z.object({
  approved: z.boolean(),
  notes: z.string().max(1000).optional(),
  paymentMethod: z.enum(['CHECK', 'WIRE', 'ACH', 'CREDIT_CARD', 'CASH', 'OTHER', 'FACTOR', 'QUICK_PAY']).optional(),
  paymentReference: z.string().max(100).optional(),
});

/**
 * Approve or reject a settlement
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Only ADMIN and ACCOUNTANT can approve settlements
    if (session.user.role !== 'ADMIN' && session.user.role !== 'ACCOUNTANT') {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FORBIDDEN', message: 'Insufficient permissions to approve settlements' },
        },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const settlementId = resolvedParams.id;
    const body = await request.json();
    const validated = approvalSchema.parse(body);

    // Verify settlement exists and belongs to company
    const settlement = await prisma.settlement.findFirst({
      where: {
        id: settlementId,
        driver: {
          companyId: session.user.companyId,
        },
      },
    });

    if (!settlement) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Settlement not found' },
        },
        { status: 404 }
      );
    }

    // Check if already approved/rejected
    if (settlement.approvalStatus !== 'PENDING') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Settlement is already ${settlement.approvalStatus.toLowerCase()}`,
          },
        },
        { status: 400 }
      );
    }

    // Validate payment method if approving
    if (validated.approved && !validated.paymentMethod) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Payment method is required when approving a settlement',
          },
        },
        { status: 400 }
      );
    }

    // Approve or reject settlement
    const settlementManager = new SettlementManager();
    const updatedSettlement = await settlementManager.approveSettlement(
      settlementId,
      session.user.id,
      validated.notes || undefined
    );

    // Update payment details if provided
    if (validated.approved && (validated.paymentMethod || validated.paymentReference)) {
      await prisma.settlement.update({
        where: { id: settlementId },
        data: {
          ...(validated.paymentMethod && { paymentMethod: validated.paymentMethod }),
          ...(validated.paymentReference && { paymentReference: validated.paymentReference }),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedSettlement,
    });
  } catch (error: any) {
    console.error('Error approving settlement:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors,
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
          message: error.message || 'Failed to approve settlement',
        },
      },
      { status: 500 }
    );
  }
}


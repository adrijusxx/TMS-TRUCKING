import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { DriverAdvanceManager } from '@/lib/managers/DriverAdvanceManager';
import { z } from 'zod';

const approvalSchema = z.object({
  approved: z.boolean(),
  rejectionReason: z.string().max(500).optional(),
  paymentMethod: z.enum(['CHECK', 'WIRE', 'ACH', 'CASH', 'OTHER']).optional(),
  paymentReference: z.string().max(100).optional(),
});

/**
 * Approve or reject a driver advance
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

    // Check if user has permission to approve advances (ADMIN or ACCOUNTANT)
    if (session.user.role !== 'ADMIN' && session.user.role !== 'ACCOUNTANT') {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FORBIDDEN', message: 'Insufficient permissions to approve advances' },
        },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const advanceId = resolvedParams.id;
    const body = await request.json();
    const validated = approvalSchema.parse(body);

    // Verify advance exists and belongs to company
    const advance = await prisma.driverAdvance.findFirst({
      where: {
        id: advanceId,
        driver: {
          companyId: session.user.companyId,
        },
      },
    });

    if (!advance) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Advance not found' },
        },
        { status: 404 }
      );
    }

    // Validate rejection reason if rejecting
    if (!validated.approved && !validated.rejectionReason) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Rejection reason is required when rejecting an advance',
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
            message: 'Payment method is required when approving an advance',
          },
        },
        { status: 400 }
      );
    }

    // Approve or reject advance
    const advanceManager = new DriverAdvanceManager();
    const updatedAdvance = await advanceManager.approveAdvance({
      advanceId,
      approverId: session.user.id,
      approved: validated.approved,
      rejectionReason: validated.rejectionReason,
      paymentMethod: validated.paymentMethod,
      paymentReference: validated.paymentReference,
    });

    return NextResponse.json({
      success: true,
      data: updatedAdvance,
    });
  } catch (error: any) {
    console.error('Error approving advance:', error);

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
          message: error.message || 'Failed to approve advance',
        },
      },
      { status: 500 }
    );
  }
}






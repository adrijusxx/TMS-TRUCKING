import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

const forceReleaseSchema = z.object({
  comment: z.string().min(1, 'Comment is required'),
});

/**
 * PATCH /api/loads/[id]/force-release
 * Force release a load from billing hold
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Check permission
    if (!hasPermission(session.user.role as any, 'loads.edit')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = forceReleaseSchema.parse(body);

    // Fetch load
    const load = await prisma.load.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!load) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Load not found' } },
        { status: 404 }
      );
    }

    // Clear billing hold
    await prisma.load.update({
      where: { id },
      data: {
        isBillingHold: false,
        billingHoldReason: null,
        dispatchNotes: `${load.dispatchNotes || ''}\n\n[FORCE RELEASE] ${new Date().toISOString()}\nReason: ${validated.comment}\nReleased by: ${session.user.firstName} ${session.user.lastName}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Billing hold cleared successfully',
    });
  } catch (error: any) {
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

    console.error('Error force releasing load:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to force release load' },
      },
      { status: 500 }
    );
  }
}


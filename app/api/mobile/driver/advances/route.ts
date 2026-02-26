import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { DriverAdvanceManager } from '@/lib/managers/DriverAdvanceManager';
import { z } from 'zod';

const advanceRequestSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  notes: z.string().optional(),
  loadId: z.string().cuid().optional(),
});

/**
 * GET /api/mobile/driver/advances
 * List driver's advance requests
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const driver = await prisma.driver.findFirst({
      where: { userId: session.user.id, isActive: true, deletedAt: null },
    });

    if (!driver) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_DRIVER', message: 'User is not a driver' } },
        { status: 403 }
      );
    }

    const manager = new DriverAdvanceManager();
    const advances = await manager.getDriverAdvanceHistory(driver.id, 20);
    const outstandingBalance = await manager.getDriverAdvanceBalance(driver.id);

    return NextResponse.json({
      success: true,
      data: {
        advances: advances.map((adv: any) => ({
          id: adv.id,
          amount: adv.amount,
          status: adv.approvalStatus,
          notes: adv.notes,
          requestDate: adv.requestDate,
          approvedAt: adv.approvedAt,
          loadNumber: adv.load?.loadNumber,
          rejectionReason: adv.rejectionReason,
        })),
        outstandingBalance,
        advanceLimit: driver.advanceLimit,
      },
    });
  } catch (error) {
    console.error('Mobile advances list error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/mobile/driver/advances
 * Request a new cash advance
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const driver = await prisma.driver.findFirst({
      where: { userId: session.user.id, isActive: true, deletedAt: null },
    });

    if (!driver) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_DRIVER', message: 'User is not a driver' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = advanceRequestSchema.parse(body);

    const manager = new DriverAdvanceManager();
    const advance = await manager.requestAdvance({
      driverId: driver.id,
      amount: validated.amount,
      notes: validated.notes,
      loadId: validated.loadId,
    });

    return NextResponse.json(
      { success: true, data: { id: advance.id, amount: advance.amount, status: advance.approvalStatus } },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.issues } },
        { status: 400 }
      );
    }

    console.error('Mobile advance request error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message || 'Something went wrong' } },
      { status: error.message?.includes('limit') ? 400 : 500 }
    );
  }
}

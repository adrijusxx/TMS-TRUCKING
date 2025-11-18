import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSettlementSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'PAID', 'DISPUTED']).optional(),
  notes: z.string().optional(),
  paidDate: z.string().or(z.date()).optional(),
});

export async function GET(
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

    const resolvedParams = await params;
    const settlement = await prisma.settlement.findFirst({
      where: {
        id: resolvedParams.id,
        driver: {
          companyId: session.user.companyId,
        },
      },
      include: {
        driver: {
          select: {
            id: true,
            driverNumber: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            payType: true,
            payRate: true,
          },
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

    // Fetch loads included in settlement
    const loads = await prisma.load.findMany({
      where: {
        id: { in: settlement.loadIds },
      },
      select: {
        id: true,
        loadNumber: true,
        pickupCity: true,
        pickupState: true,
        deliveryCity: true,
        deliveryState: true,
        revenue: true,
        driverPay: true,
        totalMiles: true,
        route: {
          select: {
            totalDistance: true,
          },
        },
        deliveredAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...settlement,
        loads,
      },
    });
  } catch (error) {
    console.error('Settlement fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

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

    const resolvedParams = await params;
    // Verify settlement belongs to company
    const existing = await prisma.settlement.findFirst({
      where: {
        id: resolvedParams.id,
        driver: {
          companyId: session.user.companyId,
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Settlement not found' },
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validated = updateSettlementSchema.parse(body);

    const updateData: any = {};
    if (validated.status) updateData.status = validated.status;
    if (validated.notes !== undefined) updateData.notes = validated.notes;
    if (validated.paidDate) {
      updateData.paidDate = validated.paidDate instanceof Date
        ? validated.paidDate
        : new Date(validated.paidDate);
    }

    const settlement = await prisma.settlement.update({
      where: { id: resolvedParams.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: settlement,
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

    console.error('Settlement update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}


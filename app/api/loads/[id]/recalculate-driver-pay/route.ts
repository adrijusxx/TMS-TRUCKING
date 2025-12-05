import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { calculateDriverPay } from '@/lib/utils/calculateDriverPay';

export async function POST(
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
    const loadId = resolvedParams.id;

    // Verify load exists and belongs to company
    const load = await prisma.load.findFirst({
      where: {
        id: loadId,
        companyId: session.user.companyId,
        deletedAt: null,
      },
      select: {
        id: true,
        driverId: true,
        revenue: true,
        totalMiles: true,
        loadedMiles: true,
        emptyMiles: true,
        driverPay: true,
      },
    });

    if (!load) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Load not found' },
        },
        { status: 404 }
      );
    }

    if (!load.driverId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'No driver assigned to this load' },
        },
        { status: 400 }
      );
    }

    // Fetch driver with pay information
    const driver = await prisma.driver.findUnique({
      where: { id: load.driverId },
      select: {
        id: true,
        payType: true,
        payRate: true,
      },
    });

    if (!driver) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Driver not found' },
        },
        { status: 404 }
      );
    }

    if (!driver.payType || driver.payRate === null || driver.payRate === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Driver does not have pay type or pay rate configured',
          },
        },
        { status: 400 }
      );
    }

    // Calculate driver pay
    const calculatedPay = calculateDriverPay(
      {
        payType: driver.payType,
        payRate: driver.payRate,
      },
      {
        totalMiles: load.totalMiles,
        loadedMiles: load.loadedMiles,
        emptyMiles: load.emptyMiles,
        revenue: load.revenue,
      }
    );

    // Update load with calculated driver pay
    const updatedLoad = await prisma.load.update({
      where: { id: loadId },
      data: { driverPay: calculatedPay },
      select: {
        id: true,
        driverPay: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        driverPay: updatedLoad.driverPay,
        calculatedPay,
      },
    });
  } catch (error) {
    console.error('Recalculate driver pay error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Something went wrong',
        },
      },
      { status: 500 }
    );
  }
}


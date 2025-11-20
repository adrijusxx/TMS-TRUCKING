import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { notifySettlementGenerated } from '@/lib/notifications/triggers';
import { z } from 'zod';

const generateSettlementSchema = z.object({
  driverId: z.string().cuid(),
  loadIds: z.array(z.string().cuid()).min(1, 'At least one load is required'),
  settlementNumber: z.string().optional(),
  deductions: z.number().min(0).default(0),
  advances: z.number().min(0).default(0),
  notes: z.string().optional(),
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
    const validated = generateSettlementSchema.parse(body);

    // Verify driver belongs to company
    const driver = await prisma.driver.findFirst({
      where: {
        id: validated.driverId,
        companyId: session.user.companyId,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
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

    // Fetch loads
    const loads = await prisma.load.findMany({
      where: {
        id: { in: validated.loadIds },
        driverId: validated.driverId,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (loads.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'No valid loads found for settlement',
          },
        },
        { status: 404 }
      );
    }

    // Calculate gross pay based on driver's pay type
    // Use current driver payRate for calculations (not stored load.driverPay)
    let grossPay = 0;
    let totalMiles = 0;

    for (const load of loads) {
      // Use load.driverPay if it's manually set, otherwise calculate from current driver payRate
      if (load.driverPay && load.driverPay > 0) {
        // Load has manually set driver pay, use it
        grossPay += load.driverPay;
      } else {
        // Calculate from current driver pay rate
        if (driver.payType === 'PER_MILE') {
          // Use actual miles from load if available
          const miles = load.totalMiles || load.loadedMiles || load.emptyMiles || 0;
          if (miles > 0) {
            totalMiles += miles;
            grossPay += miles * driver.payRate;
          }
        } else if (driver.payType === 'PER_LOAD') {
          grossPay += driver.payRate;
        } else if (driver.payType === 'PERCENTAGE') {
          grossPay += (load.revenue || 0) * (driver.payRate / 100);
        } else if (driver.payType === 'HOURLY') {
          // Estimate hours based on miles (rough estimate: 50 mph average)
          const miles = load.totalMiles || load.loadedMiles || load.emptyMiles || 0;
          const estimatedHours = miles > 0 ? miles / 50 : 10; // Default 10 hours if no miles
          grossPay += estimatedHours * driver.payRate;
        }
      }
    }

    const netPay = grossPay - validated.deductions - validated.advances;

    // Generate settlement number
    const settlementNumber =
      validated.settlementNumber ||
      `SET-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    // Calculate period dates from loads
    const loadDates = loads
      .map((l) => l.deliveryDate || l.pickupDate)
      .filter((d): d is Date => d !== null && d instanceof Date);
    const periodStart = loadDates.length > 0
      ? new Date(Math.min(...loadDates.map((d) => d.getTime())))
      : new Date();
    const periodEnd = loadDates.length > 0
      ? new Date(Math.max(...loadDates.map((d) => d.getTime())))
      : new Date();

    const settlement = await prisma.settlement.create({
      data: {
        driverId: validated.driverId,
        settlementNumber,
        loadIds: validated.loadIds,
        grossPay,
        deductions: validated.deductions,
        advances: validated.advances,
        netPay,
        notes: validated.notes,
        status: 'PENDING',
        periodStart,
        periodEnd,
      },
    });

    // Note: Settlement references loads via loadIds array, not the other way around
    // No need to update loads with settlementId

    // Send notification
    await notifySettlementGenerated(settlement.id);

    return NextResponse.json(
      {
        success: true,
        data: settlement,
        message: 'Settlement generated successfully',
      },
      { status: 201 }
    );
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

    console.error('Settlement generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}


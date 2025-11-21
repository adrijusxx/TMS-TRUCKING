import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/fleet/maintenance/schedules
 * Get preventive maintenance schedules with due dates calculated
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const truckId = searchParams.get('truckId');
    const status = searchParams.get('status');

    // Get all trucks
    const trucks = await prisma.truck.findMany({
      where: {
        companyId: session.user.companyId,
        deletedAt: null,
        isActive: true,
        ...(truckId ? { id: truckId } : {}),
      },
      select: {
        id: true,
        truckNumber: true,
        make: true,
        model: true,
        odometerReading: true,
        lastMaintenance: true,
      },
    });

    // Get maintenance records to calculate schedules
    const maintenanceRecords = await prisma.maintenanceRecord.findMany({
      where: {
        truck: {
          companyId: session.user.companyId,
          deletedAt: null,
        },
        completedDate: { not: null },
        truckId: { in: trucks.map((t) => t.id) },
      },
      select: {
        id: true,
        truckId: true,
        type: true,
        completedDate: true,
        mileage: true,
      },
      orderBy: {
        completedDate: 'desc',
      },
    });

    // Define standard maintenance intervals (in miles and months)
    const maintenanceIntervals: Record<string, { miles: number; months: number }> = {
      OIL_CHANGE: { miles: 15000, months: 6 },
      TIRE_ROTATION: { miles: 10000, months: 6 },
      BRAKE_SERVICE: { miles: 50000, months: 12 },
      INSPECTION: { miles: 25000, months: 12 },
      PMI: { miles: 30000, months: 6 },
      ENGINE: { miles: 100000, months: 24 },
      TRANSMISSION: { miles: 60000, months: 18 },
      REPAIR: { miles: 0, months: 0 }, // No schedule for repairs
      OTHER: { miles: 0, months: 0 },
    };

    const now = new Date();
    const schedules: any[] = [];

    // Create schedules for each truck and maintenance type
    trucks.forEach((truck) => {
      Object.entries(maintenanceIntervals).forEach(([type, interval]) => {
        if (interval.miles === 0 && interval.months === 0) return; // Skip types without intervals

        // Find last service of this type for this truck
        const lastService = maintenanceRecords.find(
          (r) => r.truckId === truck.id && r.type === type
        );

        const lastServiceDate = lastService?.completedDate
          ? new Date(lastService.completedDate)
          : truck.lastMaintenance || null;
        const lastServiceMiles = lastService?.mileage || truck.odometerReading || 0;

        // Calculate next service date and mileage
        let nextServiceDate: Date | null = null;
        let nextServiceMiles: number | null = null;

        if (lastServiceDate) {
          // Calculate next service date (months)
          if (interval.months > 0) {
            nextServiceDate = new Date(lastServiceDate);
            nextServiceDate.setMonth(nextServiceDate.getMonth() + interval.months);
          }

          // Calculate next service mileage
          if (interval.miles > 0) {
            nextServiceMiles = lastServiceMiles + interval.miles;
          }
        }

        // Determine if overdue
        let isOverdue = false;
        let daysUntilDue: number | null = null;

        if (nextServiceDate) {
          const daysDiff = Math.floor((now.getTime() - nextServiceDate.getTime()) / (1000 * 60 * 60 * 24));
          daysUntilDue = -daysDiff;
          isOverdue = daysDiff > 0;
        } else if (nextServiceMiles) {
          const milesRemaining = nextServiceMiles - truck.odometerReading;
          daysUntilDue = null; // Can't calculate days from miles alone
          isOverdue = milesRemaining < 0;
        }

        // Filter by status
        if (status === 'overdue' && !isOverdue) return;
        if (status === 'due_soon' && (daysUntilDue === null || daysUntilDue > 7 || isOverdue)) return;
        if (status === 'upcoming' && (isOverdue || (daysUntilDue !== null && daysUntilDue <= 7))) return;

        schedules.push({
          id: `${truck.id}-${type}`,
          truckId: truck.id,
          truck: {
            id: truck.id,
            truckNumber: truck.truckNumber,
            make: truck.make,
            model: truck.model,
            odometerReading: truck.odometerReading,
          },
          maintenanceType: type,
          intervalMiles: interval.miles,
          intervalMonths: interval.months,
          lastServiceDate: lastServiceDate?.toISOString() || null,
          lastServiceMiles: lastServiceMiles || null,
          nextServiceDate: nextServiceDate?.toISOString() || null,
          nextServiceMiles: nextServiceMiles,
          isOverdue,
          daysUntilDue,
          milesUntilDue: nextServiceMiles ? nextServiceMiles - truck.odometerReading : null,
        });
      });
    });

    // Sort by overdue first, then by due date
    schedules.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      if (a.daysUntilDue !== null && b.daysUntilDue !== null) {
        return a.daysUntilDue - b.daysUntilDue;
      }
      return 0;
    });

    return NextResponse.json({
      success: true,
      data: {
        schedules,
      },
    });
  } catch (error: any) {
    console.error('Error fetching maintenance schedules:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch maintenance schedules',
        },
      },
      { status: 500 }
    );
  }
}


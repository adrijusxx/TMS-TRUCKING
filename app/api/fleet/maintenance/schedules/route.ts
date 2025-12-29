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

    // Get custom/override schedules from DB
    const dbSchedules = await prisma.maintenanceSchedule.findMany({
      where: {
        companyId: session.user.companyId,
        // We fetch ALL (active and inactive) to know which defaults to hide
        isActive: true,
        deletedAt: null,
        ...(truckId ? { truckId } : {}),
      },
    });

    // Get maintenance records to calculate due dates
    const maintenanceRecords = await prisma.maintenanceRecord.findMany({
      where: {
        companyId: session.user.companyId,
        truckId: { in: trucks.map((t) => t.id) },
        status: 'COMPLETED',
      },
      select: {
        id: true,
        truckId: true,
        type: true,
        date: true,
        odometer: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Default intervals
    const defaultIntervals: Record<string, { miles: number; months: number }> = {
      PM_A: { miles: 15000, months: 6 },
      PM_B: { miles: 30000, months: 12 },
      TIRES: { miles: 50000, months: 24 },
      REPAIR: { miles: 0, months: 0 },
    };

    const now = new Date();
    const schedules: any[] = [];

    trucks.forEach((truck) => {
      // Get all unique types (defaults + custom DB types)
      const types = Array.from(new Set([
        ...Object.keys(defaultIntervals),
        ...dbSchedules.filter((s: any) => s.truckId === truck.id).map((s: any) => s.maintenanceType)
      ]));

      types.forEach((type: any) => {
        // Find if there's a custom schedule for this truck and type
        const customSchedule = dbSchedules.find(
          (s: any) => s.truckId === truck.id && s.maintenanceType === type
        );

        // If an override exists and it's marked as inactive, hide this schedule entirely
        if (customSchedule && customSchedule.active === false) return;

        const interval = customSchedule
          ? { miles: customSchedule.intervalMiles, months: customSchedule.intervalMonths }
          : defaultIntervals[type as string];

        if (!interval || (interval.miles === 0 && interval.months === 0)) return;

        // Find last service
        const lastService = maintenanceRecords.find(
          (r: any) => r.truckId === truck.id && r.type === type
        );

        const lastServiceDate = lastService?.date
          ? new Date(lastService.date)
          : truck.lastMaintenance || null;
        const lastServiceMiles = lastService?.odometer || truck.odometerReading || 0;

        let nextServiceDate: Date | null = null;
        let nextServiceMiles: number | null = null;

        if (lastServiceDate) {
          if (interval.months > 0) {
            nextServiceDate = new Date(lastServiceDate);
            nextServiceDate.setMonth(nextServiceDate.getMonth() + interval.months);
          }
          if (interval.miles > 0) {
            nextServiceMiles = lastServiceMiles + interval.miles;
          }
        }

        let isOverdue = false;
        let daysUntilDue: number | null = null;

        if (nextServiceDate) {
          const daysDiff = Math.floor((now.getTime() - nextServiceDate.getTime()) / (1000 * 60 * 60 * 24));
          daysUntilDue = -daysDiff;
          isOverdue = daysDiff > 0;
        } else if (nextServiceMiles) {
          const milesRemaining = nextServiceMiles - truck.odometerReading;
          isOverdue = milesRemaining < 0;
        }

        if (status === 'overdue' && !isOverdue) return;
        if (status === 'due_soon' && (daysUntilDue === null || daysUntilDue > 7 || isOverdue)) return;
        if (status === 'upcoming' && (isOverdue || (daysUntilDue !== null && daysUntilDue <= 7))) return;

        schedules.push({
          id: customSchedule?.id || `default-${truck.id}-${type}`,
          isCustom: !!customSchedule,
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

    schedules.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      if (a.daysUntilDue !== null && b.daysUntilDue !== null) return a.daysUntilDue - b.daysUntilDue;
      return 0;
    });

    return NextResponse.json({ success: true, data: { schedules } });
  } catch (error: any) {
    console.error('Error fetching maintenance schedules:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/fleet/maintenance/schedules
 * Create or update a maintenance schedule
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    }

    const body = await request.json();
    const { truckId, maintenanceType, intervalMiles, intervalMonths } = body;

    if (!truckId || !maintenanceType) {
      return NextResponse.json({ success: false, error: { message: 'Missing truckId or maintenanceType' } }, { status: 400 });
    }

    // Upsert custom schedule
    const schedule = await prisma.maintenanceSchedule.upsert({
      where: {
        // Note: In a real scenario, we might want a compound unique index on truckId + maintenanceType
        // For now, we'll find existing first or create
        id: body.id || 'new-id',
      },
      update: {
        intervalMiles: parseInt(intervalMiles) || 0,
        intervalMonths: parseInt(intervalMonths) || 0,
        active: body.active !== undefined ? body.active : true,
        isActive: true,
      },
      create: {
        truckId,
        companyId: session.user.companyId,
        maintenanceType,
        intervalMiles: parseInt(intervalMiles) || 0,
        intervalMonths: parseInt(intervalMonths) || 0,
        active: body.active !== undefined ? body.active : true,
      },
    });

    return NextResponse.json({ success: true, data: schedule });
  } catch (error: any) {
    console.error('Error saving schedule:', error);
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}


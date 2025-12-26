import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/fleet/maintenance/stats
 * Get preventive maintenance statistics
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

    // Get maintenance schedules (reuse logic from schedules endpoint)
    const trucks = await prisma.truck.findMany({
      where: {
        companyId: session.user.companyId,
        deletedAt: null,
        isActive: true,
      },
      select: {
        id: true,
        odometerReading: true,
        lastMaintenance: true,
      },
    });

    const maintenanceRecords = await prisma.maintenanceRecord.findMany({
      where: {
        truck: {
          companyId: session.user.companyId,
          deletedAt: null,
        },
        truckId: { in: trucks.map((t) => t.id) },
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

    const maintenanceIntervals: Record<string, { miles: number; months: number }> = {
      OIL_CHANGE: { miles: 15000, months: 6 },
      TIRE_ROTATION: { miles: 10000, months: 6 },
      BRAKE_SERVICE: { miles: 50000, months: 12 },
      INSPECTION: { miles: 25000, months: 12 },
      PMI: { miles: 30000, months: 6 },
      ENGINE: { miles: 100000, months: 24 },
      TRANSMISSION: { miles: 60000, months: 18 },
    };

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    let totalScheduled = 0;
    let overdue = 0;
    let dueSoon = 0;
    let completed = 0;

    trucks.forEach((truck) => {
      Object.entries(maintenanceIntervals).forEach(([type, interval]) => {
        if (interval.miles === 0 && interval.months === 0) return;

        totalScheduled++;

        const lastService = maintenanceRecords.find((r) => r.truckId === truck.id && r.type === type);
        const lastServiceDate = lastService?.date
          ? new Date(lastService.date)
          : truck.lastMaintenance || null;

        if (lastServiceDate) {
          const nextServiceDate = new Date(lastServiceDate);
          nextServiceDate.setMonth(nextServiceDate.getMonth() + interval.months);

          const daysDiff = Math.floor((now.getTime() - nextServiceDate.getTime()) / (1000 * 60 * 60 * 24));

          if (daysDiff > 0) {
            overdue++;
          } else if (daysDiff >= -7) {
            dueSoon++;
          }
        }
      });
    });

    // Count completed this month (records with a service date in this month)
    completed = await prisma.maintenanceRecord.count({
      where: {
        truck: {
          companyId: session.user.companyId,
          deletedAt: null,
        },
        date: {
          gte: monthStart,
          lte: now,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        totalScheduled,
        overdue,
        dueSoon,
        completed,
      },
    });
  } catch (error: any) {
    console.error('Error fetching maintenance stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch maintenance stats',
        },
      },
      { status: 500 }
    );
  }
}


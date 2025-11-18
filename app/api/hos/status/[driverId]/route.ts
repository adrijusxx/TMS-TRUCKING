import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { notifyHOSViolation } from '@/lib/notifications/triggers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ driverId: string }> }
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
    // Verify driver belongs to company
    const driver = await prisma.driver.findFirst({
      where: {
        id: resolvedParams.driverId,
        companyId: session.user.companyId,
        deletedAt: null,
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

    // Get last 8 days of HOS records for 70-hour calculation
    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

    const records = await prisma.hOSRecord.findMany({
      where: {
        driverId: resolvedParams.driverId,
        date: { gte: eightDaysAgo },
      },
      orderBy: { date: 'desc' },
    });

    // Calculate totals (already in hours)
    const totalOnDuty = records.reduce((sum, r) => sum + r.onDutyTime, 0);
    const totalDriving = records.reduce((sum, r) => sum + r.driveTime, 0);
    const totalSleeperBerth = records.reduce((sum, r) => sum + r.sleeperTime, 0);
    const totalOffDuty = records.reduce((sum, r) => sum + r.offDutyTime, 0);

    const onDutyHours = totalOnDuty;
    const drivingHours = totalDriving;
    const sleeperBerthHours = totalSleeperBerth;
    const offDutyHours = totalOffDuty;

    // DOT Compliance Rules
    const violations: string[] = [];
    const warnings: string[] = [];

    // 11-hour driving limit
    if (drivingHours > 11) {
      violations.push(`Driving time exceeds 11-hour limit: ${drivingHours.toFixed(1)} hours`);
    } else if (drivingHours > 10) {
      warnings.push(`Approaching 11-hour driving limit: ${drivingHours.toFixed(1)} hours`);
    }

    // 14-hour on-duty limit
    if (onDutyHours > 14) {
      violations.push(`On-duty time exceeds 14-hour limit: ${onDutyHours.toFixed(1)} hours`);
    } else if (onDutyHours > 13) {
      warnings.push(`Approaching 14-hour on-duty limit: ${onDutyHours.toFixed(1)} hours`);
    }

    // 70-hour/8-day limit
    if (onDutyHours > 70) {
      violations.push(`70-hour/8-day limit exceeded: ${onDutyHours.toFixed(1)} hours`);
    } else if (onDutyHours > 65) {
      warnings.push(`Approaching 70-hour/8-day limit: ${onDutyHours.toFixed(1)} hours`);
    }

    // 30-minute break requirement (after 8 hours of driving)
    const todayRecord = records.find(
      (r) => r.date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]
    );
    if (todayRecord && todayRecord.driveTime >= 8 && todayRecord.offDutyTime < 0.5) {
      violations.push('30-minute break required after 8 hours of driving');
    }

    // Calculate available hours
    const availableDriving = Math.max(0, 11 - drivingHours);
    const availableOnDuty = Math.max(0, 14 - onDutyHours);
    const available70Hour = Math.max(0, 70 - onDutyHours);

    // Send notifications for violations
    if (violations.length > 0) {
      for (const violation of violations) {
        await notifyHOSViolation(
          resolvedParams.driverId,
          violation,
          violation
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        driverId: resolvedParams.driverId,
        period: {
          startDate: eightDaysAgo.toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
        },
        totals: {
          onDuty: {
            hours: parseFloat(onDutyHours.toFixed(2)),
            minutes: totalOnDuty,
          },
          driving: {
            hours: parseFloat(drivingHours.toFixed(2)),
            minutes: totalDriving,
          },
          sleeperBerth: {
            hours: parseFloat(sleeperBerthHours.toFixed(2)),
            minutes: totalSleeperBerth,
          },
          offDuty: {
            hours: parseFloat(offDutyHours.toFixed(2)),
            minutes: totalOffDuty,
          },
        },
        available: {
          driving: parseFloat(availableDriving.toFixed(2)),
          onDuty: parseFloat(availableOnDuty.toFixed(2)),
          '70Hour': parseFloat(available70Hour.toFixed(2)),
        },
        violations,
        warnings,
        records: records.map((r) => ({
          date: r.date.toISOString().split('T')[0],
          onDuty: r.onDutyTime,
          driving: r.driveTime,
          sleeperBerth: r.sleeperTime,
          offDuty: r.offDutyTime,
        })),
      },
    });
  } catch (error) {
    console.error('HOS status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}


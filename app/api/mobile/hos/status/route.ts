import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * Get driver's HOS status for mobile app
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
      where: {
        userId: session.user.id,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!driver) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_DRIVER', message: 'User is not a driver' },
        },
        { status: 403 }
      );
    }

    // Get today's HOS record
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayRecord = await prisma.hOSRecord.findFirst({
      where: {
        driverId: driver.id,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get last 8 days of records for weekly totals
    const eightDaysAgo = new Date(today);
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

    const weeklyRecords = await prisma.hOSRecord.findMany({
      where: {
        driverId: driver.id,
        date: {
          gte: eightDaysAgo,
        },
      },
    });

    // Calculate totals
    const todayHours = {
      driveTime: todayRecord?.driveTime || 0,
      onDutyTime: todayRecord?.onDutyTime || 0,
      offDutyTime: todayRecord?.offDutyTime || 0,
      sleeperTime: todayRecord?.sleeperTime || 0,
    };

    const weeklyHours = {
      driveTime: weeklyRecords.reduce((sum, r) => sum + r.driveTime, 0),
      onDutyTime: weeklyRecords.reduce((sum, r) => sum + r.onDutyTime, 0),
    };

    // Calculate available hours
    const availableHours = {
      driving: Math.max(0, 11 - todayHours.driveTime),
      onDuty: Math.max(0, 14 - todayHours.onDutyTime),
      weekly: Math.max(0, 70 - weeklyHours.onDutyTime),
    };

    // Check for violations
    const violations: string[] = [];
    const warnings: string[] = [];

    if (todayHours.driveTime >= 11) {
      violations.push('11-hour driving limit exceeded');
    } else if (todayHours.driveTime > 10) {
      warnings.push('Approaching 11-hour driving limit');
    }

    if (todayHours.onDutyTime >= 14) {
      violations.push('14-hour on-duty limit exceeded');
    } else if (todayHours.onDutyTime > 13) {
      warnings.push('Approaching 14-hour on-duty limit');
    }

    if (weeklyHours.onDutyTime >= 70) {
      violations.push('70-hour/8-day limit exceeded');
    } else if (weeklyHours.onDutyTime > 65) {
      warnings.push('Approaching 70-hour/8-day limit');
    }

    return NextResponse.json({
      success: true,
      data: {
        driverId: driver.id,
        status: todayRecord?.status || 'OFF_DUTY',
        today: todayHours,
        weekly: weeklyHours,
        available: availableHours,
        violations,
        warnings,
        lastUpdated: todayRecord?.updatedAt || null,
      },
    });
  } catch (error) {
    console.error('Mobile HOS status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}


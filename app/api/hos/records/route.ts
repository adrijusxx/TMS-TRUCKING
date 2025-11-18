import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createHOSRecordSchema = z.object({
  driverId: z.string().cuid(),
  date: z.string().or(z.date()),
  driveTime: z.number().min(0).default(0), // hours
  onDutyTime: z.number().min(0).default(0), // hours
  sleeperTime: z.number().min(0).default(0), // hours
  offDutyTime: z.number().min(0).default(0), // hours
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  status: z.enum(['AVAILABLE', 'ON_DUTY', 'DRIVING', 'OFF_DUTY', 'SLEEPER_BERTH', 'ON_LEAVE', 'INACTIVE']).optional(),
});

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
    const driverId = searchParams.get('driverId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {
      driver: {
        companyId: session.user.companyId,
      },
    };

    if (driverId) {
      where.driverId = driverId;
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const records = await prisma.hOSRecord.findMany({
      where,
      include: {
        driver: {
          select: {
            id: true,
            driverNumber: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      data: records,
    });
  } catch (error) {
    console.error('HOS records fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

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
    const validated = createHOSRecordSchema.parse(body);

    // Verify driver belongs to company
    const driver = await prisma.driver.findFirst({
      where: {
        id: validated.driverId,
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

    const date = validated.date instanceof Date
      ? validated.date
      : new Date(validated.date);

    const record = await prisma.hOSRecord.create({
      data: {
        driverId: validated.driverId,
        date,
        driveTime: validated.driveTime,
        onDutyTime: validated.onDutyTime,
        sleeperTime: validated.sleeperTime,
        offDutyTime: validated.offDutyTime,
        location: validated.location,
        latitude: validated.latitude,
        longitude: validated.longitude,
        status: validated.status || 'ON_DUTY',
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: record,
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

    console.error('HOS record creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}


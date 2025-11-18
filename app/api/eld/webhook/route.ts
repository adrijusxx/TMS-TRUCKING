import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { SamsaraWebhookVerifier } from '@/lib/integrations/samsara-webhook';
import { DriverStatus } from '@prisma/client';

// ELD webhook schema - supports both generic and Samsara formats
const eldWebhookSchema = z.object({
  driverId: z.string().optional(),
  driverNumber: z.string().optional(),
  samsaraDriverId: z.string().optional(), // Samsara-specific
  timestamp: z.string().or(z.date()),
  status: z.enum(['ON_DUTY', 'DRIVING', 'OFF_DUTY', 'SLEEPER_BERTH']).optional(),
  // Samsara status format
  currentState: z.enum(['offDuty', 'driving', 'onDuty', 'onDutyNotDriving', 'sleeper']).optional(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().optional(),
  }).optional(),
  odometer: z.number().optional(),
  engineHours: z.number().optional(),
  // Samsara HOS data
  hosStatuses: z.array(z.object({
    status: z.string(),
    shiftStart: z.string().optional(),
    shiftRemaining: z.number().optional(), // minutes
    cycleRemaining: z.number().optional(), // minutes
    drivingInViolationToday: z.number().optional(), // hours
    drivingInViolationCycle: z.number().optional(), // hours
  })).optional(),
  // Add more fields based on ELD provider API
});

export async function POST(request: NextRequest) {
  try {
    const samsaraSignature = request.headers.get('x-samsara-signature');
    const rawBody = await request.text();

    if (samsaraSignature) {
      try {
        const verifier = SamsaraWebhookVerifier.fromEnvironment();
        const isValid = verifier.verify(rawBody, samsaraSignature);

        if (!isValid) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_SIGNATURE',
                message: 'Invalid webhook signature',
              },
            },
            { status: 401 }
          );
        }
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_CONFIGURED',
              message: (error as Error).message || 'Samsara webhook secret not configured',
            },
          },
          { status: 401 }
        );
      }
    } else {
      const authHeader = request.headers.get('authorization');
      const apiKey = request.headers.get('x-api-key');

      if (!authHeader && !apiKey) {
        return NextResponse.json(
          { success: false, error: { code: 'UNAUTHORIZED', message: 'Missing authentication' } },
          { status: 401 }
        );
      }
    }

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_JSON', message: 'Invalid JSON payload' },
        },
        { status: 400 }
      );
    }

    const validated = eldWebhookSchema.parse(body);

    // Find driver by driverId, driverNumber, or Samsara ID
    let driver;
    if (validated.driverId) {
      driver = await prisma.driver.findUnique({
        where: { id: validated.driverId },
      });
    } else if (validated.driverNumber) {
      driver = await prisma.driver.findUnique({
        where: { driverNumber: validated.driverNumber },
      });
    } else if (validated.samsaraDriverId) {
      // Find driver by Samsara ID stored in HOSRecord
      const hosRecord = await prisma.hOSRecord.findFirst({
        where: {
          eldRecordId: validated.samsaraDriverId,
          eldProvider: 'Samsara',
        },
        orderBy: { createdAt: 'desc' },
      });
      if (hosRecord) {
        driver = await prisma.driver.findUnique({
          where: { id: hosRecord.driverId },
        });
      }
    }

    if (!driver) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Driver not found' },
        },
        { status: 404 }
      );
    }

    const timestamp = validated.timestamp instanceof Date
      ? validated.timestamp
      : new Date(validated.timestamp);
    const date = timestamp.toISOString().split('T')[0];

    // Get or create today's HOS record
    const todayRecord = await prisma.hOSRecord.findFirst({
      where: {
        driverId: driver.id,
        date: new Date(date),
      },
    });

    // Determine driver status from validated data
    let driverStatus: DriverStatus | undefined = validated.status;
    if (!driverStatus && validated.currentState) {
      // Map Samsara status to our DriverStatus
      const statusMap: Record<string, DriverStatus> = {
        'offDuty': DriverStatus.OFF_DUTY,
        'driving': DriverStatus.DRIVING,
        'onDuty': DriverStatus.ON_DUTY,
        'onDutyNotDriving': DriverStatus.ON_DUTY,
        'sleeper': DriverStatus.SLEEPER_BERTH,
      };
      const currentState = validated.currentState;
      driverStatus = statusMap[currentState] || DriverStatus.OFF_DUTY;
    }

    // Update driver status
    if (driverStatus) {
      await prisma.driver.update({
        where: { id: driver.id },
        data: {
          status: driverStatus as any,
        },
      });
    }

    // Create or update HOS record
    const today = new Date(timestamp);
    today.setHours(0, 0, 0, 0);

    const hosData: any = {
      driverId: driver.id,
      date: today,
      status: (driverStatus as any) || 'ON_DUTY',
      location: validated.location?.address,
      latitude: validated.location?.latitude,
      longitude: validated.location?.longitude,
      eldProvider: validated.samsaraDriverId ? 'Samsara' : undefined,
      eldRecordId: validated.samsaraDriverId || undefined,
    };

    // Add HOS time data if provided (from Samsara)
    if (validated.hosStatuses && validated.hosStatuses.length > 0) {
      const currentHOS = validated.hosStatuses[0];
      hosData.driveTime = currentHOS.drivingInViolationToday || 0;
      hosData.onDutyTime = (currentHOS.shiftRemaining || 0) / 60; // Convert minutes to hours
      hosData.weeklyDriveTime = currentHOS.drivingInViolationCycle || 0;
      hosData.weeklyOnDuty = (currentHOS.cycleRemaining || 0) / 60;
    }

    // Check if record exists for today
    const existingRecord = await prisma.hOSRecord.findFirst({
      where: {
        driverId: driver.id,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    if (existingRecord) {
      await prisma.hOSRecord.update({
        where: { id: existingRecord.id },
        data: hosData,
      });
    } else {
      await prisma.hOSRecord.create({
        data: hosData,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'ELD data received and processed',
      data: {
        driverId: driver.id,
        status: driverStatus,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid webhook data',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    console.error('ELD webhook error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}


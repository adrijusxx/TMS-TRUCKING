import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { SamsaraWebhookVerifier } from '@/lib/integrations/samsara-webhook';
import { DriverStatus } from '@prisma/client';

// ELD webhook schema - supports both generic and Samsara formats
const eldWebhookSchema = z.object({
  // Generic fields
  driverId: z.string().optional(),
  driverNumber: z.string().optional(),
  samsaraDriverId: z.string().optional(),
  timestamp: z.string().or(z.date()).optional(),
  status: z.enum(['ON_DUTY', 'DRIVING', 'OFF_DUTY', 'SLEEPER_BERTH']).optional(),
  currentState: z.enum(['offDuty', 'driving', 'onDuty', 'onDutyNotDriving', 'sleeper']).optional(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().optional(),
  }).optional(),

  // Samsara Webhook Event structure (e.g. vehicleFaultCode.detected)
  type: z.string().optional(),
  eventTime: z.string().optional(),
  data: z.any().optional(),

  // Samsara HOS data (sometimes top level)
  hosStatuses: z.array(z.any()).optional(),
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
            { success: false, error: { code: 'INVALID_SIGNATURE', message: 'Invalid signature' } },
            { status: 401 }
          );
        }
      } catch (error) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_CONFIGURED', message: 'Secret not configured' } },
          { status: 401 }
        );
      }
    }

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ success: false, error: { code: 'INVALID_JSON', message: 'Invalid JSON' } }, { status: 400 });
    }

    const validated = eldWebhookSchema.parse(body);

    // 1. Handle Vehicle Fault Code Events
    if (validated.type === 'vehicleFaultCode.detected' || validated.type === 'vehicleFaultCode.resolved') {
      const faultData = validated.data;
      const vehicle = faultData?.vehicle;
      const fault = faultData?.faultCode;

      if (vehicle?.id && fault?.code) {
        const truck = await prisma.truck.findFirst({
          where: { samsaraId: vehicle.id, deletedAt: null },
        });

        if (truck) {
          const isActive = validated.type === 'vehicleFaultCode.detected';

          await prisma.truckFaultHistory.upsert({
            where: {
              truckId_faultCode_occurredAt: {
                truckId: truck.id,
                faultCode: fault.code,
                occurredAt: new Date(validated.eventTime || new Date()),
              },
            },
            update: {
              isActive,
              resolvedAt: isActive ? null : new Date(),
            },
            create: {
              truckId: truck.id,
              companyId: truck.companyId,
              faultCode: fault.code,
              description: fault.description,
              severity: fault.severity?.toUpperCase(),
              spnId: fault.spn,
              fmiId: fault.fmi,
              isActive,
              occurredAt: new Date(validated.eventTime || new Date()),
              source: 'SAMSARA',
              samsaraVehicleId: vehicle.id,
            },
          });

          return NextResponse.json({ success: true, message: 'Fault code processed' });
        }
      }
    }

    // 2. Handle HOS/Status Updates
    // Find driver by driverId, driverNumber, or Samsara ID
    let driver;
    const samsaraDriverId = validated.samsaraDriverId || (validated.type?.startsWith('hos') ? validated.data?.driver?.id : null);

    if (validated.driverId) {
      driver = await prisma.driver.findUnique({ where: { id: validated.driverId } });
    } else if (validated.driverNumber) {
      driver = await prisma.driver.findFirst({ where: { driverNumber: validated.driverNumber } });
    } else if (samsaraDriverId) {
      driver = await prisma.driver.findFirst({
        where: {
          OR: [
            { licenseNumber: samsaraDriverId },
            { hosRecords: { some: { eldRecordId: samsaraDriverId, eldProvider: 'Samsara' } } }
          ]
        }
      });
    }

    if (!driver) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Driver not found' } }, { status: 404 });
    }

    const timestamp = validated.timestamp || validated.eventTime || new Date();
    const tsDate = new Date(timestamp);
    const dateOnly = new Date(tsDate.getFullYear(), tsDate.getMonth(), tsDate.getDate());

    // Determine driver status
    let driverStatus: DriverStatus | undefined = validated.status;
    if (!driverStatus && (validated.currentState || validated.data?.status)) {
      const statusMap: Record<string, DriverStatus> = {
        'offDuty': DriverStatus.OFF_DUTY,
        'driving': DriverStatus.DRIVING,
        'onDuty': DriverStatus.ON_DUTY,
        'onDutyNotDriving': DriverStatus.ON_DUTY,
        'sleeper': DriverStatus.SLEEPER_BERTH,
      };
      driverStatus = statusMap[validated.currentState || validated.data?.status] || DriverStatus.OFF_DUTY;
    }

    if (driverStatus) {
      await prisma.driver.update({
        where: { id: driver.id },
        data: { status: driverStatus as DriverStatus },
      });
    }

    // Create or update HOS record
    const hosData: any = {
      driverId: driver.id,
      date: dateOnly,
      status: (driverStatus as any) || 'ON_DUTY',
      location: validated.location?.address || validated.data?.location?.address,
      latitude: validated.location?.latitude || validated.data?.location?.latitude,
      longitude: validated.location?.longitude || validated.data?.location?.longitude,
      eldProvider: 'Samsara',
      eldRecordId: samsaraDriverId || undefined,
    };

    // Correct Mapping: Similar to sync route, caution with total hours
    const hosStatuses = validated.hosStatuses || validated.data?.hosStatuses;
    if (hosStatuses && hosStatuses.length > 0) {
      const currentHOS = hosStatuses[0];
      hosData.driveTime = currentHOS.drivingInViolationToday || 0;
      hosData.onDutyTime = (currentHOS.shiftRemaining || 0) / 60;
      hosData.weeklyDriveTime = currentHOS.drivingInViolationCycle || 0;
      hosData.weeklyOnDuty = (currentHOS.cycleRemaining || 0) / 60;
    }

    const existingRecord = await prisma.hOSRecord.findFirst({
      where: {
        driverId: driver.id,
        date: dateOnly,
      },
    });

    if (existingRecord) {
      await prisma.hOSRecord.update({ where: { id: existingRecord.id }, data: hosData });
    } else {
      await prisma.hOSRecord.create({ data: hosData });
    }

    return NextResponse.json({ success: true, message: 'Webook processed' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', details: error.issues } }, { status: 400 });
    }
    console.error('Webhook error:', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal error' } }, { status: 500 });
  }
}



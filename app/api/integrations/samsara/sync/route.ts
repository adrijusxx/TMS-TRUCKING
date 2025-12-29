import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { DriverStatus } from '@prisma/client';
import {
  getSamsaraDrivers,
  getSamsaraHOSStatuses,
  getSamsaraVehicles,
  syncSamsaraHOSToDriver,
} from '@/lib/integrations/samsara';

/**
 * Sync Samsara drivers and HOS data to our system
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Get Samsara drivers
    const samsaraDrivers = await getSamsaraDrivers();
    if (!samsaraDrivers || samsaraDrivers.length === 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NO_DATA',
          message: 'No drivers found in Samsara or API key not configured',
        },
      });
    }

    const syncedDrivers: string[] = [];
    const errors: string[] = [];

    // Sync each Samsara driver to our system
    for (const samsaraDriver of samsaraDrivers) {
      try {
        // Try to find driver by license number or create mapping
        const driver = await prisma.driver.findFirst({
          where: {
            companyId: session.user.companyId,
            OR: [
              { licenseNumber: samsaraDriver.licenseNumber || '' },
              // You could also match by email or other fields
            ],
            deletedAt: null,
          },
        });

        if (driver) {
          // Update driver status based on Samsara HOS status
          const hosStatuses = await getSamsaraHOSStatuses([samsaraDriver.id]);
          if (hosStatuses && hosStatuses.length > 0) {
            const currentStatus = hosStatuses[0];
            
            // Map Samsara status to our DriverStatus
            const statusMap: Record<string, string> = {
              'offDuty': 'OFF_DUTY',
              'driving': 'DRIVING',
              'onDuty': 'ON_DUTY',
              'onDutyNotDriving': 'ON_DUTY',
              'sleeper': 'SLEEPER_BERTH',
            };

            const newStatus = statusMap[currentStatus.status] || 'OFF_DUTY';

            await prisma.driver.update({
              where: { id: driver.id },
              data: { status: newStatus as any },
            });

            // Create or update HOS record for today
            const today = new Date();
            today.setHours(0, 0, 0, 0);

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
                data: {
                  status: newStatus as any,
                  driveTime: currentStatus.drivingInViolationToday || 0,
                  onDutyTime: (currentStatus.shiftRemaining || 0) / 60, // Convert minutes to hours
                  weeklyDriveTime: currentStatus.drivingInViolationCycle || 0,
                  weeklyOnDuty: (currentStatus.cycleRemaining || 0) / 60,
                  eldProvider: 'Samsara',
                  eldRecordId: samsaraDriver.id,
                },
              });
            } else {
              await prisma.hOSRecord.create({
                data: {
                  driverId: driver.id,
                  date: today,
                  status: newStatus as any,
                  driveTime: currentStatus.drivingInViolationToday || 0,
                  onDutyTime: (currentStatus.shiftRemaining || 0) / 60, // Convert minutes to hours
                  weeklyDriveTime: currentStatus.drivingInViolationCycle || 0,
                  weeklyOnDuty: (currentStatus.cycleRemaining || 0) / 60,
                  eldProvider: 'Samsara',
                  eldRecordId: samsaraDriver.id,
                },
              });
            }

            syncedDrivers.push(driver.driverNumber);
          }
        }
      } catch (error: any) {
        errors.push(`Failed to sync driver ${samsaraDriver.name}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        syncedCount: syncedDrivers.length,
        syncedDrivers,
        errors: errors.length > 0 ? errors : undefined,
      },
      message: `Synced ${syncedDrivers.length} driver(s) from Samsara`,
    });
  } catch (error: any) {
    console.error('Samsara sync error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to sync with Samsara',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Get Samsara sync status
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

    // Check if API key is configured
    const apiKey = process.env.SAMSARA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_CONFIGURED',
          message: 'Samsara API key not configured',
        },
      });
    }

    // Test API connection
    const drivers = await getSamsaraDrivers();

    return NextResponse.json({
      success: true,
      data: {
        configured: true,
        connected: drivers !== null,
        driverCount: drivers?.length || 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to check Samsara status',
        },
      },
      { status: 500 }
    );
  }
}


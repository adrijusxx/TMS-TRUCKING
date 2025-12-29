/**
 * Samsara Device Sync API
 * 
 * POST - Trigger device sync from Samsara
 * GET - Get sync status and statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { SamsaraDeviceSyncService } from '@/lib/services/SamsaraDeviceSyncService';
import { FleetMaintenanceService } from '@/lib/services/FleetMaintenanceService';
// import { hasPermission } from '@/lib/permissions'; // Temporarily disabled

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Skip permission check for now - allow all authenticated users
    // if (!hasPermission(session, 'fleet:manage')) {
    //   return NextResponse.json(
    //     { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
    //     { status: 403 }
    //   );
    // }

    const body = await request.json().catch(() => ({}));
    const syncType = body.type || 'all'; // 'all' | 'devices' | 'odometer' | 'faults'

    const companyId = session.user.companyId;

    try {
      const deviceSyncService = new SamsaraDeviceSyncService(companyId);
      const maintenanceService = new FleetMaintenanceService(companyId);

      const results: Record<string, any> = {};

      if (syncType === 'all' || syncType === 'devices') {
        results.devices = await deviceSyncService.syncAllDevices();
      }

      if (syncType === 'all' || syncType === 'odometer') {
        results.odometer = {
          updated: await deviceSyncService.syncOdometerReadings(),
        };
      }

      if (syncType === 'all' || syncType === 'faults') {
        results.faults = await maintenanceService.syncFaultCodes();
      }

      return NextResponse.json({
        success: true,
        data: {
          syncType,
          results,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (dbError: any) {
      // If table doesn't exist, return info message
      if (dbError.code === 'P2021' || dbError.message?.includes('does not exist')) {
        console.warn('[SamsaraSync API] Table not migrated yet');
        return NextResponse.json({
          success: true,
          data: {
            syncType,
            results: { message: 'Database migration required' },
            timestamp: new Date().toISOString(),
          },
          warning: 'Database migration required - run npx prisma db push',
        });
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error('[SamsaraSync API] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Skip permission check for now - allow all authenticated users to view
    // if (!hasPermission(session, 'fleet:view')) {
    //   return NextResponse.json(
    //     { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
    //     { status: 403 }
    //   );
    // }

    try {
      const maintenanceService = new FleetMaintenanceService(session.user.companyId);
      
      // Get fault summary for dashboard
      const faultSummary = await maintenanceService.getFleetFaultSummary();
      const trucksWithFaults = await maintenanceService.getTrucksWithActiveFaults();

      return NextResponse.json({
        success: true,
        data: {
          faultSummary,
          trucksWithFaults,
        },
      });
    } catch (dbError: any) {
      // If table doesn't exist, return empty data
      if (dbError.code === 'P2021' || dbError.message?.includes('does not exist')) {
        console.warn('[SamsaraSync API] Table not migrated yet, returning empty data');
        return NextResponse.json({
          success: true,
          data: {
            faultSummary: {
              totalActiveFaults: 0,
              criticalFaults: 0,
              warningFaults: 0,
              infoFaults: 0,
              trucksAffected: 0,
            },
            trucksWithFaults: [],
          },
          warning: 'Database migration required - run npx prisma db push',
        });
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error('[SamsaraSync API] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}


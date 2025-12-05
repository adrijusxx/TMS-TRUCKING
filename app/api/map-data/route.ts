/**
 * Lightweight Map Data API
 * 
 * Returns minimal data for War Room map rendering.
 * Target: Max 5KB payload for 150+ assets.
 * 
 * Note: Currently returns empty set as truck GPS coordinates
 * are fetched from Samsara integration, not stored in database.
 * Use /api/live-map for real-time data from Samsara.
 * 
 * @see docs/specs/OPERATIONAL_OVERHAUL.MD Section 2.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import {
  MapPoint,
  MapDataResponse,
  determineStatus,
  getClusterGroup,
  createMarkerLabel,
} from '@/lib/types/map-point';

// ============================================
// GET /api/map-data
// ============================================

export async function GET(request: NextRequest): Promise<NextResponse<MapDataResponse>> {
  try {
    // 1. Auth check
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { 
          success: false, 
          data: [], 
          meta: { totalCount: 0, byType: { trucks: 0, loads: 0, drivers: 0 }, timestamp: new Date().toISOString() }
        },
        { status: 401 }
      );
    }

    // 2. Build MC filter
    const mcWhere = await buildMcNumberWhereClause(session, request);

    // Note: Truck GPS coordinates (currentLat, currentLng) are not stored in the database.
    // Real-time location data comes from Samsara integration via /api/live-map endpoint.
    // This endpoint returns an empty set or placeholder data.

    // 3. Fetch active loads with location data
    const loads = await prisma.load.findMany({
      where: {
        ...mcWhere,
        deletedAt: null,
        status: {
          in: ['ASSIGNED', 'EN_ROUTE_PICKUP', 'AT_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY', 'AT_DELIVERY'],
        },
      },
      select: {
        id: true,
        loadNumber: true,
        status: true,
        // Get pickup and delivery coordinates if available
        pickupCity: true,
        pickupState: true,
        deliveryCity: true,
        deliveryState: true,
        // Get assigned truck/driver info
        truck: {
          select: {
            id: true,
            truckNumber: true,
            status: true,
          },
        },
        driver: {
          select: {
            id: true,
            driverNumber: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              }
            }
          }
        },
      },
      take: 200,
    });

    // 4. Build map points from loads (placeholder - no actual coordinates)
    const mapPoints: MapPoint[] = [];

    // Note: Since we don't have GPS coordinates in the database,
    // we can only return metadata. For actual map display,
    // use the Samsara-powered /api/live-map endpoint.

    // 5. Build response
    const response: MapDataResponse = {
      success: true,
      data: mapPoints,
      meta: {
        totalCount: mapPoints.length,
        byType: {
          trucks: 0,
          loads: loads.length,
          drivers: 0,
        },
        timestamp: new Date().toISOString(),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[map-data] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        data: [], 
        meta: { totalCount: 0, byType: { trucks: 0, loads: 0, drivers: 0 }, timestamp: new Date().toISOString() }
      },
      { status: 500 }
    );
  }
}

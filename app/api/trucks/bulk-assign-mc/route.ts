/**
 * Bulk Assign MC Number to Trucks
 * 
 * POST - Assign an MC number to multiple trucks at once
 * GET - Get trucks without MC number assigned
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

/**
 * GET /api/trucks/bulk-assign-mc
 * Get list of trucks without MC number assigned
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

    // Get trucks without MC number
    const trucksWithoutMc = await prisma.truck.findMany({
      where: {
        companyId: session.user.companyId,
        mcNumberId: null,
        deletedAt: null,
        isActive: true,
      },
      select: {
        id: true,
        truckNumber: true,
        vin: true,
        make: true,
        model: true,
        year: true,
        samsaraId: true,
      },
      orderBy: { truckNumber: 'asc' },
    });

    // Get total count of trucks
    const totalTrucks = await prisma.truck.count({
      where: {
        companyId: session.user.companyId,
        deletedAt: null,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        trucksWithoutMc,
        counts: {
          withoutMc: trucksWithoutMc.length,
          total: totalTrucks,
          withMc: totalTrucks - trucksWithoutMc.length,
        },
      },
    });
  } catch (error: any) {
    console.error('[BulkAssignMC API] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/trucks/bulk-assign-mc
 * Assign MC number to multiple trucks
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId || !session.user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Check permission
    const role = session.user.role as 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER';
    if (!hasPermission(role, 'trucks.edit')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { truckIds, mcNumberId, assignAll } = body;

    if (!mcNumberId) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'MC Number ID is required' } },
        { status: 400 }
      );
    }

    // Verify MC number belongs to company
    const mcNumber = await prisma.mcNumber.findFirst({
      where: {
        id: mcNumberId,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!mcNumber) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid MC Number' } },
        { status: 400 }
      );
    }

    // Build where clause
    const whereClause: any = {
      companyId: session.user.companyId,
      deletedAt: null,
      isActive: true,
    };

    if (assignAll) {
      // Assign to all trucks without MC
      whereClause.mcNumberId = null;
    } else if (truckIds && Array.isArray(truckIds) && truckIds.length > 0) {
      // Assign to specific trucks
      whereClause.id = { in: truckIds };
    } else {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Either truckIds or assignAll is required' } },
        { status: 400 }
      );
    }

    // Update trucks
    const result = await prisma.truck.updateMany({
      where: whereClause,
      data: { mcNumberId },
    });

    return NextResponse.json({
      success: true,
      data: {
        updatedCount: result.count,
        mcNumber: {
          id: mcNumber.id,
          number: mcNumber.number,
          companyName: mcNumber.companyName,
        },
      },
    });
  } catch (error: any) {
    console.error('[BulkAssignMC API] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}


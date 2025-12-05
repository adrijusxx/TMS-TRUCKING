/**
 * Samsara Device Queue API
 * 
 * GET - List pending devices in queue
 * POST - Approve/Link/Reject a queued device
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { SamsaraDeviceSyncService } from '@/lib/services/SamsaraDeviceSyncService';
// import { hasPermission } from '@/lib/permissions'; // Temporarily disabled

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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING';
    const deviceType = searchParams.get('deviceType'); // TRUCK | TRAILER
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    // Enhanced filtering parameters
    const search = searchParams.get('search'); // Search name, VIN, license plate
    const make = searchParams.get('make');
    const model = searchParams.get('model');
    const yearMin = searchParams.get('yearMin') ? parseInt(searchParams.get('yearMin')!) : undefined;
    const yearMax = searchParams.get('yearMax') ? parseInt(searchParams.get('yearMax')!) : undefined;
    const reviewedById = searchParams.get('reviewedById');
    const createdFrom = searchParams.get('createdFrom'); // ISO date string
    const createdTo = searchParams.get('createdTo'); // ISO date string

    // Check if table exists by trying a simple query
    try {
      const where: any = {
        companyId: session.user.companyId,
      };

      // Status filter
      if (status !== 'all') {
        where.status = status;
      }

      // Device type filter
      if (deviceType) {
        where.deviceType = deviceType;
      }

      // Search filter (name, VIN, license plate)
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { vin: { contains: search, mode: 'insensitive' } },
          { licensePlate: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Make filter
      if (make) {
        where.make = { contains: make, mode: 'insensitive' };
      }

      // Model filter
      if (model) {
        where.model = { contains: model, mode: 'insensitive' };
      }

      // Year range filter
      if (yearMin || yearMax) {
        where.year = {};
        if (yearMin) where.year.gte = yearMin;
        if (yearMax) where.year.lte = yearMax;
      }

      // Reviewer filter
      if (reviewedById) {
        where.reviewedById = reviewedById;
      }

      // Date range filter
      if (createdFrom || createdTo) {
        where.createdAt = {};
        if (createdFrom) where.createdAt.gte = new Date(createdFrom);
        if (createdTo) where.createdAt.lte = new Date(createdTo);
      }

      const [items, total] = await Promise.all([
        prisma.samsaraDeviceQueue.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            reviewedBy: {
              select: { firstName: true, lastName: true },
            },
          },
        }),
        prisma.samsaraDeviceQueue.count({ where }),
      ]);

      // Get counts by status
      const statusCounts = await prisma.samsaraDeviceQueue.groupBy({
        by: ['status'],
        where: { companyId: session.user.companyId },
        _count: true,
      });

      // Get counts by status AND device type (for linked breakdown)
      const statusDeviceTypeCounts = await prisma.samsaraDeviceQueue.groupBy({
        by: ['status', 'deviceType'],
        where: { companyId: session.user.companyId },
        _count: true,
      });

      // Get distinct filter options
      const [makes, models, years] = await Promise.all([
        prisma.samsaraDeviceQueue.findMany({
          where: { companyId: session.user.companyId, make: { not: null } },
          select: { make: true },
          distinct: ['make'],
        }),
        prisma.samsaraDeviceQueue.findMany({
          where: { companyId: session.user.companyId, model: { not: null } },
          select: { model: true },
          distinct: ['model'],
        }),
        prisma.samsaraDeviceQueue.findMany({
          where: { companyId: session.user.companyId, year: { not: null } },
          select: { year: true },
          distinct: ['year'],
          orderBy: { year: 'desc' },
        }),
      ]);

      // Calculate linked trucks vs trailers
      const linkedTrucks = statusDeviceTypeCounts.find(
        s => s.status === 'LINKED' && s.deviceType === 'TRUCK'
      )?._count || 0;
      const linkedTrailers = statusDeviceTypeCounts.find(
        s => s.status === 'LINKED' && s.deviceType === 'TRAILER'
      )?._count || 0;

      return NextResponse.json({
        success: true,
        data: {
          items,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
          },
          counts: {
            pending: statusCounts.find(s => s.status === 'PENDING')?._count || 0,
            approved: statusCounts.find(s => s.status === 'APPROVED')?._count || 0,
            linked: statusCounts.find(s => s.status === 'LINKED')?._count || 0,
            linkedTrucks, // Trucks only
            linkedTrailers, // Trailers only
            rejected: statusCounts.find(s => s.status === 'REJECTED')?._count || 0,
          },
          filterOptions: {
            makes: makes.map(m => m.make).filter(Boolean),
            models: models.map(m => m.model).filter(Boolean),
            years: years.map(y => y.year).filter(Boolean),
          },
        },
      });
    } catch (dbError: any) {
      // If table doesn't exist, return empty data
      if (dbError.code === 'P2021' || dbError.message?.includes('does not exist')) {
        console.warn('[DeviceQueue API] Table not migrated yet, returning empty data');
        return NextResponse.json({
          success: true,
          data: {
            items: [],
            pagination: { page: 1, pageSize: 50, total: 0, totalPages: 0 },
            counts: { pending: 0, approved: 0, linked: 0, rejected: 0 },
          },
          warning: 'Database migration required - run npx prisma db push',
        });
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error('[DeviceQueue API] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId || !session.user.id) {
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

    const body = await request.json();
    const { action, queueId, recordId, recordType, reason, additionalData } = body;

    if (!action || !queueId) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Missing action or queueId' } },
        { status: 400 }
      );
    }

    try {
      const syncService = new SamsaraDeviceSyncService(session.user.companyId);

      switch (action) {
        case 'approve': {
          const result = await syncService.approveQueuedDevice(queueId, session.user.id, additionalData);
          if (!result.success) {
            return NextResponse.json(
              { success: false, error: { code: 'OPERATION_FAILED', message: result.error } },
              { status: 400 }
            );
          }
          return NextResponse.json({
            success: true,
            data: { recordId: result.recordId, action: 'approved' },
          });
        }

        case 'link': {
          if (!recordId || !recordType) {
            return NextResponse.json(
              { success: false, error: { code: 'BAD_REQUEST', message: 'Missing recordId or recordType' } },
              { status: 400 }
            );
          }
          const result = await syncService.linkQueuedDevice(queueId, recordId, recordType, session.user.id);
          if (!result.success) {
            return NextResponse.json(
              { success: false, error: { code: 'OPERATION_FAILED', message: result.error } },
              { status: 400 }
            );
          }
          return NextResponse.json({
            success: true,
            data: { action: 'linked', recordId },
          });
        }

        case 'reject': {
          const result = await syncService.rejectQueuedDevice(queueId, session.user.id, reason);
          if (!result.success) {
            return NextResponse.json(
              { success: false, error: { code: 'OPERATION_FAILED', message: result.error } },
              { status: 400 }
            );
          }
          return NextResponse.json({
            success: true,
            data: { action: 'rejected' },
          });
        }

        default:
          return NextResponse.json(
            { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid action' } },
            { status: 400 }
          );
      }
    } catch (dbError: any) {
      // If table doesn't exist, return info message
      if (dbError.code === 'P2021' || dbError.message?.includes('does not exist')) {
        return NextResponse.json({
          success: false,
          error: { code: 'DB_NOT_READY', message: 'Database migration required - run npx prisma db push' },
        }, { status: 400 });
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error('[DeviceQueue API] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}


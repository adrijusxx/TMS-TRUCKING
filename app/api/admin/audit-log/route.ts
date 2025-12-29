/**
 * Admin API for fetching audit logs
 * GET /api/admin/audit-log?entity=load&entityId=xxx&page=1&limit=50
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check admin role
    const isAdmin = session.user.role === 'ADMIN';
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const entity = searchParams.get('entity');
    const entityId = searchParams.get('entityId');
    const action = searchParams.get('action'); // CREATE, UPDATE, DELETE
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    const where: any = {};

    if (entity) where.entityType = entity;
    if (entityId) where.entityId = entityId;
    if (action) where.action = action;
    if (userId) where.userId = userId;

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) where.createdAt.lte = new Date(toDate);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          userId: true,
          action: true,
          entityType: true,
          entityId: true,
          metadata: true,
          ipAddress: true,
          createdAt: true,
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Get user names for the logs
    const userIds = [...new Set(logs.map(l => l.userId))];
    const users = userIds.length > 0 ? await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true, email: true },
    }) : [];
    const userMap = new Map(users.map(u => [u.id, u]));

    const logsWithUsers = logs.map(log => {
      const user = userMap.get(log.userId);
      const userName = user
        ? `${user.firstName} ${user.lastName}`.trim() || user.email || 'Unknown'
        : 'Unknown';
      return {
        ...log,
        userName,
      };
    });

    // Get summary by action type
    const summary = await prisma.auditLog.groupBy({
      by: ['action'],
      _count: { id: true },
      where: where.createdAt ? { createdAt: where.createdAt } : undefined,
    });

    return NextResponse.json({
      success: true,
      data: {
        logs: logsWithUsers,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        summary: summary.reduce((acc, s) => ({ ...acc, [s.action]: s._count.id }), {}),
      },
    });
  } catch (error: any) {
    console.error('[Audit Log API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { logger } from '@/lib/utils/logger';

// ============================================
// Valid settings areas for filtering
// ============================================

const VALID_AREAS = [
  'general',
  'notifications',
  'integrations',
  'security',
  'appearance',
  'billing',
  'company',
  'settlement-automation',
  'role-permissions',
  'menu-visibility',
  'custom-fields',
  'scheduled-jobs',
];

// ============================================
// GET /api/settings/audit-log
// ============================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    if (!hasPermission(session.user.role as any, 'settings.view')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const area = url.searchParams.get('area');
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10), 100);
    const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);

    // Build query filter
    const where: Record<string, unknown> = {
      companyId: session.user.companyId,
      entityType: 'SETTINGS',
    };

    if (area && VALID_AREAS.includes(area)) {
      where.entityId = area;
    }

    const [entries, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
      prisma.activityLog.count({ where }),
    ]);

    const data = entries.map((entry) => ({
      id: entry.id,
      area: entry.entityId,
      action: entry.action,
      description: entry.description,
      changes: (entry.metadata as any)?.changes ?? [],
      user: entry.user
        ? {
            id: entry.user.id,
            name: `${entry.user.firstName ?? ''} ${entry.user.lastName ?? ''}`.trim() || entry.user.email,
            email: entry.user.email,
          }
        : null,
      createdAt: entry.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    });
  } catch (error) {
    logger.error('Settings audit log error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch audit log' } },
      { status: 500 }
    );
  }
}

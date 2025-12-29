import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { LoadStatus } from '@prisma/client';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';

/**
 * Get load status distribution
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

    // Build MC filter - Load uses mcNumberId
    const loadMcWhere = await buildMcNumberWhereClause(session, request);

    // Get counts for each status
    const statusCounts = await prisma.load.groupBy({
      by: ['status'],
      where: {
        ...loadMcWhere,
        deletedAt: null,
      },
      _count: {
        id: true,
      },
    });

    const total = statusCounts.reduce((sum, item) => sum + item._count.id, 0);

    const distribution = statusCounts
      .map((item) => ({
        status: item.status,
        count: item._count.id,
        percentage: total > 0 ? (item._count.id / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      success: true,
      data: distribution,
    });
  } catch (error) {
    console.error('Load status distribution fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}


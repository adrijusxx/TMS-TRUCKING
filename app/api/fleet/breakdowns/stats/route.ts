import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/fleet/breakdowns/stats
 * Get breakdown statistics and analytics
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

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to 30 days ago
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : new Date();

    const where: any = {
      companyId: session.user.companyId,
      deletedAt: null,
      reportedAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Get all breakdowns in date range
    const breakdowns = await prisma.breakdown.findMany({
      where,
      select: {
        id: true,
        truckId: true,
        priority: true,
        breakdownType: true,
        status: true,
        totalCost: true,
        downtimeHours: true,
        truck: {
          select: {
            truckNumber: true,
          },
        },
      },
    });

    // Calculate statistics
    const total = breakdowns.length;
    const resolved = breakdowns.filter((b) => b.status === 'RESOLVED' || b.status === 'COMPLETED').length;
    const totalCost = breakdowns.reduce((sum, b) => sum + (b.totalCost || 0), 0);

    // Calculate average downtime
    const breakdownsWithDowntime = breakdowns.filter((b) => b.downtimeHours && b.downtimeHours > 0);
    const averageDowntime =
      breakdownsWithDowntime.length > 0
        ? breakdownsWithDowntime.reduce((sum, b) => sum + (b.downtimeHours || 0), 0) /
          breakdownsWithDowntime.length
        : 0;

    // Count by priority
    const byPriority = {
      CRITICAL: breakdowns.filter((b) => b.priority === 'CRITICAL').length,
      HIGH: breakdowns.filter((b) => b.priority === 'HIGH').length,
      MEDIUM: breakdowns.filter((b) => b.priority === 'MEDIUM').length,
      LOW: breakdowns.filter((b) => b.priority === 'LOW').length,
    };

    // Count by type
    const byType: Record<string, number> = {};
    breakdowns.forEach((b) => {
      byType[b.breakdownType] = (byType[b.breakdownType] || 0) + 1;
    });

    // Find recurring trucks (3+ breakdowns)
    const truckBreakdownCounts: Record<string, number> = {};
    breakdowns.forEach((b) => {
      truckBreakdownCounts[b.truckId] = (truckBreakdownCounts[b.truckId] || 0) + 1;
    });

    const recurringTrucks = Object.entries(truckBreakdownCounts)
      .filter(([_, count]) => count >= 3)
      .map(([truckId, count]) => {
        const breakdown = breakdowns.find((b) => b.truckId === truckId);
        return {
          truckId,
          truckNumber: breakdown?.truck.truckNumber || 'Unknown',
          count,
        };
      })
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      success: true,
      data: {
        total,
        resolved,
        totalCost,
        averageDowntime: Math.round(averageDowntime * 10) / 10,
        byPriority,
        byType,
        recurringTrucks,
      },
    });
  } catch (error: any) {
    console.error('Error fetching breakdown stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch breakdown stats',
        },
      },
      { status: 500 }
    );
  }
}


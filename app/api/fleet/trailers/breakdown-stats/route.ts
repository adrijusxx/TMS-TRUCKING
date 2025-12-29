import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/fleet/trailers/breakdown-stats
 * Get breakdown statistics for trailers
 * Note: Currently breakdowns are linked to trucks, but we can track breakdowns
 * that occurred when a trailer was assigned to a truck
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

    // Get all trailers
    const trailers = await prisma.trailer.findMany({
      where: {
        companyId: session.user.companyId,
        deletedAt: null,
      },
      select: {
        id: true,
        trailerNumber: true,
        assignedTruckId: true,
      },
    });

    // Get breakdowns for trucks that have assigned trailers
    const truckIds = trailers
      .map((t) => t.assignedTruckId)
      .filter((id): id is string => id !== null);

    const breakdowns = await prisma.breakdown.findMany({
      where: {
        companyId: session.user.companyId,
        deletedAt: null,
        truckId: { in: truckIds },
      },
      select: {
        id: true,
        truckId: true,
        reportedAt: true,
        breakdownType: true,
        priority: true,
        status: true,
      },
      orderBy: {
        reportedAt: 'desc',
      },
    });

    // Map truck breakdowns to trailers
    const trailerStats: Record<
      string,
      {
        totalBreakdowns: number;
        lastBreakdownDate: Date | null;
        breakdownFrequency: number;
        highRisk: boolean;
      }
    > = {};

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    trailers.forEach((trailer) => {
      if (!trailer.assignedTruckId) {
        trailerStats[trailer.id] = {
          totalBreakdowns: 0,
          lastBreakdownDate: null,
          breakdownFrequency: 0,
          highRisk: false,
        };
        return;
      }

      const truckBreakdowns = breakdowns.filter((b) => b.truckId === trailer.assignedTruckId);
      const stats = {
        totalBreakdowns: truckBreakdowns.length,
        lastBreakdownDate: truckBreakdowns.length > 0 ? truckBreakdowns[0].reportedAt : null,
        breakdownFrequency: 0,
        highRisk: false,
      };

      const recentBreakdowns = truckBreakdowns.filter((b) => b.reportedAt >= sixMonthsAgo).length;
      stats.breakdownFrequency = recentBreakdowns / 6;
      stats.highRisk = recentBreakdowns >= 3;

      trailerStats[trailer.id] = stats;
    });

    return NextResponse.json({
      success: true,
      data: trailerStats,
    });
  } catch (error: any) {
    console.error('Error fetching trailer breakdown stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch trailer breakdown stats',
        },
      },
      { status: 500 }
    );
  }
}


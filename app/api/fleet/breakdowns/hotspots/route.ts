import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/fleet/breakdowns/hotspots
 * Get breakdown hotspots (locations with multiple breakdowns)
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
      : new Date(Date.now() - 180 * 24 * 60 * 60 * 1000); // Default to 180 days ago
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : new Date();
    const minCount = parseInt(searchParams.get('minCount') || '2');
    const state = searchParams.get('state');

    const where: any = {
      companyId: session.user.companyId,
      deletedAt: null,
      reportedAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (state) {
      where.state = state;
    }

    // Get all breakdowns in date range
    const breakdowns = await prisma.breakdown.findMany({
      where,
      select: {
        id: true,
        breakdownNumber: true,
        location: true,
        city: true,
        state: true,
        latitude: true,
        longitude: true,
        breakdownType: true,
        priority: true,
        reportedAt: true,
      },
    });

    // Group by location
    const locationMap: Record<
      string,
      {
        location: string;
        city?: string;
        state?: string;
        latitude?: number;
        longitude?: number;
        breakdowns: Array<{
          id: string;
          breakdownNumber: string;
          reportedAt: Date;
          breakdownType: string;
          priority: string;
        }>;
      }
    > = {};

    breakdowns.forEach((breakdown) => {
      // Create a key from location, city, and state
      const key = `${breakdown.location}|${breakdown.city || ''}|${breakdown.state || ''}`;

      if (!locationMap[key]) {
        locationMap[key] = {
          location: breakdown.location,
          city: breakdown.city || undefined,
          state: breakdown.state || undefined,
          latitude: breakdown.latitude || undefined,
          longitude: breakdown.longitude || undefined,
          breakdowns: [],
        };
      }

      locationMap[key].breakdowns.push({
        id: breakdown.id,
        breakdownNumber: breakdown.breakdownNumber,
        reportedAt: breakdown.reportedAt,
        breakdownType: breakdown.breakdownType,
        priority: breakdown.priority,
      });
    });

    // Filter by minimum count and convert to array
    const hotspots = Object.values(locationMap)
      .filter((loc) => loc.breakdowns.length >= minCount)
      .map((loc) => ({
        location: loc.location,
        city: loc.city,
        state: loc.state,
        count: loc.breakdowns.length,
        latitude: loc.latitude,
        longitude: loc.longitude,
        breakdowns: loc.breakdowns
          .sort((a, b) => b.reportedAt.getTime() - a.reportedAt.getTime())
          .map((b) => ({
            id: b.id,
            breakdownNumber: b.breakdownNumber,
            reportedAt: b.reportedAt.toISOString(),
            breakdownType: b.breakdownType,
            priority: b.priority,
          })),
      }))
      .sort((a, b) => b.count - a.count);

    // Calculate statistics
    const byState: Record<string, number> = {};
    const byCity: Record<string, number> = {};
    const byTimeOfDay: Record<string, number> = {};

    breakdowns.forEach((b) => {
      if (b.state) {
        byState[b.state] = (byState[b.state] || 0) + 1;
      }
      if (b.city) {
        byCity[b.city] = (byCity[b.city] || 0) + 1;
      }
      const hour = new Date(b.reportedAt).getHours();
      const timeSlot = hour < 6 ? 'Night (12am-6am)' : hour < 12 ? 'Morning (6am-12pm)' : hour < 18 ? 'Afternoon (12pm-6pm)' : 'Evening (6pm-12am)';
      byTimeOfDay[timeSlot] = (byTimeOfDay[timeSlot] || 0) + 1;
    });

    const topHotspot = hotspots.length > 0 ? hotspots[0] : null;

    return NextResponse.json({
      success: true,
      data: {
        hotspots,
        stats: {
          totalLocations: Object.keys(locationMap).length,
          topHotspot,
          byState,
          byCity,
          byTimeOfDay,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching breakdown hotspots:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch breakdown hotspots',
        },
      },
      { status: 500 }
    );
  }
}


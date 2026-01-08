import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';

/**
 * GET /api/fleet/breakdowns/active
 * Get all active breakdowns for the dashboard
 * Returns breakdowns that are not RESOLVED or CANCELLED
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
    const priority = searchParams.get('priority'); // Filter by priority
    const assignedTo = searchParams.get('assignedTo'); // Filter by assigned staff

    // Build MC filter
    const mcWhere = await buildMcNumberWhereClause(session, request);

    const where: any = {
      companyId: session.user.companyId,
      deletedAt: null,
      status: {
        notIn: ['RESOLVED', 'CANCELLED'],
      },
    };

    // Add MC number filter if applicable (not in "all" mode)
    if (mcWhere.mcNumberId) {
      where.mcNumberId = mcWhere.mcNumberId;
    }

    if (priority) {
      where.priority = priority;
    }

    // Get active breakdowns with full details
    const breakdowns = await prisma.breakdown.findMany({
      where,
      include: {
        truck: {
          select: {
            id: true,
            truckNumber: true,
            make: true,
            model: true,
            year: true,
            vin: true,
            licensePlate: true,
            state: true,
            currentLocation: true,
          },
        },
        load: {
          select: {
            id: true,
            loadNumber: true,
            customer: {
              select: {
                name: true,
              },
            },
            pickupDate: true,
            deliveryDate: true,
            pickupTimeStart: true,
            deliveryTimeStart: true,
          },
        },
        driver: {
          select: {
            id: true,
            driverNumber: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        documents: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
            type: true,
            title: true,
            fileUrl: true,
            mimeType: true,
          },
          take: 5, // Limit to recent documents
        },
        assignments: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
              },
            },
          },
          orderBy: { assignedAt: 'asc' },
        },
        payments: {
          select: {
            id: true,
            paymentNumber: true,
            amount: true,
            paymentMethod: true,
            paymentDate: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' }, // Critical first
        { reportedAt: 'asc' }, // Oldest first within same priority
      ],
    });

    // Calculate time elapsed for each breakdown
    const breakdownsWithTimeElapsed = breakdowns.map((breakdown) => {
      const reportedAt = new Date(breakdown.reportedAt);
      const now = new Date();
      const elapsedMs = now.getTime() - reportedAt.getTime();
      const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
      const elapsedHours = Math.floor(elapsedMinutes / 60);
      const elapsedDays = Math.floor(elapsedHours / 24);

      let timeElapsed: string;
      if (elapsedDays > 0) {
        timeElapsed = `${elapsedDays}d ${elapsedHours % 24}h`;
      } else if (elapsedHours > 0) {
        timeElapsed = `${elapsedHours}h ${elapsedMinutes % 60}m`;
      } else {
        timeElapsed = `${elapsedMinutes}m`;
      }

      const totalPaid = breakdown.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
      return {
        ...breakdown,
        timeElapsed,
        elapsedMinutes,
        totalPaid,
      };
    });

    // Calculate summary stats
    const stats = {
      total: breakdowns.length,
      critical: breakdowns.filter((b) => b.priority === 'CRITICAL').length,
      high: breakdowns.filter((b) => b.priority === 'HIGH').length,
      medium: breakdowns.filter((b) => b.priority === 'MEDIUM').length,
      low: breakdowns.filter((b) => b.priority === 'LOW').length,
    };

    return NextResponse.json({
      success: true,
      data: {
        breakdowns: breakdownsWithTimeElapsed,
        stats,
      },
    });
  } catch (error: any) {
    console.error('Error fetching active breakdowns:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch active breakdowns',
        },
      },
      { status: 500 }
    );
  }
}


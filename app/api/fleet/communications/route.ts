import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/fleet/communications
 * Get all communications across all breakdown cases (for Communication Hub)
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
    const breakdownId = searchParams.get('breakdownId');
    const driverId = searchParams.get('driverId');
    const channel = searchParams.get('channel');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {
      companyId: session.user.companyId,
    };

    if (breakdownId) {
      where.breakdownId = breakdownId;
    }

    if (driverId) {
      where.driverId = driverId;
    }

    if (channel) {
      where.channel = channel;
    }

    if (status) {
      where.status = status;
    }

    // Check if Communication model exists (migration might not be run yet)
    if (!prisma.communication) {
      return NextResponse.json({
        success: true,
        data: {
          conversations: [],
          total: 0,
          limit,
          offset,
        },
        message: 'Communication model not yet migrated. Please run: npx prisma migrate dev',
      });
    }

    // Fetch communications
    // Handle case where Communication model doesn't exist yet (migration not run)
    let communications;
    try {
      communications = await prisma.communication.findMany({
      where,
      include: {
        breakdown: {
          select: {
            id: true,
            breakdownNumber: true,
            status: true,
            priority: true,
            truck: {
              select: {
                truckNumber: true,
              },
            },
          },
        },
        driver: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
      });
    } catch (error: any) {
      // If Communication model doesn't exist yet (migration not run)
      if (error?.message?.includes('communication') || error?.code === 'P2001') {
        return NextResponse.json({
          success: true,
          data: {
            conversations: [],
            total: 0,
            limit,
            offset,
          },
          message: 'Communication model not yet migrated. Please run: npx prisma migrate dev',
        });
      }
      throw error; // Re-throw if it's a different error
    }

    // Group communications by breakdown case for conversation view
    const conversations = new Map<string, any>();

    communications.forEach((comm) => {
      const key = comm.breakdownId || `driver-${comm.driverId}` || 'unassigned';
      
      if (!conversations.has(key)) {
        conversations.set(key, {
          breakdownId: comm.breakdownId,
          breakdown: comm.breakdown,
          driver: comm.driver,
          communications: [],
          lastMessageAt: comm.createdAt,
          unreadCount: 0,
        });
      }

      const conversation = conversations.get(key)!;
      conversation.communications.push(comm);
      
      // Update last message time
      if (new Date(comm.createdAt) > new Date(conversation.lastMessageAt)) {
        conversation.lastMessageAt = comm.createdAt;
      }
    });

    // Convert to array and sort by last message time
    const conversationsArray = Array.from(conversations.values()).sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );

    return NextResponse.json({
      success: true,
      data: {
        conversations: conversationsArray,
        total: communications.length,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Error fetching communications:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch communications',
        },
      },
      { status: 500 }
    );
  }
}


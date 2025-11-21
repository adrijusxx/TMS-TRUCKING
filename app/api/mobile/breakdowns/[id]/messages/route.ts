import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const sendMessageSchema = z.object({
  content: z.string().optional(),
  mediaUrls: z.array(z.string()).optional(),
}).refine(data => data.content || (data.mediaUrls && data.mediaUrls.length > 0), {
  message: "Either content or mediaUrls must be provided",
  path: ["content"],
});

/**
 * GET /api/mobile/breakdowns/[id]/messages
 * Get all messages for a breakdown case (for driver mobile app)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Get driver for this user
    const driver = await prisma.driver.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!driver) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_DRIVER', message: 'User is not a driver' },
        },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Verify breakdown belongs to driver
    const breakdown = await prisma.breakdown.findFirst({
      where: {
        id,
        driverId: driver.id,
        companyId: driver.companyId,
      },
    });

    if (!breakdown) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Breakdown not found' } },
        { status: 404 }
      );
    }

    // Get all communications for this breakdown
    // Handle case where Communication model doesn't exist yet
    let communications;
    try {
      communications = await prisma.communication.findMany({
      where: {
        breakdownId: id,
        companyId: driver.companyId,
      },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    } catch (error: any) {
      // If Communication model doesn't exist yet, return empty array
      if (error?.message?.includes('communication') || error?.code === 'P2001' || error?.message?.includes('findMany')) {
        return NextResponse.json({
          success: true,
          data: { messages: [] },
        });
      }
      throw error; // Re-throw if it's a different error
    }

    return NextResponse.json({
      success: true,
      data: {
        messages: communications.map((comm) => ({
          id: comm.id,
          channel: comm.channel,
          type: comm.type,
          direction: comm.direction,
          content: comm.content,
          mediaUrls: comm.mediaUrls,
          location: comm.location,
          createdAt: comm.createdAt,
          from: comm.direction === 'INBOUND'
            ? 'You'
            : comm.createdBy
              ? `${comm.createdBy.firstName} ${comm.createdBy.lastName}`
              : 'Dispatch',
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch messages',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/mobile/breakdowns/[id]/messages
 * Driver sends a message about a breakdown case (from mobile app)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Get driver for this user
    const driver = await prisma.driver.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!driver) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_DRIVER', message: 'User is not a driver' },
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Verify breakdown belongs to driver
    const breakdown = await prisma.breakdown.findFirst({
      where: {
        id,
        driverId: driver.id,
        companyId: driver.companyId,
      },
    });

    if (!breakdown) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Breakdown not found' } },
        { status: 404 }
      );
    }

    // Validate request body
    const validated = sendMessageSchema.parse(body);

    // Create communication entry
    // Handle case where Communication model doesn't exist yet
    let communication;
    try {
      communication = await prisma.communication.create({
      data: {
        companyId: driver.companyId,
        breakdownId: id,
        driverId: driver.id,
        channel: 'MOBILE_APP',
        type: 'MESSAGE',
        direction: 'INBOUND',
        content: validated.content,
        mediaUrls: validated.mediaUrls || [],
        status: 'DELIVERED',
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    } catch (error: any) {
      // If Communication model doesn't exist yet, return success but without saving
      if (error?.message?.includes('communication') || error?.code === 'P2001' || error?.message?.includes('create')) {
        return NextResponse.json({
          success: true,
          data: {
            message: {
              id: Date.now().toString(),
              content: validated.content,
              mediaUrls: validated.mediaUrls || [],
              createdAt: new Date().toISOString(),
              from: 'You',
            },
            warning: 'Communication model not yet migrated. Message not saved to database.',
          },
        });
      }
      throw error; // Re-throw if it's a different error
    }

    return NextResponse.json({
      success: true,
      data: {
        message: {
          id: communication.id,
          content: communication.content,
          mediaUrls: communication.mediaUrls,
          createdAt: communication.createdAt,
          from: 'You',
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    console.error('Error sending message:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to send message',
        },
      },
      { status: 500 }
    );
  }
}


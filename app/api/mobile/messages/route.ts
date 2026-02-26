import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const messageSchema = z.object({
  content: z.string().min(1).max(2000),
  loadId: z.string().cuid().optional(),
});

/**
 * GET /api/mobile/messages
 * Get messages for driver (optionally filtered by loadId)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const driver = await prisma.driver.findFirst({
      where: { userId: session.user.id, isActive: true, deletedAt: null },
    });

    if (!driver) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_DRIVER', message: 'User is not a driver' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const loadId = searchParams.get('loadId');

    const where: any = {
      driverId: driver.id,
      channel: 'MOBILE_APP',
      type: 'MESSAGE',
    };

    // Filter by load if provided (stored in metadata)
    if (loadId) {
      where.metadata = { path: ['loadId'], equals: loadId };
    }

    const messages = await prisma.communication.findMany({
      where,
      select: {
        id: true,
        content: true,
        direction: true,
        status: true,
        createdAt: true,
        createdBy: {
          select: { firstName: true, lastName: true },
        },
        metadata: true,
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    // Mark unread outbound messages as read
    await prisma.communication.updateMany({
      where: {
        driverId: driver.id,
        channel: 'MOBILE_APP',
        type: 'MESSAGE',
        direction: 'OUTBOUND',
        status: { in: ['SENT', 'DELIVERED'] },
      },
      data: { status: 'READ' },
    });

    const formatted = messages.map((msg) => ({
      id: msg.id,
      content: msg.content || '',
      direction: msg.direction,
      status: msg.status,
      createdAt: msg.createdAt,
      createdBy: msg.createdBy
        ? `${msg.createdBy.firstName} ${msg.createdBy.lastName}`
        : undefined,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Mobile messages error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/mobile/messages
 * Send a message from driver to dispatcher
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const driver = await prisma.driver.findFirst({
      where: { userId: session.user.id, isActive: true, deletedAt: null },
    });

    if (!driver) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_DRIVER', message: 'User is not a driver' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = messageSchema.parse(body);

    const message = await prisma.communication.create({
      data: {
        companyId: driver.companyId,
        driverId: driver.id,
        channel: 'MOBILE_APP',
        type: 'MESSAGE',
        direction: 'INBOUND',
        content: validated.content,
        status: 'SENT',
        createdById: session.user.id,
        metadata: validated.loadId ? { loadId: validated.loadId } : undefined,
      },
    });

    return NextResponse.json(
      { success: true, data: { id: message.id } },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.issues } },
        { status: 400 }
      );
    }

    console.error('Mobile send message error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}

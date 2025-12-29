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
 * POST /api/fleet/breakdowns/[id]/messages
 * Staff sends a message to driver about a breakdown case (via mobile app channel)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Verify breakdown belongs to company
    const breakdown = await prisma.breakdown.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
      include: {
        driver: true,
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
        companyId: session.user.companyId,
        breakdownId: id,
        driverId: breakdown.driverId || undefined,
        channel: 'MOBILE_APP',
        type: 'MESSAGE',
        direction: 'OUTBOUND',
        content: validated.content,
        mediaUrls: validated.mediaUrls || [],
        status: 'SENT',
        createdById: session.user.id,
      },
      include: {
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
    });
    } catch (error: any) {
      // If Communication model doesn't exist yet (migration not run)
      if (error?.message?.includes('communication') || error?.code === 'P2001' || error?.message?.includes('create')) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'MODEL_NOT_FOUND',
            message: 'Communication model not yet migrated. Please run: npx prisma migrate dev',
          },
        }, { status: 503 });
      }
      throw error; // Re-throw if it's a different error
    }

    // Send push notification to driver's mobile app (if configured)
    // To implement: Integrate with Firebase Cloud Messaging (FCM) or Apple Push Notification Service (APNS)
    // Example integration would go here:
    // if (driver?.deviceToken) {
    //   await sendPushNotification(driver.deviceToken, {
    //     title: 'New Breakdown Message',
    //     body: validatedData.message,
    //     data: { breakdownId, communicationId: communication.id }
    //   });
    // }

    return NextResponse.json({
      success: true,
      data: { communication },
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
          message: error instanceof Error ? error.message : 'Failed to send message',
        },
      },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createCommunicationSchema = z.object({
  channel: z.enum(['SIP', 'SMS', 'TELEGRAM', 'EMAIL', 'MOBILE_APP']),
  type: z.enum(['CALL', 'SMS', 'MMS', 'TELEGRAM', 'EMAIL', 'VOICEMAIL', 'NOTE', 'MESSAGE', 'BREAKDOWN_REPORT']),
  direction: z.enum(['INBOUND', 'OUTBOUND']),
  content: z.string().optional(),
  fromNumber: z.string().optional(),
  toNumber: z.string().optional(),
  telegramId: z.string().optional(),
  telegramChatId: z.string().optional(),
  emailAddress: z.string().optional(),
  duration: z.number().optional(),
  recordingUrl: z.string().optional(),
  mediaUrls: z.array(z.string()).optional(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string().optional(),
  }).optional(),
  externalId: z.string().optional(),
  providerMetadata: z.record(z.string(), z.any()).optional(),
});

/**
 * GET /api/fleet/breakdowns/[id]/communications
 * Get all communications for a breakdown case
 */
export async function GET(
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

    // Verify breakdown belongs to company
    const breakdown = await prisma.breakdown.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
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
        companyId: session.user.companyId,
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
      orderBy: {
        createdAt: 'desc',
      },
    });
    } catch (error: any) {
      // If Communication model doesn't exist yet (migration not run)
      if (error?.message?.includes('communication') || error?.code === 'P2001' || error?.message?.includes('findMany')) {
        return NextResponse.json({
          success: true,
          data: { communications: [] },
          message: 'Communication model not yet migrated. Please run: npx prisma migrate dev',
        });
      }
      throw error; // Re-throw if it's a different error
    }

    return NextResponse.json({
      success: true,
      data: { communications },
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

/**
 * POST /api/fleet/breakdowns/[id]/communications
 * Create a new communication for a breakdown case
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

    // Validate breakdown exists and belongs to company
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
    const validated = createCommunicationSchema.parse(body);

    // Create communication
    // Handle case where Communication model doesn't exist yet
    let communication;
    try {
      communication = await prisma.communication.create({
      data: {
        companyId: session.user.companyId,
        breakdownId: id,
        driverId: breakdown.driverId || undefined,
        channel: validated.channel,
        type: validated.type,
        direction: validated.direction,
        content: validated.content,
        fromNumber: validated.fromNumber,
        toNumber: validated.toNumber,
        telegramId: validated.telegramId,
        telegramChatId: validated.telegramChatId,
        emailAddress: validated.emailAddress,
        duration: validated.duration,
        recordingUrl: validated.recordingUrl,
        mediaUrls: validated.mediaUrls || [],
        location: validated.location || undefined,
        externalId: validated.externalId,
        providerMetadata: validated.providerMetadata ? (validated.providerMetadata as any) : undefined,
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

    console.error('Error creating communication:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create communication',
        },
      },
      { status: 500 }
    );
  }
}


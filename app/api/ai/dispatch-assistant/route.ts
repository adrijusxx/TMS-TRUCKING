import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { AIDispatchAssistant } from '@/lib/services/AIDispatchAssistant';
import { z } from 'zod';

const dispatchAssistantSchema = z.object({
  date: z.string().datetime().optional(),
  includeAssigned: z.boolean().optional().default(false),
});

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
    const date = searchParams.get('date');
    const includeAssigned = searchParams.get('includeAssigned') === 'true';

    const assistant = new AIDispatchAssistant();
    const recommendations = await assistant.getDispatchRecommendations({
      companyId: session.user.companyId,
      date: date ? new Date(date) : undefined,
      includeAssigned,
    });

    return NextResponse.json({ success: true, data: recommendations });
  } catch (error) {
    console.error('AI Dispatch Assistant API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get dispatch recommendations',
        },
      },
      { status: 500 }
    );
  }
}

const detectConflictsSchema = z.object({
  loadId: z.string().cuid('Invalid load ID'),
  driverId: z.string().cuid().optional(),
  truckId: z.string().cuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = detectConflictsSchema.parse(body);

    const assistant = new AIDispatchAssistant();
    const conflicts = await assistant.detectConflicts(
      session.user.companyId,
      validated.loadId,
      validated.driverId,
      validated.truckId
    );

    return NextResponse.json({ success: true, data: { conflicts } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }
    console.error('AI Dispatch Assistant Conflict Detection error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to detect conflicts',
        },
      },
      { status: 500 }
    );
  }
}




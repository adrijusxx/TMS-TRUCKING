import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { AILoadBoardIntelligence, LoadBoardLoad } from '@/lib/services/AILoadBoardIntelligence';
import { z } from 'zod';

const loadBoardAnalysisSchema = z.object({
  loads: z.array(z.object({
    loadId: z.string(),
    loadNumber: z.string(),
    pickupCity: z.string(),
    pickupState: z.string(),
    deliveryCity: z.string(),
    deliveryState: z.string(),
    equipmentType: z.string(),
    weight: z.number(),
    rate: z.number(),
    distance: z.number(),
    pickupDate: z.string(),
    deliveryDate: z.string(),
    commodity: z.string().optional(),
    hazmat: z.boolean().optional(),
  })),
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
    const validated = loadBoardAnalysisSchema.parse(body);

    const intelligence = new AILoadBoardIntelligence();
    const scores = await intelligence.scoreLoads(validated.loads as LoadBoardLoad[]);

    return NextResponse.json({ success: true, data: scores });
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
    console.error('AI Load Board Intelligence error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to score loads',
        },
      },
      { status: 500 }
    );
  }
}




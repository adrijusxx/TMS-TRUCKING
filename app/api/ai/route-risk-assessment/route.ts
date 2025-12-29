import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { AIRouteRiskAssessor } from '@/lib/services/AIRouteRiskAssessor';
import { z } from 'zod';

const routeRiskAssessmentSchema = z.object({
  pickupCity: z.string(),
  pickupState: z.string(),
  deliveryCity: z.string(),
  deliveryState: z.string(),
  totalMiles: z.number().positive(),
  pickupDate: z.string().datetime(),
  deliveryDate: z.string().datetime(),
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
    const validated = routeRiskAssessmentSchema.parse(body);

    const assessor = new AIRouteRiskAssessor();
    const result = await assessor.assessRouteRisk({
      pickupCity: validated.pickupCity,
      pickupState: validated.pickupState,
      deliveryCity: validated.deliveryCity,
      deliveryState: validated.deliveryState,
      totalMiles: validated.totalMiles,
      pickupDate: new Date(validated.pickupDate),
      deliveryDate: new Date(validated.deliveryDate),
    });

    return NextResponse.json({ success: true, data: result });
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
    console.error('AI Route Risk Assessment error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to assess route risk',
        },
      },
      { status: 500 }
    );
  }
}




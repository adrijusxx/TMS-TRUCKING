import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { AIBackhaulRecommender } from '@/lib/services/AIBackhaulRecommender';
import { z } from 'zod';

const backhaulRecommendationSchema = z.object({
  deliveryCity: z.string().min(1, 'Delivery city is required'),
  deliveryState: z.string().length(2, 'Delivery state must be 2 characters'),
  deliveryDate: z.string().datetime(),
  equipmentType: z.string().optional(),
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
    const validated = backhaulRecommendationSchema.parse(body);

    const recommender = new AIBackhaulRecommender();
    const result = await recommender.getBackhaulRecommendations({
      deliveryCity: validated.deliveryCity,
      deliveryState: validated.deliveryState,
      deliveryDate: new Date(validated.deliveryDate),
      equipmentType: validated.equipmentType,
      companyId: session.user.companyId,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('AI backhaul recommendation error:', error);

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

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get backhaul recommendations',
        },
      },
      { status: 500 }
    );
  }
}




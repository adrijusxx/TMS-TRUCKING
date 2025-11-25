import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { AIDynamicPricing } from '@/lib/services/AIDynamicPricing';
import { z } from 'zod';

const dynamicPricingSchema = z.object({
  pickupState: z.string().length(2),
  deliveryState: z.string().length(2),
  equipmentType: z.string(),
  totalMiles: z.number().positive(),
  loadId: z.string().optional(),
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
    const validated = dynamicPricingSchema.parse(body);

    const pricing = new AIDynamicPricing();
    const result = await pricing.getDynamicPricing(
      session.user.companyId,
      validated.pickupState,
      validated.deliveryState,
      validated.equipmentType,
      validated.totalMiles,
      validated.loadId
    );

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
    console.error('AI Dynamic Pricing error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get dynamic pricing',
        },
      },
      { status: 500 }
    );
  }
}




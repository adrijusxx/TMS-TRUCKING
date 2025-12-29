import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { AIFuelOptimizer } from '@/lib/services/AIFuelOptimizer';
import { z } from 'zod';

const fuelOptimizationSchema = z.object({
  pickupCity: z.string(),
  pickupState: z.string(),
  deliveryCity: z.string(),
  deliveryState: z.string(),
  totalMiles: z.number().positive(),
  truckId: z.string().optional(),
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
    const validated = fuelOptimizationSchema.parse(body);

    const optimizer = new AIFuelOptimizer();
    const result = await optimizer.getFuelOptimization(
      session.user.companyId,
      {
        pickupCity: validated.pickupCity,
        pickupState: validated.pickupState,
        deliveryCity: validated.deliveryCity,
        deliveryState: validated.deliveryState,
        totalMiles: validated.totalMiles,
      },
      validated.truckId
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
    console.error('AI Fuel Optimization error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get fuel optimization',
        },
      },
      { status: 500 }
    );
  }
}




import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { AISafetyPredictor } from '@/lib/services/AISafetyPredictor';
import { z } from 'zod';

const safetyRiskSchema = z.object({
  driverId: z.string().optional(),
  truckId: z.string().optional(),
}).refine((data) => data.driverId || data.truckId, {
  message: 'Either driverId or truckId must be provided',
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
    const validated = safetyRiskSchema.parse(body);

    // Verify driver/truck belongs to company
    const { prisma } = await import('@/lib/prisma');
    
    if (validated.driverId) {
      const driver = await prisma.driver.findFirst({
        where: {
          id: validated.driverId,
          companyId: session.user.companyId,
        },
      });

      if (!driver) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Driver not found' } },
          { status: 404 }
        );
      }
    }

    if (validated.truckId) {
      const truck = await prisma.truck.findFirst({
        where: {
          id: validated.truckId,
          companyId: session.user.companyId,
        },
      });

      if (!truck) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Truck not found' } },
          { status: 404 }
        );
      }
    }

    const predictor = new AISafetyPredictor();
    const result = await predictor.predictSafetyRisk({
      ...validated,
      companyId: session.user.companyId,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('AI safety risk prediction error:', error);

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
          message: error instanceof Error ? error.message : 'Failed to predict safety risk',
        },
      },
      { status: 500 }
    );
  }
}




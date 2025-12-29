import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { AIMaintenancePredictor } from '@/lib/services/AIMaintenancePredictor';
import { z } from 'zod';

const maintenancePredictionSchema = z.object({
  truckId: z.string().min(1, 'Truck ID is required'),
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
    const validated = maintenancePredictionSchema.parse(body);

    // Verify truck belongs to company
    const { prisma } = await import('@/lib/prisma');
    const truck = await prisma.truck.findFirst({
      where: {
        id: validated.truckId,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!truck) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Truck not found' } },
        { status: 404 }
      );
    }

    const predictor = new AIMaintenancePredictor();
    const result = await predictor.predictMaintenance({
      truckId: validated.truckId,
      companyId: session.user.companyId,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('AI maintenance prediction error:', error);

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
          message: error instanceof Error ? error.message : 'Failed to predict maintenance',
        },
      },
      { status: 500 }
    );
  }
}




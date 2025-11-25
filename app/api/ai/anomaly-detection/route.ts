import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { AIAnomalyDetector } from '@/lib/services/AIAnomalyDetector';
import { z } from 'zod';

const anomalyDetectionSchema = z.object({
  type: z.enum(['FUEL_COST', 'DELAY', 'REVENUE', 'MAINTENANCE_COST', 'DRIVER_BEHAVIOR', 'GENERAL']),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  driverId: z.string().optional(),
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
    const validated = anomalyDetectionSchema.parse(body);

    const detector = new AIAnomalyDetector();
    const result = await detector.detectAnomalies({
      companyId: session.user.companyId,
      type: validated.type,
      startDate: validated.startDate ? new Date(validated.startDate) : undefined,
      endDate: validated.endDate ? new Date(validated.endDate) : undefined,
      driverId: validated.driverId,
      truckId: validated.truckId,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('AI anomaly detection error:', error);

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
          message: error instanceof Error ? error.message : 'Failed to detect anomalies',
        },
      },
      { status: 500 }
    );
  }
}




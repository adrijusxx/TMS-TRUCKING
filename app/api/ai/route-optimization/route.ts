import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { AIRouteOptimizer } from '@/lib/services/AIRouteOptimizer';
import { z } from 'zod';

const routeOptimizationSchema = z.object({
  loadIds: z.array(z.string()).min(2, 'At least 2 loads required'),
  optimizationType: z.enum(['DISTANCE', 'TIME', 'COST']).default('DISTANCE'),
  startLocation: z.object({
    city: z.string(),
    state: z.string(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }).optional(),
  driverId: z.string().optional(),
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
    const validated = routeOptimizationSchema.parse(body);

    // Verify loads belong to company
    const { prisma } = await import('@/lib/prisma');
    const loads = await prisma.load.findMany({
      where: {
        id: { in: validated.loadIds },
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (loads.length !== validated.loadIds.length) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_LOADS', message: 'Some loads not found' } },
        { status: 400 }
      );
    }

    // Verify driver belongs to company if specified
    if (validated.driverId) {
      const driver = await prisma.driver.findFirst({
        where: {
          id: validated.driverId,
          companyId: session.user.companyId,
        },
      });

      if (!driver) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_DRIVER', message: 'Driver not found' } },
          { status: 400 }
        );
      }
    }

    const optimizer = new AIRouteOptimizer();
    const result = await optimizer.optimizeRoute({
      loadIds: validated.loadIds,
      optimizationType: validated.optimizationType,
      startLocation: validated.startLocation,
      driverId: validated.driverId,
      companyId: session.user.companyId,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('AI route optimization error:', error);

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
          message: error instanceof Error ? error.message : 'Failed to optimize route',
        },
      },
      { status: 500 }
    );
  }
}




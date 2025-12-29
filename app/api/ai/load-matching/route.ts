import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { AILoadMatchingService } from '@/lib/services/AILoadMatchingService';
import { z } from 'zod';

const loadMatchingSchema = z.object({
  loadId: z.string().min(1, 'Load ID is required'),
  availableDriverIds: z.array(z.string()).optional(),
  availableTruckIds: z.array(z.string()).optional(),
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
    const validated = loadMatchingSchema.parse(body);

    // Verify load belongs to company
    const { prisma } = await import('@/lib/prisma');
    const load = await prisma.load.findFirst({
      where: {
        id: validated.loadId,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!load) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Load not found' } },
        { status: 404 }
      );
    }

    // Verify drivers belong to company if specified
    if (validated.availableDriverIds && validated.availableDriverIds.length > 0) {
      const drivers = await prisma.driver.findMany({
        where: {
          id: { in: validated.availableDriverIds },
          companyId: session.user.companyId,
        },
      });

      if (drivers.length !== validated.availableDriverIds.length) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_DRIVERS', message: 'Some drivers not found' } },
          { status: 400 }
        );
      }
    }

    // Verify trucks belong to company if specified
    if (validated.availableTruckIds && validated.availableTruckIds.length > 0) {
      const trucks = await prisma.truck.findMany({
        where: {
          id: { in: validated.availableTruckIds },
          companyId: session.user.companyId,
        },
      });

      if (trucks.length !== validated.availableTruckIds.length) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_TRUCKS', message: 'Some trucks not found' } },
          { status: 400 }
        );
      }
    }

    const matchingService = new AILoadMatchingService();
    const result = await matchingService.getLoadMatches({
      loadId: validated.loadId,
      availableDriverIds: validated.availableDriverIds,
      availableTruckIds: validated.availableTruckIds,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('AI load matching error:', error);

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
          message: error instanceof Error ? error.message : 'Failed to get load matches',
        },
      },
      { status: 500 }
    );
  }
}




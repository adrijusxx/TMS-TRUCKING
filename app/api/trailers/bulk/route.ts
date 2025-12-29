import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { hasPermission } from '@/lib/permissions';
import { createActivityLog } from '@/lib/activity-log';

const bulkDeleteSchema = z.object({
  trailerIds: z.array(z.string().cuid()).min(1),
});

/**
 * Bulk delete trailers (soft delete)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Check permission to delete trailers
    const role = session.user.role as 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER';
    if (!hasPermission(role, 'trucks.delete')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to delete trailers',
          },
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = bulkDeleteSchema.parse(body);

    // Verify trailers belong to company (only get the ones that exist and aren't deleted)
    const trailers = await prisma.trailer.findMany({
      where: {
        id: { in: validated.trailerIds },
        companyId: session.user.companyId,
        deletedAt: null,
      },
      select: { id: true, trailerNumber: true },
    });

    const validTrailerIds = trailers.map((trailer) => trailer.id);
    const trailerNumbers = trailers.map((trailer) => trailer.trailerNumber);

    if (validTrailerIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_VALID_TRAILERS',
            message: 'No valid trailers found to delete',
          },
        },
        { status: 400 }
      );
    }

    // Check if any trailers have active loads
    const trailersWithActiveLoads = await prisma.load.findMany({
      where: {
        OR: [
          { trailerId: { in: validTrailerIds } },
          { trailerNumber: { in: trailerNumbers } },
        ],
        status: {
          in: ['ASSIGNED', 'EN_ROUTE_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY', 'AT_DELIVERY'],
        },
        deletedAt: null,
      },
      select: {
        trailerId: true,
        trailerNumber: true,
      },
      distinct: ['trailerId', 'trailerNumber'],
    });

    // Filter out trailers with active loads
    const trailersWithLoads = new Set<string>();
    trailersWithActiveLoads.forEach((load) => {
      if (load.trailerId && validTrailerIds.includes(load.trailerId)) {
        trailersWithLoads.add(load.trailerId);
      }
      if (load.trailerNumber && trailerNumbers.includes(load.trailerNumber)) {
        const trailer = trailers.find((t) => t.trailerNumber === load.trailerNumber);
        if (trailer) {
          trailersWithLoads.add(trailer.id);
        }
      }
    });

    const trailersToDelete = validTrailerIds.filter((id) => !trailersWithLoads.has(id));

    if (trailersToDelete.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONFLICT',
            message: `Cannot delete trailers: ${trailersWithLoads.size} trailer(s) have active loads`,
          },
        },
        { status: 409 }
      );
    }

    // Soft delete trailers (only the valid ones without active loads)
    const deleted = await prisma.trailer.updateMany({
      where: {
        id: { in: trailersToDelete },
      },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });


    // Create activity log
    await createActivityLog({
      companyId: session.user.companyId,
      userId: session.user.id,
      action: 'DELETE',
      entityType: 'Trailer',
      description: `Bulk deleted ${deleted.count} trailer(s)`,
      metadata: {
        trailerIds: validated.trailerIds,
        deletedCount: deleted.count,
        skippedCount: validated.trailerIds.length - trailersToDelete.length,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        deleted: deleted.count,
        skipped: validated.trailerIds.length - trailersToDelete.length,
        message: trailersWithLoads.size > 0
          ? `Deleted ${deleted.count} trailer(s). ${trailersWithLoads.size} trailer(s) skipped due to active loads.`
          : `Successfully deleted ${deleted.count} trailer(s)`,
      },
    });
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

    console.error('Bulk delete error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}


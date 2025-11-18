import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { hasPermission } from '@/lib/permissions';
import { createActivityLog } from '@/lib/activity-log';

const bulkDeleteSchema = z.object({
  driverIds: z.array(z.string().cuid()).min(1),
});

/**
 * Bulk delete drivers (soft delete)
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

    // Check permission to delete drivers
    const role = session.user.role as 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER';
    if (!hasPermission(role, 'drivers.delete')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to delete drivers',
          },
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = bulkDeleteSchema.parse(body);

    // Verify drivers belong to company (only get the ones that exist and aren't deleted)
    const drivers = await prisma.driver.findMany({
      where: {
        id: { in: validated.driverIds },
        companyId: session.user.companyId,
        deletedAt: null,
      },
      select: { id: true, userId: true },
    });

    const validDriverIds = drivers.map((driver) => driver.id);
    const userIds = drivers.map((driver) => driver.userId);

    if (validDriverIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_VALID_DRIVERS',
            message: 'No valid drivers found to delete',
          },
        },
        { status: 400 }
      );
    }

    // Soft delete drivers and users (only the valid ones)
    const [deletedDrivers, deletedUsers] = await Promise.all([
      prisma.driver.updateMany({
        where: {
          id: { in: validDriverIds },
        },
        data: {
          deletedAt: new Date(),
          isActive: false,
        },
      }),
      prisma.user.updateMany({
        where: {
          id: { in: userIds },
        },
        data: {
          deletedAt: new Date(),
          isActive: false,
        },
      }),
    ]);

    // Log if some drivers were skipped
    if (validDriverIds.length < validated.driverIds.length) {
      console.log(`[Bulk Delete] Skipped ${validated.driverIds.length - validDriverIds.length} drivers (already deleted or not found)`);
    }

    // Create activity log
    await createActivityLog({
      companyId: session.user.companyId,
      userId: session.user.id,
      action: 'DELETE',
      entityType: 'Driver',
      description: `Bulk deleted ${deletedDrivers.count} driver(s)`,
      metadata: {
        driverIds: validated.driverIds,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        deleted: deletedDrivers.count,
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


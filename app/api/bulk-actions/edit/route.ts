import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { BulkEditManager } from '@/lib/managers/BulkEditManager';
import { hasPermission } from '@/lib/permissions';
import { McStateManager } from '@/lib/managers/McStateManager';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const bulkEditSchema = z.object({
  entityType: z.string().min(1),
  ids: z.array(z.string().min(1)).min(1, 'At least one ID is required'),
  updates: z.record(z.string(), z.any()),
});

/**
 * POST /api/bulk-actions/edit
 * Perform bulk edit on multiple entities
 */
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
    const validated = bulkEditSchema.parse(body);

    // Check permission
    const permission = `${validated.entityType}.bulk_edit` as any;
    if (!hasPermission(session.user.role as any, permission) && !hasPermission(session.user.role as any, 'data.bulk_edit')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions for bulk edit',
          },
        },
        { status: 403 }
      );
    }

    // Validate MC number access if mcNumberId is being updated
    if (validated.updates.mcNumberId !== undefined && validated.updates.mcNumberId !== null && validated.updates.mcNumberId !== '') {
      const mcNumberId = validated.updates.mcNumberId;
      
      // Verify MC number exists and belongs to company
      const mcNumber = await prisma.mcNumber.findFirst({
        where: {
          id: mcNumberId,
          companyId: session.user.companyId,
          deletedAt: null,
        },
      });

      if (!mcNumber) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_MC_NUMBER',
              message: 'MC number not found or does not belong to your company',
            },
          },
          { status: 400 }
        );
      }

      // Check if user has access to this MC number
      if (!(await McStateManager.canAccessMc(session, mcNumberId))) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You do not have access to the selected MC number',
            },
          },
          { status: 403 }
        );
      }
    }

    // For non-admin users, ensure they can only assign to their accessible MCs
    const isAdmin = (session.user as any)?.role === 'ADMIN';
    if (!isAdmin && validated.updates.mcNumberId !== undefined && validated.updates.mcNumberId !== null) {
      const userMcAccess = McStateManager.getMcAccess(session);
      const userDefaultMc = (session.user as any)?.mcNumberId;
      
      // Non-admins can only assign to MCs they have access to
      if (validated.updates.mcNumberId !== userDefaultMc && !userMcAccess.includes(validated.updates.mcNumberId)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You can only assign records to MC numbers you have access to',
            },
          },
          { status: 403 }
        );
      }
    }

    // Apply bulk updates
    const result = await BulkEditManager.applyBulkUpdates(
      validated.entityType,
      validated.ids,
      validated.updates,
      session.user.companyId
    );

    if (result.errors.length > 0) {
      return NextResponse.json(
        {
          success: true,
          data: {
            updatedCount: result.updatedCount,
            errors: result.errors,
          },
          message: `Updated ${result.updatedCount} record(s) with ${result.errors.length} error(s)`,
        },
        { status: 207 } // Multi-Status
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        updatedCount: result.updatedCount,
      },
      message: `Successfully updated ${result.updatedCount} record(s)`,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    console.error('Bulk edit error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to perform bulk edit',
        },
      },
      { status: 500 }
    );
  }
}


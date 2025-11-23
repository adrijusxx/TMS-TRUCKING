import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

const bulkActionSchema = z.object({
  entityType: z.enum([
    'load',
    'truck',
    'driver',
    'customer',
    'invoice',
    'user',
    'trailer',
    'inspection',
    'breakdown',
    'document',
  ]),
  action: z.enum(['update', 'delete', 'status', 'assign', 'archive', 'export']),
  ids: z.array(z.string().min(1)).min(1, 'At least one ID is required'),
  updates: z.record(z.string(), z.any()).optional(),
  status: z.string().optional(),
});

/**
 * POST /api/bulk-actions
 * Perform bulk actions on multiple entities
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
    const validated = bulkActionSchema.parse(body);

    // Map entity types to Prisma models and permission checks
    const entityConfig: Record<string, { model: string; permission: string }> = {
      load: { model: 'load', permission: 'loads.edit' },
      truck: { model: 'truck', permission: 'trucks.edit' },
      driver: { model: 'driver', permission: 'drivers.edit' },
      customer: { model: 'customer', permission: 'customers.edit' },
      invoice: { model: 'invoice', permission: 'invoices.edit' },
      user: { model: 'user', permission: 'settings.view' }, // Users need special permission
      trailer: { model: 'trailer', permission: 'trucks.edit' },
      inspection: { model: 'inspection', permission: 'trucks.edit' },
      breakdown: { model: 'breakdown', permission: 'trucks.edit' },
      document: { model: 'document', permission: 'documents.delete' },
    };

    const config = entityConfig[validated.entityType];
    if (!config) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_ENTITY', message: 'Invalid entity type' },
        },
        { status: 400 }
      );
    }

    // Check permissions
    if (!hasPermission(session.user.role, config.permission as any)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Permission denied' } },
        { status: 403 }
      );
    }

    let result: any;

    // Handle delete action
    if (validated.action === 'delete') {
      const deletePermission = `${config.permission.replace('.edit', '')}.delete` as any;
      if (!hasPermission(session.user.role, deletePermission)) {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Permission denied' } },
          { status: 403 }
        );
      }

      // Soft delete
      const model = config.model as 'load' | 'truck' | 'driver' | 'customer' | 'invoice' | 'user' | 'document' | 'breakdown' | 'trailer';
      result = await (prisma[model] as any).updateMany({
        where: {
          id: { in: validated.ids },
          companyId: session.user.companyId,
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          deleted: result.count,
          message: `Successfully deleted ${result.count} ${validated.entityType}(s)`,
        },
      });
    }

    // Handle status update
    if (validated.action === 'status' && validated.status) {
      const updateData: any = { status: validated.status };
      
      const model = config.model as 'load' | 'truck' | 'driver' | 'customer' | 'invoice';
      result = await (prisma[model] as any).updateMany({
        where: {
          id: { in: validated.ids },
          companyId: session.user.companyId,
          deletedAt: null,
        },
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        data: {
          updated: result.count,
          message: `Successfully updated status for ${result.count} ${validated.entityType}(s)`,
        },
      });
    }

    // Handle general update
    if (validated.action === 'update' && validated.updates) {
      // Validate and sanitize updates based on entity type
      const updateData: any = { ...validated.updates };
      
      // Remove fields that shouldn't be bulk updated
      delete updateData.id;
      delete updateData.companyId;
      delete updateData.createdAt;
      delete updateData.updatedAt;

      const model = config.model as 'load' | 'truck' | 'driver' | 'customer' | 'invoice';
      result = await (prisma[model] as any).updateMany({
        where: {
          id: { in: validated.ids },
          companyId: session.user.companyId,
          deletedAt: null,
        },
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        data: {
          updated: result.count,
          message: `Successfully updated ${result.count} ${validated.entityType}(s)`,
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: { code: 'INVALID_ACTION', message: 'Invalid action or missing required data' },
      },
      { status: 400 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    console.error('Bulk action error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to perform bulk action',
        },
      },
      { status: 500 }
    );
  }
}


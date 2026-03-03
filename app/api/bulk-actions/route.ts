import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';
import {
  BulkActionManager,
  entityTypeMap,
  entityConfig,
} from '@/lib/managers/BulkActionManager';

const bulkActionSchema = z.object({
  entityType: z.string(),
  action: z.enum(['update', 'delete', 'status', 'assign', 'archive', 'export']),
  ids: z.array(z.string().min(1)).min(1, 'At least one ID is required'),
  updates: z.record(z.string(), z.any()).optional(),
  status: z.string().optional(),
  hardDelete: z.boolean().optional(),
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

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_REQUEST', message: 'Invalid JSON in request body' } },
        { status: 400 }
      );
    }

    const validated = bulkActionSchema.parse(body);

    // Resolve model name
    const modelName = entityTypeMap[validated.entityType];
    if (!modelName) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ENTITY', message: `Invalid entity type: ${validated.entityType}` } },
        { status: 400 }
      );
    }

    const config = entityConfig[modelName];
    if (!config) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ENTITY', message: `Entity type not supported: ${validated.entityType}` } },
        { status: 400 }
      );
    }

    // Check permissions
    let permissionToCheck = config.permission;
    if (validated.action === 'delete') {
      if (modelName === 'user') {
        permissionToCheck = 'users.delete';
      } else {
        const entityName = config.permission.split('.')[0];
        permissionToCheck = `${entityName}.delete`;
      }
    }

    if (!hasPermission(session.user.role, permissionToCheck as any)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Permission denied' } },
        { status: 403 }
      );
    }

    // Delegate to manager
    const user = {
      companyId: session.user.companyId,
      role: session.user.role,
      id: session.user.id,
      mcAccess: (session.user as any)?.mcAccess || [],
    };

    let result;

    if (validated.action === 'delete') {
      result = await BulkActionManager.handleDelete(validated, user, session, request);
    } else if (validated.action === 'status' && validated.status) {
      result = await BulkActionManager.handleStatusUpdate(validated, user);
    } else if (validated.action === 'update' && validated.updates) {
      result = await BulkActionManager.handleUpdate(validated, user);
    } else {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ACTION', message: 'Invalid action or missing required data' } },
        { status: 400 }
      );
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.statusCode || 400 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error('Bulk action validation error:', error.issues);
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.issues } },
        { status: 400 }
      );
    }

    console.error('Bulk action error:', { message: error.message, stack: error.stack, name: error.name });
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to perform bulk action' } },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { PermissionService } from '@/lib/services/PermissionService';
import { type UserRole, type Permission } from '@/lib/permissions';
import { z } from 'zod';

/**
 * GET /api/settings/role-permissions/[role]
 * Get permissions for specific role
 * Admin only
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ role: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Only admin can view permissions
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Permission denied' } },
        { status: 403 }
      );
    }

    const { role } = await params;

    if (!['ADMIN', 'DISPATCHER', 'ACCOUNTANT', 'DRIVER', 'CUSTOMER', 'HR', 'SAFETY', 'FLEET'].includes(role)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ROLE', message: 'Invalid role' } },
        { status: 400 }
      );
    }

    const status = await PermissionService.getPermissionStatus(role as UserRole);

    return NextResponse.json({
      success: true,
      data: {
        role,
        permissions: status.permissions,
        customPermissions: status.customPermissions,
        defaultPermissions: status.defaultPermissions,
      },
    });
  } catch (error: any) {
    console.error('Error fetching role permissions:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch role permissions',
        },
      },
      { status: 500 }
    );
  }
}

const updateRolePermissionsSchema = z.object({
  permissions: z.array(z.string()),
});

/**
 * PUT /api/settings/role-permissions/[role]
 * Update permissions for specific role
 * Admin only
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ role: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Only admin can update permissions
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Permission denied' } },
        { status: 403 }
      );
    }

    const { role } = await params;

    if (!['ADMIN', 'DISPATCHER', 'ACCOUNTANT', 'DRIVER', 'CUSTOMER', 'HR', 'SAFETY', 'FLEET'].includes(role)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ROLE', message: 'Invalid role' } },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validated = updateRolePermissionsSchema.parse(body);

    await PermissionService.updateRolePermissions(
      role as UserRole,
      validated.permissions as Permission[]
    );

    return NextResponse.json({
      success: true,
      message: `Permissions updated for ${role}`,
    });
  } catch (error: any) {
    console.error('Error updating role permissions:', error);
    
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

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to update role permissions',
        },
      },
      { status: 500 }
    );
  }
}


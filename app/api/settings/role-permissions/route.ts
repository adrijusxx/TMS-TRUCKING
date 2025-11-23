import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { PermissionService } from '@/lib/services/PermissionService';
import { type UserRole, type Permission, getAllPermissions } from '@/lib/permissions';
import { z } from 'zod';

/**
 * GET /api/settings/role-permissions
 * Fetch all role permissions (with defaults merged)
 * Admin only
 */
export async function GET(request: NextRequest) {
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

    const allRolePermissions = await PermissionService.getAllRolePermissions();
    const allPermissions = getAllPermissions();

    // Get permission status for each role
    const roles: UserRole[] = ['ADMIN', 'DISPATCHER', 'ACCOUNTANT', 'DRIVER', 'CUSTOMER', 'HR', 'SAFETY', 'FLEET'];
    const result: Record<string, any> = {};

    for (const role of roles) {
      const status = await PermissionService.getPermissionStatus(role);
      result[role] = {
        permissions: status.permissions,
        customPermissions: status.customPermissions,
        defaultPermissions: status.defaultPermissions,
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        roles: result,
        allPermissions,
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

const updatePermissionsSchema = z.object({
  role: z.enum(['ADMIN', 'DISPATCHER', 'ACCOUNTANT', 'DRIVER', 'CUSTOMER', 'HR', 'SAFETY', 'FLEET']),
  permissions: z.array(z.string()),
});

/**
 * POST /api/settings/role-permissions
 * Update role permissions
 * Admin only
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

    // Only admin can update permissions
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Permission denied' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = updatePermissionsSchema.parse(body);

    await PermissionService.updateRolePermissions(
      validated.role,
      validated.permissions as Permission[]
    );

    return NextResponse.json({
      success: true,
      message: `Permissions updated for ${validated.role}`,
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

const resetRoleSchema = z.object({
  role: z.enum(['ADMIN', 'DISPATCHER', 'ACCOUNTANT', 'DRIVER', 'CUSTOMER', 'HR', 'SAFETY', 'FLEET']),
});

/**
 * PUT /api/settings/role-permissions
 * Reset role to default permissions
 * Admin only
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Only admin can reset permissions
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Permission denied' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = resetRoleSchema.parse(body);

    await PermissionService.resetRolePermissions(validated.role);

    return NextResponse.json({
      success: true,
      message: `Permissions reset to defaults for ${validated.role}`,
    });
  } catch (error: any) {
    console.error('Error resetting role permissions:', error);
    
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
          message: error.message || 'Failed to reset role permissions',
        },
      },
      { status: 500 }
    );
  }
}


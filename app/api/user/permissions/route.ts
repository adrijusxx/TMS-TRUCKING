import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { PermissionResolutionEngine } from '@/lib/managers/PermissionResolutionEngine';
import { PermissionService } from '@/lib/services/PermissionService';

/**
 * GET /api/user/permissions
 * Get current user's effective permissions (resolution engine with fallback)
 * Any authenticated user can access their own permissions
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

    let permissions;

    // Use resolution engine if user has a roleId (new system)
    if (session.user.roleId) {
      permissions = await PermissionResolutionEngine.getEffectivePermissions(session.user.id);
    } else {
      // Fallback to legacy PermissionService for users without roleId
      const role = (session.user.role || 'CUSTOMER') as string;
      permissions = await PermissionService.getRolePermissions(role as any);
    }

    return NextResponse.json({
      success: true,
      data: {
        roleSlug: session.user.roleSlug || session.user.role?.toLowerCase().replace('_', '-') || 'customer',
        roleName: session.user.roleName || session.user.role || 'Customer',
        permissions,
      },
    });
  } catch (error: any) {
    console.error('Error fetching user permissions:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch user permissions',
        },
      },
      { status: 500 }
    );
  }
}

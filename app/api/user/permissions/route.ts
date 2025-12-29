import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { PermissionService } from '@/lib/services/PermissionService';
import { type UserRole } from '@/lib/permissions';

/**
 * GET /api/user/permissions
 * Get current user's permissions (database-backed)
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

    const role = (session.user.role || 'CUSTOMER') as UserRole;
    
    // Get permissions from database (with fallback to defaults)
    const permissions = await PermissionService.getRolePermissions(role);

    return NextResponse.json({
      success: true,
      data: {
        role,
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


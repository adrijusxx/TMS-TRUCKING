import type { Permission, UserRole } from './permissions';
import { hasPermission, getRolePermissions } from './permissions';

/**
 * Check if a role has a specific permission (async - checks database)
 * This is the preferred method for server-side code
 */
export async function hasPermissionAsync(role: UserRole, permission: Permission): Promise<boolean> {
    try {
        const { PermissionService } = await import('@/lib/services/PermissionService');
        return await PermissionService.hasPermission(role, permission);
    } catch (error) {
        console.error('Error checking permission:', error);
        // Fallback to sync version
        return hasPermission(role, permission);
    }
}

/**
 * Get all permissions for a role (async - checks database)
 * This is the preferred method for server-side code
 */
export async function getRolePermissionsAsync(role: UserRole): Promise<Permission[]> {
    try {
        const { PermissionService } = await import('@/lib/services/PermissionService');
        return await PermissionService.getRolePermissions(role);
    } catch (error) {
        console.error('Error getting role permissions:', error);
        // Fallback to sync version
        return getRolePermissions(role);
    }
}

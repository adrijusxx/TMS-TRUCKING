import type { Permission, UserRole } from './permissions';
import { hasPermission, getRolePermissions } from './permissions';

/**
 * Check if a user has a specific permission (async - uses resolution engine)
 * Supports both userId-based (new) and role-based (legacy) checks
 */
export async function hasPermissionAsync(
    roleOrUserId: UserRole | string,
    permission: Permission,
    options?: { useUserId?: boolean }
): Promise<boolean> {
    try {
        // If explicitly using userId or if it looks like a cuid (new system)
        if (options?.useUserId || (roleOrUserId.length > 10 && !roleOrUserId.includes('_'))) {
            const { PermissionResolutionEngine } = await import('@/lib/managers/PermissionResolutionEngine');
            return await PermissionResolutionEngine.hasPermission(roleOrUserId, permission);
        }
        // Legacy: role-based check via PermissionService
        const { PermissionService } = await import('@/lib/services/PermissionService');
        return await PermissionService.hasPermission(roleOrUserId as UserRole, permission);
    } catch (error) {
        console.error('Error checking permission:', error);
        // Fallback to sync version
        return hasPermission(roleOrUserId as UserRole, permission);
    }
}

/**
 * Get all effective permissions for a user (async - uses resolution engine)
 */
export async function getEffectivePermissionsAsync(userId: string): Promise<Permission[]> {
    try {
        const { PermissionResolutionEngine } = await import('@/lib/managers/PermissionResolutionEngine');
        return await PermissionResolutionEngine.getEffectivePermissions(userId);
    } catch (error) {
        console.error('Error getting effective permissions:', error);
        return [];
    }
}

/**
 * Get all permissions for a role (async - checks database)
 * @deprecated Use getEffectivePermissionsAsync(userId) instead
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

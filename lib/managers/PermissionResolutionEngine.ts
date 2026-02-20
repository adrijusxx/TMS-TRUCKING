import { prisma } from '@/lib/prisma';
import type { Permission } from '@/lib/permissions';
import { getAllPermissions } from '@/lib/permissions';

const MAX_HIERARCHY_DEPTH = 5;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  permissions: Set<string>;
  computedAt: number;
}

// In-memory cache: userId → effective permissions
const permissionCache = new Map<string, CacheEntry>();

/**
 * Engine for resolving effective permissions for a user.
 *
 * Resolution order:
 * 1. Walk role hierarchy (parent-first) collecting direct + group permissions
 * 2. Apply per-user GRANT overrides (add permissions)
 * 3. Apply per-user REVOKE overrides (remove permissions)
 */
export class PermissionResolutionEngine {
  /**
   * Get effective permissions for a user (cache-aware)
   */
  static async getEffectivePermissions(userId: string): Promise<Permission[]> {
    const cached = permissionCache.get(userId);
    if (cached && Date.now() - cached.computedAt < CACHE_TTL_MS) {
      return Array.from(cached.permissions) as Permission[];
    }

    const permissions = await this.resolvePermissions(userId);
    permissionCache.set(userId, {
      permissions: new Set(permissions),
      computedAt: Date.now(),
    });
    return permissions;
  }

  /**
   * Check if user has a specific permission
   */
  static async hasPermission(userId: string, permission: Permission): Promise<boolean> {
    const perms = await this.getEffectivePermissions(userId);
    return perms.includes(permission);
  }

  /**
   * Check if user has any of the specified permissions
   */
  static async hasAnyPermission(userId: string, permissions: Permission[]): Promise<boolean> {
    const perms = await this.getEffectivePermissions(userId);
    return permissions.some((p) => perms.includes(p));
  }

  /**
   * Check if user has all of the specified permissions
   */
  static async hasAllPermissions(userId: string, permissions: Permission[]): Promise<boolean> {
    const perms = await this.getEffectivePermissions(userId);
    return permissions.every((p) => perms.includes(p));
  }

  /**
   * Full permission resolution from database
   */
  private static async resolvePermissions(userId: string): Promise<Permission[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { roleId: true, role: true },
    });

    if (!user) return [];

    // If no custom roleId yet, fall back to legacy enum role
    if (!user.roleId) {
      return this.resolveLegacyPermissions(user.role);
    }

    // 1. Walk role hierarchy to collect all role IDs (parent-first)
    const roleChain = await this.walkRoleHierarchy(user.roleId);

    // 2. Collect permissions from all roles in chain
    const permissionSet = new Set<string>();
    await this.collectRolePermissions(roleChain, permissionSet);

    // 3. Apply per-user overrides
    await this.applyUserOverrides(userId, permissionSet);

    // 4. Filter to only valid permissions
    const allValid = new Set(getAllPermissions());
    const result = Array.from(permissionSet).filter((p) => allValid.has(p as Permission));
    return result as Permission[];
  }

  /**
   * Walk role hierarchy from a role up to its ancestors (max depth)
   * Returns role IDs ordered parent-first: [grandparent, parent, self]
   */
  private static async walkRoleHierarchy(roleId: string): Promise<string[]> {
    const chain: string[] = [];
    const visited = new Set<string>();
    let currentId: string | null = roleId;

    while (currentId && chain.length < MAX_HIERARCHY_DEPTH) {
      if (visited.has(currentId)) {
        // Circular reference detected — stop
        break;
      }
      visited.add(currentId);
      chain.unshift(currentId); // prepend so parent comes first

      const parentRole: { parentRoleId: string | null } | null = await prisma.role.findUnique({
        where: { id: currentId },
        select: { parentRoleId: true },
      });
      currentId = parentRole?.parentRoleId ?? null;
    }

    return chain;
  }

  /**
   * Collect permissions from direct role assignments and permission groups
   */
  private static async collectRolePermissions(
    roleIds: string[],
    permissionSet: Set<string>
  ): Promise<void> {
    if (roleIds.length === 0) return;

    // Batch fetch: direct permissions for all roles in chain
    const directPerms = await prisma.rolePermissionEntry.findMany({
      where: { roleId: { in: roleIds } },
      select: { permission: true },
    });
    for (const p of directPerms) {
      permissionSet.add(p.permission);
    }

    // Batch fetch: group permissions for all roles in chain
    const groupAssignments = await prisma.rolePermissionGroup.findMany({
      where: { roleId: { in: roleIds } },
      select: {
        group: {
          select: {
            items: { select: { permission: true } },
          },
        },
      },
    });
    for (const assignment of groupAssignments) {
      for (const item of assignment.group.items) {
        permissionSet.add(item.permission);
      }
    }
  }

  /**
   * Apply per-user GRANT and REVOKE overrides
   */
  private static async applyUserOverrides(
    userId: string,
    permissionSet: Set<string>
  ): Promise<void> {
    const overrides = await prisma.userPermissionOverride.findMany({
      where: { userId },
      select: { permission: true, type: true },
    });

    for (const override of overrides) {
      if (override.type === 'GRANT') {
        permissionSet.add(override.permission);
      } else if (override.type === 'REVOKE') {
        permissionSet.delete(override.permission);
      }
    }
  }

  /**
   * Fallback for users who still have the legacy enum role (during migration)
   */
  private static async resolveLegacyPermissions(legacyRole: string): Promise<Permission[]> {
    // Dynamic import to avoid circular dependency
    const { systemRoleDefaults } = await import('@/lib/permissions');
    return systemRoleDefaults[legacyRole] || [];
  }

  // ==========================================
  // CACHE INVALIDATION
  // ==========================================

  /** Invalidate a single user's cached permissions */
  static invalidateUser(userId: string): void {
    permissionCache.delete(userId);
  }

  /** Invalidate all users assigned to a role (and its descendants) */
  static async invalidateRole(roleId: string): Promise<void> {
    const descendantIds = await this.getDescendantRoleIds(roleId);
    const allRoleIds = [roleId, ...descendantIds];

    const users = await prisma.user.findMany({
      where: { roleId: { in: allRoleIds } },
      select: { id: true },
    });

    for (const user of users) {
      permissionCache.delete(user.id);
    }
  }

  /** Invalidate all users whose roles use a specific permission group */
  static async invalidateGroup(groupId: string): Promise<void> {
    const assignments = await prisma.rolePermissionGroup.findMany({
      where: { groupId },
      select: { roleId: true },
    });

    for (const assignment of assignments) {
      await this.invalidateRole(assignment.roleId);
    }
  }

  /** Clear the entire cache */
  static invalidateAll(): void {
    permissionCache.clear();
  }

  /**
   * Get all descendant role IDs for a given role (recursive, max depth)
   */
  private static async getDescendantRoleIds(roleId: string): Promise<string[]> {
    const descendants: string[] = [];
    const queue = [roleId];
    const visited = new Set<string>();
    let depth = 0;

    while (queue.length > 0 && depth < MAX_HIERARCHY_DEPTH) {
      const currentBatch = [...queue];
      queue.length = 0;

      const children = await prisma.role.findMany({
        where: {
          parentRoleId: { in: currentBatch },
          id: { notIn: Array.from(visited) },
        },
        select: { id: true },
      });

      for (const child of children) {
        if (!visited.has(child.id)) {
          visited.add(child.id);
          descendants.push(child.id);
          queue.push(child.id);
        }
      }
      depth++;
    }

    return descendants;
  }
}

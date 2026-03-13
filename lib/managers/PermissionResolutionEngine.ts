import { prisma } from '@/lib/prisma';
import type { Permission } from '@/lib/permissions';
import { getAllPermissions, systemRoleDefaults } from '@/lib/permissions';

export interface PermissionBreakdownEntry {
  permission: Permission;
  source: 'role' | 'parent_role' | 'grant_override' | 'legacy_role';
  sourceLabel: string;
}

export interface PermissionBreakdown {
  effective: PermissionBreakdownEntry[];
  revoked: Array<{ permission: Permission; reason: string | null }>;
  roleName: string | null;
}

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

  /**
   * Get annotated permission breakdown for a user (for dashboard display)
   */
  static async getPermissionBreakdown(userId: string): Promise<PermissionBreakdown> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { roleId: true, role: true },
    });

    if (!user) return { effective: [], revoked: [], roleName: null };

    // Legacy fallback
    if (!user.roleId) {
      const perms = await this.resolveLegacyPermissions(user.role);
      return {
        effective: perms.map(p => ({ permission: p, source: 'legacy_role' as const, sourceLabel: user.role })),
        revoked: [],
        roleName: user.role,
      };
    }

    // Walk hierarchy and fetch role names
    const roleChain = await this.walkRoleHierarchy(user.roleId);
    const roles = await prisma.role.findMany({
      where: { id: { in: roleChain } },
      select: { id: true, name: true },
    });
    const roleNameMap = new Map(roles.map(r => [r.id, r.name]));
    const userRoleName = roleNameMap.get(user.roleId) || null;

    // Fetch permissions per role in chain
    const rolePerms = await prisma.rolePermissionEntry.findMany({
      where: { roleId: { in: roleChain } },
      select: { roleId: true, permission: true },
    });

    // Build annotated entries (parent roles first, then self)
    const allValid = new Set(getAllPermissions());
    const seen = new Set<string>();
    const effective: PermissionBreakdownEntry[] = [];

    for (const rid of roleChain) {
      const isOwnRole = rid === user.roleId;
      const source = isOwnRole ? 'role' as const : 'parent_role' as const;
      const sourceLabel = isOwnRole
        ? (roleNameMap.get(rid) || 'Role')
        : `Parent: ${roleNameMap.get(rid) || 'Unknown'}`;

      for (const rp of rolePerms.filter(p => p.roleId === rid)) {
        if (!seen.has(rp.permission) && allValid.has(rp.permission as Permission)) {
          seen.add(rp.permission);
          effective.push({ permission: rp.permission as Permission, source, sourceLabel });
        }
      }
    }

    // Apply user overrides
    const overrides = await prisma.userPermissionOverride.findMany({
      where: { userId },
      select: { permission: true, type: true, reason: true },
    });

    const revoked: PermissionBreakdown['revoked'] = [];
    for (const override of overrides) {
      if (override.type === 'GRANT' && allValid.has(override.permission as Permission)) {
        if (!seen.has(override.permission)) {
          seen.add(override.permission);
          effective.push({ permission: override.permission as Permission, source: 'grant_override', sourceLabel: 'User Override' });
        }
      } else if (override.type === 'REVOKE') {
        const idx = effective.findIndex(e => e.permission === override.permission);
        if (idx !== -1) effective.splice(idx, 1);
        seen.delete(override.permission);
        revoked.push({ permission: override.permission as Permission, reason: override.reason });
      }
    }

    return { effective, revoked, roleName: userRoleName };
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

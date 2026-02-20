import { prisma } from '@/lib/prisma';
import { PermissionResolutionEngine } from './PermissionResolutionEngine';
import type { Permission } from '@/lib/permissions';
import { systemRoleDefaults } from '@/lib/permissions';

const MAX_HIERARCHY_DEPTH = 5;

interface CreateRoleInput {
  name: string;
  slug: string;
  description?: string;
  parentRoleId?: string;
  companyId: string;
  permissions?: string[];
}

interface UpdateRoleInput {
  name?: string;
  description?: string;
  permissions?: string[];
}

interface RoleTreeNode {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  parentRoleId: string | null;
  userCount: number;
  children: RoleTreeNode[];
}

/**
 * Manager for role CRUD operations, hierarchy management, and system role seeding
 */
export class RoleManager {
  /**
   * Create a new custom role
   */
  static async createRole(data: CreateRoleInput) {
    if (data.parentRoleId) {
      await this.validateHierarchy(data.parentRoleId, null);
    }

    const role = await prisma.role.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        parentRoleId: data.parentRoleId,
        companyId: data.companyId,
        isSystem: false,
      },
    });

    // Assign permissions if provided
    if (data.permissions && data.permissions.length > 0) {
      await prisma.rolePermissionEntry.createMany({
        data: data.permissions.map((permission) => ({
          roleId: role.id,
          permission,
        })),
      });
    }

    return role;
  }

  /**
   * Update an existing role
   */
  static async updateRole(roleId: string, data: UpdateRoleInput) {
    const role = await prisma.role.update({
      where: { id: roleId },
      data: {
        name: data.name,
        description: data.description,
      },
    });

    // Replace permissions if provided
    if (data.permissions !== undefined) {
      await prisma.rolePermissionEntry.deleteMany({ where: { roleId } });

      if (data.permissions.length > 0) {
        await prisma.rolePermissionEntry.createMany({
          data: data.permissions.map((permission) => ({
            roleId,
            permission,
          })),
        });
      }

      await PermissionResolutionEngine.invalidateRole(roleId);
    }

    return role;
  }

  /**
   * Delete a custom role. System roles cannot be deleted.
   * Users must be reassigned before deletion.
   */
  static async deleteRole(roleId: string) {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      select: {
        isSystem: true,
        _count: { select: { users: true, userCompanies: true, childRoles: true } },
      },
    });

    if (!role) throw new Error('Role not found');
    if (role.isSystem) throw new Error('System roles cannot be deleted');
    if (role._count.users > 0) {
      throw new Error('Cannot delete role: users are still assigned. Reassign them first.');
    }
    if (role._count.userCompanies > 0) {
      throw new Error('Cannot delete role: company users are still assigned. Reassign them first.');
    }
    if (role._count.childRoles > 0) {
      throw new Error('Cannot delete role: child roles exist. Remove or reassign them first.');
    }

    // Cascade deletes handle rolePermissions and roleGroups
    await prisma.role.delete({ where: { id: roleId } });
  }

  /**
   * Change a role's parent (with circular reference and depth checks)
   */
  static async setParentRole(roleId: string, parentRoleId: string | null) {
    if (parentRoleId) {
      if (parentRoleId === roleId) {
        throw new Error('A role cannot be its own parent');
      }
      await this.validateHierarchy(parentRoleId, roleId);
    }

    await prisma.role.update({
      where: { id: roleId },
      data: { parentRoleId },
    });

    await PermissionResolutionEngine.invalidateRole(roleId);
  }

  /**
   * Get role hierarchy tree for a company
   */
  static async getRoleHierarchy(companyId: string): Promise<RoleTreeNode[]> {
    const roles = await prisma.role.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        isSystem: true,
        parentRoleId: true,
        _count: { select: { users: true } },
      },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });

    // Build tree
    const roleMap = new Map<string, RoleTreeNode>();
    for (const r of roles) {
      roleMap.set(r.id, {
        id: r.id,
        name: r.name,
        slug: r.slug,
        description: r.description,
        isSystem: r.isSystem,
        parentRoleId: r.parentRoleId,
        userCount: r._count.users,
        children: [],
      });
    }

    const roots: RoleTreeNode[] = [];
    for (const node of roleMap.values()) {
      if (node.parentRoleId && roleMap.has(node.parentRoleId)) {
        roleMap.get(node.parentRoleId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  /**
   * Get a system role by its slug for a given company
   */
  static async getSystemRoleBySlug(slug: string, companyId: string) {
    return prisma.role.findUnique({
      where: { slug_companyId: { slug, companyId } },
    });
  }

  /**
   * Get a single role with its permissions and groups
   */
  static async getRoleWithDetails(roleId: string) {
    return prisma.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: { select: { permission: true } },
        roleGroups: {
          include: {
            group: {
              select: { id: true, name: true, description: true },
            },
          },
        },
        parentRole: { select: { id: true, name: true, slug: true } },
        _count: { select: { users: true, childRoles: true } },
      },
    });
  }

  /**
   * List all roles for a company
   */
  static async listRoles(companyId: string) {
    return prisma.role.findMany({
      where: { companyId },
      include: {
        parentRole: { select: { id: true, name: true } },
        _count: { select: { users: true, childRoles: true } },
      },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });
  }

  // ==========================================
  // SYSTEM ROLE SEEDING
  // ==========================================

  /** Slug mapping for the 9 system roles */
  static readonly SYSTEM_ROLE_MAP: Record<string, { name: string; slug: string }> = {
    SUPER_ADMIN: { name: 'Super Admin', slug: 'super-admin' },
    ADMIN: { name: 'Administrator', slug: 'admin' },
    DISPATCHER: { name: 'Dispatcher', slug: 'dispatcher' },
    DRIVER: { name: 'Driver', slug: 'driver' },
    CUSTOMER: { name: 'Customer', slug: 'customer' },
    ACCOUNTANT: { name: 'Accountant', slug: 'accountant' },
    HR: { name: 'HR Manager', slug: 'hr' },
    SAFETY: { name: 'Safety Manager', slug: 'safety' },
    FLEET: { name: 'Fleet Manager', slug: 'fleet' },
  };

  /**
   * Seed system roles for a company (idempotent)
   */
  static async seedSystemRoles(companyId: string) {
    for (const [enumValue, meta] of Object.entries(this.SYSTEM_ROLE_MAP)) {
      const existing = await prisma.role.findUnique({
        where: { slug_companyId: { slug: meta.slug, companyId } },
      });

      if (existing) continue;

      const role = await prisma.role.create({
        data: {
          name: meta.name,
          slug: meta.slug,
          isSystem: true,
          companyId,
        },
      });

      // Seed default permissions from systemRoleDefaults
      const defaults = systemRoleDefaults[enumValue] || [];
      if (defaults.length > 0) {
        await prisma.rolePermissionEntry.createMany({
          data: defaults.map((permission: Permission) => ({
            roleId: role.id,
            permission,
          })),
        });
      }
    }
  }

  // ==========================================
  // HIERARCHY VALIDATION
  // ==========================================

  /**
   * Validate that setting parentRoleId won't create a circular reference
   * or exceed max depth. `childRoleId` is the role being modified (null for new roles).
   */
  private static async validateHierarchy(
    parentRoleId: string,
    childRoleId: string | null
  ) {
    // Walk up from proposed parent to check for circular ref
    const visited = new Set<string>();
    let currentId: string | null = parentRoleId;
    let depth = 0;

    while (currentId && depth < MAX_HIERARCHY_DEPTH + 1) {
      if (childRoleId && currentId === childRoleId) {
        throw new Error('Circular role hierarchy detected');
      }
      if (visited.has(currentId)) {
        throw new Error('Circular role hierarchy detected');
      }
      visited.add(currentId);

      const parentRole: { parentRoleId: string | null } | null = await prisma.role.findUnique({
        where: { id: currentId },
        select: { parentRoleId: true },
      });
      currentId = parentRole?.parentRoleId ?? null;
      depth++;
    }

    // Check total depth if child is set: depth from top to parent + depth of child subtree
    if (depth >= MAX_HIERARCHY_DEPTH) {
      throw new Error(`Role hierarchy cannot exceed ${MAX_HIERARCHY_DEPTH} levels`);
    }
  }
}

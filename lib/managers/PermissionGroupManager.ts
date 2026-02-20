import { prisma } from '@/lib/prisma';
import { PermissionResolutionEngine } from './PermissionResolutionEngine';

interface CreateGroupInput {
  name: string;
  description?: string;
  companyId: string;
  permissions: string[];
}

interface UpdateGroupInput {
  name?: string;
  description?: string;
  permissions?: string[];
}

/**
 * Manager for permission group (template) CRUD operations
 */
export class PermissionGroupManager {
  /**
   * Create a new permission group
   */
  static async createGroup(data: CreateGroupInput) {
    const group = await prisma.permissionGroup.create({
      data: {
        name: data.name,
        description: data.description,
        companyId: data.companyId,
        isSystem: false,
        items: {
          create: data.permissions.map((permission) => ({ permission })),
        },
      },
      include: {
        items: { select: { permission: true } },
      },
    });

    return group;
  }

  /**
   * Update an existing permission group
   */
  static async updateGroup(groupId: string, data: UpdateGroupInput) {
    const group = await prisma.permissionGroup.update({
      where: { id: groupId },
      data: {
        name: data.name,
        description: data.description,
      },
    });

    // Replace permissions if provided
    if (data.permissions !== undefined) {
      await prisma.permissionGroupItem.deleteMany({ where: { groupId } });

      if (data.permissions.length > 0) {
        await prisma.permissionGroupItem.createMany({
          data: data.permissions.map((permission) => ({
            groupId,
            permission,
          })),
        });
      }

      await PermissionResolutionEngine.invalidateGroup(groupId);
    }

    return group;
  }

  /**
   * Delete a permission group. Cascade removes from roles.
   */
  static async deleteGroup(groupId: string) {
    const group = await prisma.permissionGroup.findUnique({
      where: { id: groupId },
      select: { isSystem: true },
    });

    if (!group) throw new Error('Permission group not found');
    if (group.isSystem) throw new Error('System permission groups cannot be deleted');

    // Invalidate cache before deletion
    await PermissionResolutionEngine.invalidateGroup(groupId);

    // Cascade deletes handle items and role assignments
    await prisma.permissionGroup.delete({ where: { id: groupId } });
  }

  /**
   * Assign a permission group to a role
   */
  static async assignToRole(groupId: string, roleId: string) {
    await prisma.rolePermissionGroup.create({
      data: { roleId, groupId },
    });

    await PermissionResolutionEngine.invalidateRole(roleId);
  }

  /**
   * Remove a permission group from a role
   */
  static async removeFromRole(groupId: string, roleId: string) {
    await prisma.rolePermissionGroup.deleteMany({
      where: { roleId, groupId },
    });

    await PermissionResolutionEngine.invalidateRole(roleId);
  }

  /**
   * Get all permission groups for a company
   */
  static async getGroupsForCompany(companyId: string) {
    return prisma.permissionGroup.findMany({
      where: { companyId },
      include: {
        items: { select: { permission: true } },
        _count: { select: { roleAssignments: true } },
      },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });
  }

  /**
   * Get a single permission group with details
   */
  static async getGroupWithDetails(groupId: string) {
    return prisma.permissionGroup.findUnique({
      where: { id: groupId },
      include: {
        items: { select: { permission: true } },
        roleAssignments: {
          include: {
            role: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });
  }

  /**
   * Get groups assigned to a specific role
   */
  static async getGroupsForRole(roleId: string) {
    const assignments = await prisma.rolePermissionGroup.findMany({
      where: { roleId },
      include: {
        group: {
          include: {
            items: { select: { permission: true } },
          },
        },
      },
    });

    return assignments.map((a) => a.group);
  }
}

import { prisma } from '@/lib/prisma';
import { type UserRole, type Permission, rolePermissions, getAllPermissions } from '@/lib/permissions';

/**
 * Service for managing role permissions in the database
 */
export class PermissionService {
  /**
   * Ensure Prisma client is initialized
   */
  private static ensurePrisma() {
    if (!prisma) {
      throw new Error('Prisma client is not initialized');
    }
    if (!prisma.rolePermission) {
      throw new Error('Prisma client is not properly generated. Please run: npx prisma generate');
    }
    return prisma;
  }

  /**
   * Get all permissions for a role (from database with fallback to defaults)
   * Merges database permissions with defaults to ensure new default permissions are included
   */
  static async getRolePermissions(role: UserRole): Promise<Permission[]> {
    try {
      const db = this.ensurePrisma();
      
      // Get custom permissions from database
      const dbPermissions = await db.rolePermission.findMany({
        where: {
          role,
          isEnabled: true,
        },
        select: {
          permission: true,
        },
      });

      const dbPermissionSet = new Set(dbPermissions.map((p) => p.permission as Permission));
      const defaultPermissions = rolePermissions[role] || [];
      const defaultPermissionSet = new Set(defaultPermissions);

      // If we have custom permissions in DB, merge with defaults
      // This ensures new permissions added to defaults are included
      if (dbPermissionSet.size > 0) {
        // Start with database permissions
        const merged = new Set(Array.from(dbPermissionSet));
        
        // Add any default permissions that aren't in the database
        // This handles the case where new permissions are added to defaults
        defaultPermissions.forEach((perm) => {
          if (!dbPermissionSet.has(perm)) {
            merged.add(perm);
          }
        });
        
        return Array.from(merged);
      }

      // Otherwise, fallback to defaults
      return defaultPermissions;
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      // Fallback to defaults on error
      return rolePermissions[role] || [];
    }
  }

  /**
   * Check if a role has a specific permission
   */
  static async hasPermission(role: UserRole, permission: Permission): Promise<boolean> {
    const permissions = await this.getRolePermissions(role);
    return permissions.includes(permission);
  }

  /**
   * Get all role permissions (for admin UI)
   */
  static async getAllRolePermissions(): Promise<Record<UserRole, Permission[]>> {
    const roles: UserRole[] = ['ADMIN', 'DISPATCHER', 'ACCOUNTANT', 'DRIVER', 'CUSTOMER', 'HR', 'SAFETY', 'FLEET'];
    const result: Record<string, Permission[]> = {};

    for (const role of roles) {
      result[role] = await this.getRolePermissions(role);
    }

    return result as Record<UserRole, Permission[]>;
  }

  /**
   * Update permissions for a role
   */
  static async updateRolePermissions(
    role: UserRole,
    permissions: Permission[]
  ): Promise<void> {
    const db = this.ensurePrisma();
    
    // Get all available permissions
    const allPermissions = getAllPermissions();
    const permissionSet = new Set(permissions);

    // Start a transaction
    await db.$transaction(async (tx) => {
      // Delete all existing permissions for this role
      await tx.rolePermission.deleteMany({
        where: { role },
      });

      // Insert new permissions
      const permissionsToCreate = allPermissions.map((perm) => ({
        role,
        permission: perm,
        isEnabled: permissionSet.has(perm),
      }));

      // Only create records for permissions that are enabled
      const enabledPermissions = permissionsToCreate.filter((p) => p.isEnabled);

      if (enabledPermissions.length > 0) {
        await tx.rolePermission.createMany({
          data: enabledPermissions,
          skipDuplicates: true,
        });
      }
    });
  }

  /**
   * Reset role permissions to defaults
   */
  static async resetRolePermissions(role: UserRole): Promise<void> {
    const db = this.ensurePrisma();
    const defaultPermissions = rolePermissions[role] || [];

    await db.$transaction(async (tx) => {
      // Delete all existing permissions for this role
      await tx.rolePermission.deleteMany({
        where: { role },
      });

      // Insert default permissions
      if (defaultPermissions.length > 0) {
        await tx.rolePermission.createMany({
          data: defaultPermissions.map((permission) => ({
            role,
            permission,
            isEnabled: true,
          })),
          skipDuplicates: true,
        });
      }
    });
  }

  /**
   * Initialize default permissions in database (for seeding)
   */
  static async initializeDefaultPermissions(): Promise<void> {
    const db = this.ensurePrisma();
    const roles: UserRole[] = ['ADMIN', 'DISPATCHER', 'ACCOUNTANT', 'DRIVER', 'CUSTOMER', 'HR', 'SAFETY', 'FLEET'];

    for (const role of roles) {
      const defaultPermissions = rolePermissions[role] || [];

      if (defaultPermissions.length > 0) {
        await db.rolePermission.createMany({
          data: defaultPermissions.map((permission) => ({
            role,
            permission,
            isEnabled: true,
          })),
          skipDuplicates: true,
        });
      }
    }
  }

  /**
   * Get permission status for a role (which are custom vs default)
   */
  static async getPermissionStatus(role: UserRole): Promise<{
    permissions: Permission[];
    customPermissions: Permission[];
    defaultPermissions: Permission[];
  }> {
    const db = this.ensurePrisma();
    const defaultPerms = rolePermissions[role] || [];
    const dbPermissions = await db.rolePermission.findMany({
      where: { role, isEnabled: true },
      select: { permission: true },
    });

    const dbPermSet = new Set(dbPermissions.map((p) => p.permission as Permission));
    const defaultPermSet = new Set(defaultPerms);

    // If DB has permissions, use them; otherwise use defaults
    const currentPermissions = dbPermSet.size > 0 
      ? Array.from(dbPermSet) 
      : defaultPerms;

    // Determine which are custom (in DB but not in defaults, or missing from DB when in defaults)
    const customPermissions: Permission[] = [];
    const allPerms = getAllPermissions();

    for (const perm of allPerms) {
      const inDb = dbPermSet.has(perm);
      const inDefault = defaultPermSet.has(perm);

      if (inDb && !inDefault) {
        // Added custom permission
        customPermissions.push(perm);
      } else if (!inDb && inDefault) {
        // Removed default permission
        customPermissions.push(perm);
      }
    }

    return {
      permissions: currentPermissions,
      customPermissions,
      defaultPermissions: defaultPerms,
    };
  }
}


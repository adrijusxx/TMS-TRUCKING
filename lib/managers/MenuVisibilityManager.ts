import type { UserRole } from '@/lib/permissions';

/**
 * Menu item identifier - matches the href in navigation
 */
export type MenuItemId = 
  | '/dashboard'
  | '/dashboard/loads'
  | '/dashboard/analytics'
  | '/dashboard/fleet'
  | '/dashboard/accounting'
  | '/dashboard/safety'
  | '/dashboard/hr'
  | '/dashboard/reports'
  | '/dashboard/settings';

/**
 * Configuration for menu item visibility per role
 * If a role is not listed, the menu item is visible for that role by default (based on permissions)
 */
export interface MenuVisibilityConfig {
  [menuItemId: string]: {
    hiddenForRoles?: UserRole[]; // Roles that should NOT see this menu item
    visibleForRoles?: UserRole[]; // Specific roles that CAN see this menu item (overrides default permission check)
  };
}

/**
 * Default menu visibility configuration
 * Admins can customize this in settings later
 */
const defaultMenuVisibilityConfig: MenuVisibilityConfig = {
  // Example: Hide Analytics for DRIVER role
  // '/dashboard/analytics': {
  //   hiddenForRoles: ['DRIVER'],
  // },
  
  // Example: Only show Settings to specific roles (though permissions handle this)
  // '/dashboard/settings': {
  //   visibleForRoles: ['ADMIN', 'DISPATCHER', 'ACCOUNTANT', 'DRIVER', 'HR', 'SAFETY', 'FLEET'],
  // },
};

/**
 * MenuVisibilityManager
 * Manages which menu items are visible for each role
 */
export class MenuVisibilityManager {
  private static config: MenuVisibilityConfig = defaultMenuVisibilityConfig;

  /**
   * Set menu visibility configuration (from settings/admin config)
   */
  static setConfig(config: MenuVisibilityConfig): void {
    this.config = config;
  }

  /**
   * Get current menu visibility configuration
   */
  static getConfig(): MenuVisibilityConfig {
    return this.config;
  }

  /**
   * Check if a menu item should be visible for a specific role
   * @param menuItemId - The menu item identifier (href)
   * @param role - The user's role
   * @param hasPermission - Whether the user has the required permission (from permission check)
   * @returns true if menu item should be visible
   */
  static isMenuItemVisible(
    menuItemId: MenuItemId,
    role: UserRole,
    hasPermission: boolean
  ): boolean {
    const config = this.config[menuItemId];

    // If no config, use default permission-based visibility
    if (!config) {
      return hasPermission;
    }

    // If explicitly hidden for this role, hide it
    if (config.hiddenForRoles?.includes(role)) {
      return false;
    }

    // If explicitly visible for specific roles, check if this role is in the list
    if (config.visibleForRoles && config.visibleForRoles.length > 0) {
      return config.visibleForRoles.includes(role);
    }

    // Otherwise, use permission-based visibility
    return hasPermission;
  }

  /**
   * Get all menu items that should be hidden for a role
   */
  static getHiddenMenuItems(role: UserRole): MenuItemId[] {
    const hidden: MenuItemId[] = [];

    for (const [menuItemId, config] of Object.entries(this.config)) {
      if (config.hiddenForRoles?.includes(role)) {
        hidden.push(menuItemId as MenuItemId);
      }
    }

    return hidden;
  }

  /**
   * Get all menu items that should be visible for a role (explicitly configured)
   */
  static getVisibleMenuItems(role: UserRole): MenuItemId[] {
    const visible: MenuItemId[] = [];

    for (const [menuItemId, config] of Object.entries(this.config)) {
      if (config.visibleForRoles?.includes(role)) {
        visible.push(menuItemId as MenuItemId);
      }
    }

    return visible;
  }
}


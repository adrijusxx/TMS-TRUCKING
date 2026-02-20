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
 * Uses role slugs (e.g., 'admin', 'dispatcher') instead of legacy enum values.
 */
export interface MenuVisibilityConfig {
  [menuItemId: string]: {
    hiddenForRoles?: string[]; // Role slugs that should NOT see this menu item
    visibleForRoles?: string[]; // Role slugs that CAN see this menu item
  };
}

const defaultMenuVisibilityConfig: MenuVisibilityConfig = {};

/**
 * MenuVisibilityManager
 * Manages which menu items are visible for each role
 */
export class MenuVisibilityManager {
  private static config: MenuVisibilityConfig = defaultMenuVisibilityConfig;

  static setConfig(config: MenuVisibilityConfig): void {
    this.config = config;
  }

  static getConfig(): MenuVisibilityConfig {
    return this.config;
  }

  /**
   * Check if a menu item should be visible for a specific role
   */
  static isMenuItemVisible(
    menuItemId: MenuItemId,
    role: string,
    hasPermission: boolean
  ): boolean {
    const config = this.config[menuItemId];

    if (!config) {
      return hasPermission;
    }

    if (config.hiddenForRoles?.includes(role)) {
      return false;
    }

    if (config.visibleForRoles && config.visibleForRoles.length > 0) {
      return config.visibleForRoles.includes(role);
    }

    return hasPermission;
  }

  static getHiddenMenuItems(role: string): MenuItemId[] {
    const hidden: MenuItemId[] = [];
    for (const [menuItemId, config] of Object.entries(this.config)) {
      if (config.hiddenForRoles?.includes(role)) {
        hidden.push(menuItemId as MenuItemId);
      }
    }
    return hidden;
  }

  static getVisibleMenuItems(role: string): MenuItemId[] {
    const visible: MenuItemId[] = [];
    for (const [menuItemId, config] of Object.entries(this.config)) {
      if (config.visibleForRoles?.includes(role)) {
        visible.push(menuItemId as MenuItemId);
      }
    }
    return visible;
  }
}

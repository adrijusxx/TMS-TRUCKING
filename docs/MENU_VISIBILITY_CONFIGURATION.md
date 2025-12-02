# Menu Visibility Configuration

This document explains how menu visibility is controlled and how to configure it for different roles.

## Overview

The menu visibility system allows admins to control which menu items are visible for each role, in addition to the permission-based access control.

## Current Implementation

### Settings Menu Visibility

All employee roles (DRIVER, DISPATCHER, ACCOUNTANT, HR, SAFETY, FLEET) now have access to the Settings menu. They are automatically redirected to `/dashboard/settings/employee` which shows their profile settings.

### Permission-Based Visibility

Menu items are primarily controlled by permissions:
- Each menu item has an associated permission (e.g., `departments.settings.view`)
- Users need both the permission AND department access to see the menu item
- Settings menu is visible to all roles with `departments.settings.view` permission

### Menu Visibility Manager

The `MenuVisibilityManager` (`lib/managers/MenuVisibilityManager.ts`) allows additional configuration:

1. **Hide menu items for specific roles**: Use `hiddenForRoles` array
2. **Show menu items only for specific roles**: Use `visibleForRoles` array

## Configuration API

### GET `/api/settings/menu-visibility`

Fetch current menu visibility configuration (Admin only)

**Response:**
```json
{
  "success": true,
  "data": {
    "config": {
      "/dashboard/analytics": {
        "hiddenForRoles": ["DRIVER"]
      }
    }
  }
}
```

### PUT `/api/settings/menu-visibility`

Update menu visibility configuration (Admin only)

**Request:**
```json
{
  "config": {
    "/dashboard/analytics": {
      "hiddenForRoles": ["DRIVER", "CUSTOMER"]
    },
    "/dashboard/reports": {
      "visibleForRoles": ["ADMIN", "ACCOUNTANT"]
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Menu visibility configuration updated successfully"
}
```

## Example Configurations

### Hide Analytics for Drivers

```json
{
  "config": {
    "/dashboard/analytics": {
      "hiddenForRoles": ["DRIVER"]
    }
  }
}
```

### Show Reports only to Admins and Accountants

```json
{
  "config": {
    "/dashboard/reports": {
      "visibleForRoles": ["ADMIN", "ACCOUNTANT"]
    }
  }
}
```

### Hide Multiple Menu Items

```json
{
  "config": {
    "/dashboard/analytics": {
      "hiddenForRoles": ["DRIVER", "CUSTOMER"]
    },
    "/dashboard/accounting": {
      "hiddenForRoles": ["DRIVER", "CUSTOMER", "SAFETY"]
    }
  }
}
```

## Menu Item IDs

Available menu item identifiers:

- `/dashboard` - Dashboard (always visible)
- `/dashboard/loads` - Load Management
- `/dashboard/analytics` - Analytics
- `/dashboard/fleet` - Fleet Department
- `/dashboard/accounting` - Accounting Department
- `/dashboard/safety` - Safety Department
- `/dashboard/hr` - HR Management
- `/dashboard/reports` - Reports
- `/dashboard/settings` - Settings

## Implementation Details

### DashboardLayout Integration

The `DashboardLayout` component automatically applies menu visibility configuration:

```typescript
const visibleNavigation = mainNavigation.filter((item) => {
  if (!item.permission) return true;
  
  const hasPermission = can(item.permission);
  const hasDeptAccess = hasRouteAccess(role, item.href);
  const baseVisibility = hasPermission && hasDeptAccess;
  
  // Apply menu visibility configuration
  return MenuVisibilityManager.isMenuItemVisible(
    item.href as MenuItemId,
    role,
    baseVisibility
  );
});
```

### Storage

Menu visibility configuration is stored in `CompanySettings.generalSettings.menuVisibilityConfig` as JSON.

### Default Behavior

If no configuration is set for a menu item, the default permission-based visibility is used.

## Future Enhancements

- Add UI component in admin settings for visual menu visibility configuration
- Support for per-user menu visibility customization
- Menu item ordering configuration
- Menu item grouping/categorization








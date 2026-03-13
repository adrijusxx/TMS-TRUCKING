/**
 * Role Templates
 *
 * Predefined permission sets for common roles.
 * Used by the RoleTemplateSelector to quickly configure
 * a custom role with sensible defaults.
 *
 * Templates derive from systemRoleDefaults to stay in sync
 * with the canonical permission definitions.
 */

import type { Permission } from '@/lib/permissions';
import { systemRoleDefaults } from '@/lib/permissions';

export interface RoleTemplate {
  key: string;
  name: string;
  description: string;
  permissions: Permission[];
}

/**
 * Build a template from a system role's defaults, optionally adding extras.
 */
function fromSystemRole(role: string, extras: Permission[] = []): Permission[] {
  const base = systemRoleDefaults[role] || [];
  const combined = new Set([...base, ...extras]);
  return Array.from(combined) as Permission[];
}

export const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    key: 'DISPATCHER',
    name: 'Dispatcher',
    description: 'Load management, dispatch operations, and basic fleet visibility',
    permissions: fromSystemRole('DISPATCHER'),
  },
  {
    key: 'ACCOUNTANT',
    name: 'Accountant',
    description: 'Financial management, invoicing, settlements, and reporting',
    permissions: fromSystemRole('ACCOUNTANT'),
  },
  {
    key: 'FLEET_MANAGER',
    name: 'Fleet Manager',
    description: 'Vehicle and trailer management, maintenance, and fleet operations',
    permissions: fromSystemRole('FLEET', [
      'fleet.reports',
      'fleet.costs',
      'fleet.communications',
      'fleet.hotspots',
      'fleet.on_call',
      'fleet.monitoring.settings',
      'analytics.view',
      'reports.view',
      'reports.export',
      'departments.reports.view',
    ]),
  },
  {
    key: 'SAFETY_OFFICER',
    name: 'Safety Officer',
    description: 'Safety compliance, inspections, incidents, and driver compliance management',
    permissions: fromSystemRole('SAFETY', [
      'drivers.edit',
      'trucks.edit',
      'trailers.edit',
      'analytics.view',
      'reports.view',
      'reports.export',
      'departments.reports.view',
    ]),
  },
  {
    key: 'HR_MANAGER',
    name: 'HR Manager',
    description: 'Driver and employee management, recruiting, and onboarding',
    permissions: fromSystemRole('HR', [
      'analytics.view',
      'reports.view',
      'reports.export',
      'departments.reports.view',
    ]),
  },
];

/**
 * Get a role template by its key.
 */
export function getRoleTemplate(key: string): RoleTemplate | undefined {
  return ROLE_TEMPLATES.find((t) => t.key === key);
}

/**
 * Get all available role template keys.
 */
export function getRoleTemplateKeys(): string[] {
  return ROLE_TEMPLATES.map((t) => t.key);
}

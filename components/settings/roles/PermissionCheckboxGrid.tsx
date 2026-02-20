'use client';

import { useMemo, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, ChevronDown, ChevronRight, Lock } from 'lucide-react';
import type { Permission } from '@/lib/permissions';

/** Permission categories for UI grouping */
export const permissionCategories: Record<string, Permission[]> = {
  'Loads Management': ['loads.view', 'loads.create', 'loads.edit', 'loads.delete', 'loads.assign', 'loads.bulk_edit', 'loads.bulk_delete'],
  'Driver Management': ['drivers.view', 'drivers.create', 'drivers.edit', 'drivers.delete', 'drivers.manage_compliance', 'drivers.bulk_edit', 'drivers.bulk_delete'],
  'Truck Management': ['trucks.view', 'trucks.create', 'trucks.edit', 'trucks.delete', 'trucks.bulk_edit', 'trucks.bulk_delete'],
  'Trailer Management': ['trailers.view', 'trailers.create', 'trailers.edit', 'trailers.delete', 'trailers.bulk_edit', 'trailers.bulk_delete'],
  'Customer Management': ['customers.view', 'customers.create', 'customers.edit', 'customers.delete', 'customers.bulk_edit', 'customers.bulk_delete'],
  'Financial Management': [
    'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.delete', 'invoices.generate', 'invoices.bulk_edit', 'invoices.bulk_delete',
    'settlements.view', 'settlements.create', 'settlements.edit', 'settlements.delete', 'settlements.approve', 'settlements.bulk_edit', 'settlements.bulk_delete',
    'expenses.view', 'expenses.approve',
    'factoring_companies.view', 'factoring_companies.create', 'factoring_companies.edit', 'factoring_companies.delete', 'factoring_companies.bulk_edit', 'factoring_companies.bulk_delete',
    'rate_confirmations.view', 'rate_confirmations.create', 'rate_confirmations.edit', 'rate_confirmations.delete', 'rate_confirmations.bulk_edit', 'rate_confirmations.bulk_delete',
  ],
  'User Management': ['users.view', 'users.create', 'users.edit', 'users.delete'],
  'System Settings': ['settings.view', 'settings.edit', 'settings.security', 'settings.notifications', 'settings.appearance', 'company.view', 'company.edit', 'company.branding'],
  'Reports & Analytics': ['analytics.view', 'reports.view', 'reports.export'],
  'Documents': ['documents.view', 'documents.upload', 'documents.delete', 'documents.bulk_edit', 'documents.bulk_delete'],
  'Accounting & Batches': [
    'batches.view', 'batches.create', 'batches.edit', 'batches.delete', 'batches.post', 'batches.bulk_edit', 'batches.bulk_delete',
    'deduction_rules.view', 'deduction_rules.create', 'deduction_rules.edit', 'deduction_rules.delete',
    'advances.view', 'advances.create', 'advances.approve', 'advances.delete',
  ],
  'Fleet Operations': [
    'maintenance.view', 'maintenance.create', 'maintenance.edit', 'maintenance.delete', 'maintenance.bulk_edit', 'maintenance.bulk_delete',
    'breakdowns.view', 'breakdowns.create', 'breakdowns.edit', 'breakdowns.delete', 'breakdowns.bulk_edit', 'breakdowns.bulk_delete',
    'inspections.view', 'inspections.create', 'inspections.edit', 'inspections.delete', 'inspections.bulk_edit', 'inspections.bulk_delete',
    'fuel.view', 'fuel.create', 'fuel.edit', 'fuel.delete',
    'vendors.view', 'vendors.create', 'vendors.edit', 'vendors.delete', 'vendors.bulk_edit', 'vendors.bulk_delete',
    'fleet.reports', 'fleet.costs', 'fleet.communications', 'fleet.hotspots', 'fleet.on_call',
  ],
  'Data Management': [
    'import.view', 'import.execute', 'export.view', 'export.execute',
    'mc_numbers.view', 'mc_numbers.create', 'mc_numbers.edit', 'mc_numbers.delete',
    'locations.view', 'locations.create', 'locations.edit', 'locations.delete', 'locations.bulk_edit', 'locations.bulk_delete',
    'data.bulk_actions', 'data.bulk_edit', 'data.bulk_delete', 'data.import', 'data.export', 'data.column_visibility', 'data.backup', 'data.restore',
  ],
  'System Features': ['automation.view', 'automation.manage', 'edi.view', 'edi.manage', 'calendar.view', 'calendar.edit', 'loadboard.view', 'loadboard.post'],
  'Safety Operations': [
    'safety.view', 'safety.manage', 'compliance.view', 'compliance.manage',
    'safety.incidents.view', 'safety.incidents.create', 'safety.incidents.edit', 'safety.incidents.delete',
    'safety.drug_tests.view', 'safety.drug_tests.create', 'safety.drug_tests.edit',
    'safety.mvr.view', 'safety.mvr.create', 'safety.mvr.edit',
    'safety.medical_cards.view', 'safety.medical_cards.create', 'safety.medical_cards.edit',
    'safety.hos.view', 'safety.hos.manage',
    'safety.dvir.view', 'safety.dvir.create', 'safety.dvir.edit',
    'safety.training.view', 'safety.training.manage',
    'safety.compliance.view', 'safety.compliance.manage',
    'safety.alerts.view', 'safety.alerts.manage',
  ],
  'Department Access': [
    'departments.accounting.view', 'departments.fleet.view', 'departments.safety.view',
    'departments.hr.view', 'departments.reports.view', 'departments.settings.view', 'departments.crm.view',
  ],
  'CRM / Recruiting': [
    'crm.leads.view', 'crm.leads.create', 'crm.leads.edit', 'crm.leads.delete', 'crm.leads.assign',
    'crm.hire', 'crm.onboarding.view', 'crm.onboarding.manage', 'crm.templates.manage',
  ],
};

/** Human-readable labels for permissions */
export function getPermissionLabel(permission: string): string {
  const parts = permission.split('.');
  const action = parts[parts.length - 1];
  const entity = parts.slice(0, -1).join(' ');
  const actionMap: Record<string, string> = {
    view: 'View', create: 'Create', edit: 'Edit', delete: 'Delete',
    assign: 'Assign', manage: 'Manage', approve: 'Approve', generate: 'Generate',
    upload: 'Upload', export: 'Export', execute: 'Execute', post: 'Post',
    manage_compliance: 'Manage Compliance', bulk_edit: 'Bulk Edit', bulk_delete: 'Bulk Delete',
    bulk_actions: 'Bulk Actions', column_visibility: 'Column Visibility',
    backup: 'Backup', restore: 'Restore', branding: 'Branding',
    security: 'Security', notifications: 'Notifications', appearance: 'Appearance',
    reports: 'Reports', costs: 'Costs', communications: 'Communications',
    hotspots: 'Hotspots', on_call: 'On-Call', hire: 'Hire',
  };
  const entityName = entity.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return `${actionMap[action] || action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} ${entityName}`.trim();
}

interface PermissionCheckboxGridProps {
  /** Currently selected permissions */
  permissions: Permission[];
  /** Callback when permissions change */
  onPermissionsChange: (permissions: Permission[]) => void;
  /** Permissions inherited from parent role (shown as read-only checked) */
  inheritedPermissions?: Permission[];
  /** Whether the grid is read-only */
  readOnly?: boolean;
}

export default function PermissionCheckboxGrid({
  permissions,
  onPermissionsChange,
  inheritedPermissions = [],
  readOnly = false,
}: PermissionCheckboxGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const allActive = useMemo(() => {
    const set = new Set([...permissions, ...inheritedPermissions]);
    return set;
  }, [permissions, inheritedPermissions]);

  const filteredCategories = useMemo(() => {
    const entries = Object.entries(permissionCategories);
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase();
    return entries
      .map(([cat, perms]) => {
        const filtered = perms.filter(p =>
          getPermissionLabel(p).toLowerCase().includes(q) || p.toLowerCase().includes(q)
        );
        return [cat, filtered] as [string, Permission[]];
      })
      .filter(([, perms]) => perms.length > 0);
  }, [searchQuery]);

  const handleToggle = (perm: Permission) => {
    if (readOnly || inheritedPermissions.includes(perm)) return;
    const newPerms = permissions.includes(perm)
      ? permissions.filter(p => p !== perm)
      : [...permissions, perm];
    onPermissionsChange(newPerms);
  };

  const handleCategoryToggle = (categoryPerms: Permission[]) => {
    if (readOnly) return;
    const editablePerms = categoryPerms.filter(p => !inheritedPermissions.includes(p));
    const allSelected = editablePerms.every(p => permissions.includes(p));
    let newPerms: Permission[];
    if (allSelected) {
      newPerms = permissions.filter(p => !editablePerms.includes(p));
    } else {
      newPerms = [...permissions];
      editablePerms.forEach(p => { if (!newPerms.includes(p)) newPerms.push(p); });
    }
    onPermissionsChange(newPerms);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search permissions..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredCategories.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No permissions found matching &quot;{searchQuery}&quot;
          </CardContent>
        </Card>
      ) : (
        filteredCategories.map(([category, perms]) => {
          const selectedCount = perms.filter(p => allActive.has(p)).length;
          const editablePerms = perms.filter(p => !inheritedPermissions.includes(p));
          const allEditableSelected = editablePerms.length > 0 && editablePerms.every(p => permissions.includes(p));
          const someSelected = selectedCount > 0 && selectedCount < perms.length;
          const isExpanded = expandedCategories[category] ?? !!searchQuery.trim();

          return (
            <Collapsible
              key={category}
              open={isExpanded}
              onOpenChange={() => setExpandedCategories(prev => ({ ...prev, [category]: !isExpanded }))}
            >
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                        {!readOnly && (
                          <Checkbox
                            checked={allEditableSelected && selectedCount === perms.length}
                            ref={el => { if (el) (el as any).indeterminate = someSelected; }}
                            onClick={e => e.stopPropagation()}
                            onCheckedChange={() => handleCategoryToggle(perms)}
                          />
                        )}
                        <CardTitle className="text-base font-semibold">{category}</CardTitle>
                        <Badge variant="secondary" className="text-xs">{selectedCount}/{perms.length}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pl-8">
                      {perms.map(perm => {
                        const isInherited = inheritedPermissions.includes(perm);
                        const isChecked = allActive.has(perm);
                        return (
                          <div key={perm} className="flex items-center space-x-2">
                            <Checkbox
                              id={`perm-${perm}`}
                              checked={isChecked}
                              disabled={readOnly || isInherited}
                              onCheckedChange={() => handleToggle(perm)}
                            />
                            <Label htmlFor={`perm-${perm}`} className="text-sm font-normal cursor-pointer flex-1">
                              {getPermissionLabel(perm)}
                            </Label>
                            {isInherited && <span title="Inherited from parent role"><Lock className="h-3 w-3 text-muted-foreground" /></span>}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })
      )}
    </div>
  );
}

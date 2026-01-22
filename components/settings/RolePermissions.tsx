'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Save, RotateCcw, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import {
  getAllPermissions,
  getRolePermissions,
  type Permission,
  type UserRole,
  rolePermissions as defaultRolePermissions,
} from '@/lib/permissions';
import { apiUrl } from '@/lib/utils';
import { departmentLabels, departmentDescriptions } from '@/lib/department-access';

// Group permissions by category
const permissionCategories: Record<string, Permission[]> = {
  'Loads Management': [
    'loads.view',
    'loads.create',
    'loads.edit',
    'loads.delete',
    'loads.assign',
  ],
  'Driver Management': [
    'drivers.view',
    'drivers.create',
    'drivers.edit',
    'drivers.delete',
  ],
  'Truck Management': [
    'trucks.view',
    'trucks.create',
    'trucks.edit',
    'trucks.delete',
  ],
  'Customer Management': [
    'customers.view',
    'customers.create',
    'customers.edit',
    'customers.delete',
  ],
  'Financial Management': [
    'invoices.view',
    'invoices.create',
    'invoices.edit',
    'invoices.delete',
    'invoices.generate',
    'settlements.view',
    'settlements.create',
    'settlements.edit',
    'settlements.delete',
  ],
  'User Management': [
    'users.view',
    'users.create',
    'users.edit',
    'users.delete',
  ],
  'System Settings': [
    'settings.view',
    'settings.edit',
    'company.edit',
  ],
  'Reports & Analytics': [
    'analytics.view',
    'reports.view',
  ],
  'Documents': [
    'documents.view',
    'documents.upload',
    'documents.delete',
  ],
  'Accounting & Batches': [
    'batches.view',
    'batches.create',
    'batches.edit',
    'batches.delete',
    'batches.post',
    'deduction_rules.view',
    'deduction_rules.create',
    'deduction_rules.edit',
    'deduction_rules.delete',
    'advances.view',
    'advances.create',
    'advances.approve',
    'advances.delete',
  ],
  'Fleet Operations': [
    'maintenance.view',
    'maintenance.create',
    'maintenance.edit',
    'maintenance.delete',
    'breakdowns.view',
    'breakdowns.create',
    'breakdowns.edit',
    'breakdowns.delete',
    'inspections.view',
    'inspections.create',
    'inspections.edit',
    'inspections.delete',
    'fuel.view',
    'fuel.create',
    'fuel.edit',
    'fuel.delete',
    'vendors.view',
    'vendors.create',
    'vendors.edit',
    'vendors.delete',
  ],
  'Extended Fleet Operations': [
    'fleet.reports',
    'fleet.costs',
    'fleet.communications',
    'fleet.hotspots',
    'fleet.on_call',
  ],
  'Data Management': [
    'import.view',
    'import.execute',
    'export.view',
    'export.execute',
    'mc_numbers.view',
    'mc_numbers.create',
    'mc_numbers.edit',
    'mc_numbers.delete',
    'locations.view',
    'locations.create',
    'locations.edit',
    'locations.delete',
  ],
  'Extended Data Management': [
    'data.bulk_actions',
    'data.backup',
    'data.restore',
  ],
  'System Features': [
    'automation.view',
    'automation.manage',
    'edi.view',
    'edi.manage',
    'calendar.view',
    'calendar.edit',
    'loadboard.view',
    'loadboard.post',
  ],
  'Safety Operations': [
    'safety.incidents.view',
    'safety.incidents.create',
    'safety.incidents.edit',
    'safety.incidents.delete',
    'safety.drug_tests.view',
    'safety.drug_tests.create',
    'safety.drug_tests.edit',
    'safety.mvr.view',
    'safety.mvr.create',
    'safety.mvr.edit',
    'safety.medical_cards.view',
    'safety.medical_cards.create',
    'safety.medical_cards.edit',
    'safety.hos.view',
    'safety.hos.manage',
    'safety.dvir.view',
    'safety.dvir.create',
    'safety.dvir.edit',
    'safety.training.view',
    'safety.training.manage',
    'safety.compliance.view',
    'safety.compliance.manage',
    'safety.alerts.view',
    'safety.alerts.manage',
  ],
  'Department Access': [
    'departments.accounting.view',
    'departments.fleet.view',
    'departments.safety.view',
    'departments.hr.view',
    'departments.reports.view',
    'departments.settings.view',
    'departments.crm.view',
  ],
  'CRM / Recruitment': [
    'crm.leads.view',
    'crm.leads.create',
    'crm.leads.edit',
    'crm.leads.delete',
    'crm.leads.assign',
  ],
};

const roleLabels: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrator',
  DISPATCHER: 'Dispatcher',
  ACCOUNTANT: 'Accountant',
  DRIVER: 'Driver',
  CUSTOMER: 'Customer',
  HR: 'HR Manager',
  SAFETY: 'Safety Manager',
  FLEET: 'Fleet Manager',
};

const roleDescriptions: Record<UserRole, string> = {
  SUPER_ADMIN: 'Total system control and platform settings',
  ADMIN: 'Full system access with all permissions',
  DISPATCHER: 'Load management and dispatch operations',
  ACCOUNTANT: 'Financial and invoice management',
  DRIVER: 'View assigned loads and upload documents',
  CUSTOMER: 'View own loads and documents',
  HR: 'Human resources and driver management',
  SAFETY: 'Safety and compliance management',
  FLEET: 'Fleet management - trucks, trailers, and maintenance',
};

function getPermissionLabel(permission: Permission): string {
  const labels: Record<Permission, string> = {
    'loads.view': 'View Loads',
    'loads.create': 'Create Loads',
    'loads.edit': 'Edit Loads',
    'loads.delete': 'Delete Loads',
    'loads.assign': 'Assign Loads',
    'loads.bulk_edit': 'Bulk Edit Loads',
    'loads.bulk_delete': 'Bulk Delete Loads',
    'drivers.view': 'View Drivers',
    'drivers.create': 'Create Drivers',
    'drivers.edit': 'Edit Drivers',
    'drivers.delete': 'Delete Drivers',
    'drivers.manage_compliance': 'Manage Driver Compliance',
    'drivers.bulk_edit': 'Bulk Edit Drivers',
    'drivers.bulk_delete': 'Bulk Delete Drivers',
    'trucks.view': 'View Trucks',
    'trucks.create': 'Create Trucks',
    'trucks.edit': 'Edit Trucks',
    'trucks.delete': 'Delete Trucks',
    'trucks.bulk_edit': 'Bulk Edit Trucks',
    'trucks.bulk_delete': 'Bulk Delete Trucks',
    'trailers.view': 'View Trailers',
    'trailers.create': 'Create Trailers',
    'trailers.edit': 'Edit Trailers',
    'trailers.delete': 'Delete Trailers',
    'trailers.bulk_edit': 'Bulk Edit Trailers',
    'trailers.bulk_delete': 'Bulk Delete Trailers',
    'customers.view': 'View Customers',
    'customers.create': 'Create Customers',
    'customers.edit': 'Edit Customers',
    'customers.delete': 'Delete Customers',
    'customers.bulk_edit': 'Bulk Edit Customers',
    'customers.bulk_delete': 'Bulk Delete Customers',
    'invoices.view': 'View Invoices',
    'invoices.create': 'Create Invoices',
    'invoices.edit': 'Edit Invoices',
    'invoices.delete': 'Delete Invoices',
    'invoices.generate': 'Generate Invoices',
    'invoices.bulk_edit': 'Bulk Edit Invoices',
    'invoices.bulk_delete': 'Bulk Delete Invoices',
    'settlements.view': 'View Settlements',
    'settlements.create': 'Create Settlements',
    'settlements.edit': 'Edit Settlements',
    'settlements.delete': 'Delete Settlements',
    'settlements.approve': 'Approve Settlements',
    'settlements.bulk_edit': 'Bulk Edit Settlements',
    'settlements.bulk_delete': 'Bulk Delete Settlements',
    'expenses.view': 'View Expenses',
    'expenses.approve': 'Approve Expenses',
    'factoring_companies.view': 'View Factoring Companies',
    'factoring_companies.create': 'Create Factoring Companies',
    'factoring_companies.edit': 'Edit Factoring Companies',
    'factoring_companies.delete': 'Delete Factoring Companies',
    'factoring_companies.bulk_edit': 'Bulk Edit Factoring Companies',
    'factoring_companies.bulk_delete': 'Bulk Delete Factoring Companies',
    'rate_confirmations.view': 'View Rate Confirmations',
    'rate_confirmations.create': 'Create Rate Confirmations',
    'rate_confirmations.edit': 'Edit Rate Confirmations',
    'rate_confirmations.delete': 'Delete Rate Confirmations',
    'rate_confirmations.bulk_edit': 'Bulk Edit Rate Confirmations',
    'rate_confirmations.bulk_delete': 'Bulk Delete Rate Confirmations',
    'users.view': 'View Users',
    'users.create': 'Create Users',
    'users.edit': 'Edit Users',
    'users.delete': 'Delete Users',
    'settings.view': 'View Settings',
    'settings.edit': 'Edit Settings',
    'settings.security': 'Security Settings',
    'settings.notifications': 'Notification Settings',
    'settings.appearance': 'Appearance Settings',
    'company.view': 'View Company',
    'company.edit': 'Edit Company Info',
    'company.branding': 'Company Branding',
    'analytics.view': 'View Analytics',
    'reports.view': 'View Reports',
    'reports.export': 'Export Reports',
    'documents.view': 'View Documents',
    'documents.upload': 'Upload Documents',
    'documents.delete': 'Delete Documents',
    'documents.bulk_edit': 'Bulk Edit Documents',
    'documents.bulk_delete': 'Bulk Delete Documents',
    'safety.view': 'View Safety',
    'safety.manage': 'Manage Safety',
    'compliance.view': 'View Compliance',
    'compliance.manage': 'Manage Compliance',
    // Accounting & Batches
    'batches.view': 'View Batches',
    'batches.create': 'Create Batches',
    'batches.edit': 'Edit Batches',
    'batches.delete': 'Delete Batches',
    'batches.post': 'Post Batches',
    'batches.bulk_edit': 'Bulk Edit Batches',
    'batches.bulk_delete': 'Bulk Delete Batches',
    'deduction_rules.view': 'View Deduction Rules',
    'deduction_rules.create': 'Create Deduction Rules',
    'deduction_rules.edit': 'Edit Deduction Rules',
    'deduction_rules.delete': 'Delete Deduction Rules',
    'advances.view': 'View Advances',
    'advances.create': 'Create Advances',
    'advances.approve': 'Approve Advances',
    'advances.delete': 'Delete Advances',
    // Fleet Operations
    'maintenance.view': 'View Maintenance',
    'maintenance.create': 'Create Maintenance',
    'maintenance.edit': 'Edit Maintenance',
    'maintenance.delete': 'Delete Maintenance',
    'maintenance.bulk_edit': 'Bulk Edit Maintenance',
    'maintenance.bulk_delete': 'Bulk Delete Maintenance',
    'breakdowns.view': 'View Breakdowns',
    'breakdowns.create': 'Create Breakdowns',
    'breakdowns.edit': 'Edit Breakdowns',
    'breakdowns.delete': 'Delete Breakdowns',
    'breakdowns.bulk_edit': 'Bulk Edit Breakdowns',
    'breakdowns.bulk_delete': 'Bulk Delete Breakdowns',
    'inspections.view': 'View Inspections',
    'inspections.create': 'Create Inspections',
    'inspections.edit': 'Edit Inspections',
    'inspections.delete': 'Delete Inspections',
    'inspections.bulk_edit': 'Bulk Edit Inspections',
    'inspections.bulk_delete': 'Bulk Delete Inspections',
    'fuel.view': 'View Fuel',
    'fuel.create': 'Create Fuel Entries',
    'fuel.edit': 'Edit Fuel Entries',
    'fuel.delete': 'Delete Fuel Entries',
    'vendors.view': 'View Vendors',
    'vendors.create': 'Create Vendors',
    'vendors.edit': 'Edit Vendors',
    'vendors.delete': 'Delete Vendors',
    'vendors.bulk_edit': 'Bulk Edit Vendors',
    'vendors.bulk_delete': 'Bulk Delete Vendors',
    // Extended Fleet Operations
    'fleet.reports': 'Fleet Reports',
    'fleet.costs': 'Fleet Costs',
    'fleet.communications': 'Fleet Communications',
    'fleet.hotspots': 'Fleet Hotspots',
    'fleet.on_call': 'Fleet On-Call',
    // Data Management
    'import.view': 'View Import',
    'import.execute': 'Execute Import',
    'export.view': 'View Export',
    'export.execute': 'Execute Export',
    'mc_numbers.view': 'View MC Numbers',
    'mc_numbers.create': 'Create MC Numbers',
    'mc_numbers.edit': 'Edit MC Numbers',
    'mc_numbers.delete': 'Delete MC Numbers',
    'locations.view': 'View Locations',
    'locations.create': 'Create Locations',
    'locations.edit': 'Edit Locations',
    'locations.delete': 'Delete Locations',
    'locations.bulk_edit': 'Bulk Edit Locations',
    'locations.bulk_delete': 'Bulk Delete Locations',
    // Extended Data Management
    'data.bulk_actions': 'Bulk Actions',
    'data.bulk_edit': 'Bulk Edit Data',
    'data.bulk_delete': 'Bulk Delete Data',
    'data.import': 'Import Data',
    'data.export': 'Export Data',
    'data.column_visibility': 'Column Visibility',
    'data.backup': 'Data Backup',
    'data.restore': 'Data Restore',
    // System Features
    'automation.view': 'View Automation',
    'automation.manage': 'Manage Automation',
    'edi.view': 'View EDI',
    'edi.manage': 'Manage EDI',
    'calendar.view': 'View Calendar',
    'calendar.edit': 'Edit Calendar',
    'loadboard.view': 'View Loadboard',
    'loadboard.post': 'Post to Loadboard',
    // Safety Operations
    'safety.incidents.view': 'View Safety Incidents',
    'safety.incidents.create': 'Create Safety Incidents',
    'safety.incidents.edit': 'Edit Safety Incidents',
    'safety.incidents.delete': 'Delete Safety Incidents',
    'safety.drug_tests.view': 'View Drug Tests',
    'safety.drug_tests.create': 'Create Drug Tests',
    'safety.drug_tests.edit': 'Edit Drug Tests',
    'safety.mvr.view': 'View MVR',
    'safety.mvr.create': 'Create MVR',
    'safety.mvr.edit': 'Edit MVR',
    'safety.medical_cards.view': 'View Medical Cards',
    'safety.medical_cards.create': 'Create Medical Cards',
    'safety.medical_cards.edit': 'Edit Medical Cards',
    'safety.hos.view': 'View Hours of Service',
    'safety.hos.manage': 'Manage Hours of Service',
    'safety.dvir.view': 'View DVIR',
    'safety.dvir.create': 'Create DVIR',
    'safety.dvir.edit': 'Edit DVIR',
    'safety.training.view': 'View Safety Training',
    'safety.training.manage': 'Manage Safety Training',
    'safety.compliance.view': 'View Safety Compliance',
    'safety.compliance.manage': 'Manage Safety Compliance',
    'safety.alerts.view': 'View Safety Alerts',
    'safety.alerts.manage': 'Manage Safety Alerts',
    // Department Access
    'departments.accounting.view': departmentLabels['departments.accounting.view'],
    'departments.fleet.view': departmentLabels['departments.fleet.view'],
    'departments.safety.view': departmentLabels['departments.safety.view'],
    'departments.hr.view': departmentLabels['departments.hr.view'],
    'departments.reports.view': departmentLabels['departments.reports.view'],
    'departments.settings.view': departmentLabels['departments.settings.view'],
    'departments.crm.view': 'View Recruitment',
    // CRM / Recruitment
    'crm.leads.view': 'View Leads',
    'crm.leads.create': 'Create Leads',
    'crm.leads.edit': 'Edit Leads',
    'crm.leads.delete': 'Delete Leads',
    'crm.leads.assign': 'Assign Leads',
  };
  return labels[permission] || permission;
}

export default function RolePermissions() {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<UserRole>('DISPATCHER');
  const [customPermissions, setCustomPermissions] = useState<Record<UserRole, Permission[]>>(
    defaultRolePermissions
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Fetch role permissions from API
  const { data: rolePermissionsData, isLoading } = useQuery({
    queryKey: ['role-permissions'],
    queryFn: async () => {
      const response = await fetch(apiUrl('/api/settings/role-permissions'));
      if (!response.ok) throw new Error('Failed to fetch role permissions');
      const result = await response.json();
      return result.data;
    },
  });

  // Update permissions when data loads
  useEffect(() => {
    if (rolePermissionsData?.roles) {
      const loadedPermissions: Record<string, Permission[]> = {};
      Object.keys(rolePermissionsData.roles).forEach((role) => {
        loadedPermissions[role] = rolePermissionsData.roles[role].permissions || [];
      });
      setCustomPermissions(loadedPermissions as Record<UserRole, Permission[]>);
    }
  }, [rolePermissionsData]);

  // Save permissions mutation
  const saveMutation = useMutation({
    mutationFn: async ({ role, permissions }: { role: UserRole; permissions: Permission[] }) => {
      const response = await fetch(apiUrl('/api/settings/role-permissions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, permissions }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to save permissions');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast.success('Role permissions saved successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save permissions');
    },
  });

  // Reset permissions mutation
  const resetMutation = useMutation({
    mutationFn: async (role: UserRole) => {
      const response = await fetch(apiUrl('/api/settings/role-permissions'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to reset permissions');
      }
      return response.json();
    },
    onSuccess: (_, role) => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast.success(`${roleLabels[role]} permissions reset to default`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reset permissions');
    },
  });

  const handlePermissionToggle = (role: UserRole, permission: Permission) => {
    setCustomPermissions((prev) => {
      const rolePerms = prev[role] || [];
      const newPerms = rolePerms.includes(permission)
        ? rolePerms.filter((p) => p !== permission)
        : [...rolePerms, permission];
      return { ...prev, [role]: newPerms };
    });
  };

  const handleCategoryToggle = (role: UserRole, category: Permission[]) => {
    const rolePerms = customPermissions[role] || [];
    const allSelected = category.every((p) => rolePerms.includes(p));

    setCustomPermissions((prev) => {
      const currentPerms = prev[role] || [];
      if (allSelected) {
        // Remove all permissions in this category
        return {
          ...prev,
          [role]: currentPerms.filter((p) => !category.includes(p)),
        };
      } else {
        // Add all permissions in this category
        const newPerms = [...currentPerms];
        category.forEach((p) => {
          if (!newPerms.includes(p)) {
            newPerms.push(p);
          }
        });
        return { ...prev, [role]: newPerms };
      }
    });
  };

  const handleReset = (role: UserRole) => {
    resetMutation.mutate(role);
  };

  const handleSave = () => {
    saveMutation.mutate({
      role: selectedRole,
      permissions: customPermissions[selectedRole] || [],
    });
  };

  const currentRolePerms = customPermissions[selectedRole] || [];

  // Filter categories and permissions based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return Object.entries(permissionCategories);
    }

    const query = searchQuery.toLowerCase();
    return Object.entries(permissionCategories)
      .map(([category, perms]) => {
        const filteredPerms = perms.filter((perm) => {
          const label = getPermissionLabel(perm).toLowerCase();
          return label.includes(query) || perm.toLowerCase().includes(query);
        });
        return [category, filteredPerms] as [string, Permission[]];
      })
      .filter(([_, perms]) => perms.length > 0);
  }, [searchQuery]);

  // Expand all categories when searching
  useEffect(() => {
    if (searchQuery.trim()) {
      const expanded: Record<string, boolean> = {};
      filteredCategories.forEach(([category]) => {
        expanded[category] = true;
      });
      setExpandedCategories(expanded);
    }
  }, [searchQuery, filteredCategories]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const hasUnsavedChanges = useMemo(() => {
    const defaultPerms = defaultRolePermissions[selectedRole] || [];
    const currentPerms = customPermissions[selectedRole] || [];
    return JSON.stringify([...defaultPerms].sort()) !== JSON.stringify([...currentPerms].sort());
  }, [selectedRole, customPermissions]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <h3 className="text-xl font-semibold mb-2">Role Permissions</h3>
        <p className="text-muted-foreground text-sm">
          Configure permissions for each role. Default permissions are shown but can be customized.
        </p>
      </div>

      {/* Role Selector - Tabs Style */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
              {(Object.keys(roleLabels) as UserRole[]).map((role) => (
                <TabsTrigger key={role} value={role} className="text-xs sm:text-sm">
                  {roleLabels[role]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Role Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h4 className="text-lg font-semibold">{roleLabels[selectedRole]}</h4>
                {hasUnsavedChanges && (
                  <Badge variant="outline" className="text-xs">
                    Unsaved Changes
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {roleDescriptions[selectedRole]}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {rolePermissionsData?.roles?.[selectedRole]?.customPermissions?.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {rolePermissionsData.roles[selectedRole].customPermissions.length} custom
                </Badge>
              )}
              <Badge variant="outline">
                {currentRolePerms.length} permissions
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search permissions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Permissions by Category - Collapsible */}
      <div className="space-y-3">
        {filteredCategories.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No permissions found matching "{searchQuery}"
            </CardContent>
          </Card>
        ) : (
          filteredCategories.map(([category, perms]) => {
            const selectedCount = perms.filter((p) => currentRolePerms.includes(p)).length;
            const allSelected = selectedCount === perms.length;
            const someSelected = selectedCount > 0 && selectedCount < perms.length;
            const isExpanded = expandedCategories[category] ?? false;

            return (
              <Collapsible
                key={category}
                open={isExpanded}
                onOpenChange={() => toggleCategory(category)}
              >
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={allSelected}
                              ref={(el) => {
                                if (el) {
                                  (el as any).indeterminate = someSelected;
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              onCheckedChange={(checked) => {
                                handleCategoryToggle(selectedRole, perms as Permission[]);
                              }}
                            />
                            <CardTitle className="text-base font-semibold">
                              {category}
                            </CardTitle>
                            <Badge variant="secondary" className="text-xs">
                              {selectedCount}/{perms.length}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pl-8">
                        {perms.map((permission) => (
                          <div key={permission} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${selectedRole}-${permission}`}
                              checked={currentRolePerms.includes(permission)}
                              onCheckedChange={() =>
                                handlePermissionToggle(selectedRole, permission as Permission)
                              }
                            />
                            <Label
                              htmlFor={`${selectedRole}-${permission}`}
                              className="text-sm font-normal cursor-pointer flex-1"
                            >
                              {getPermissionLabel(permission)}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })
        )}
      </div>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => handleReset(selectedRole)}
              disabled={resetMutation.isPending || isLoading}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Default
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending || isLoading || !hasUnsavedChanges}
            >
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


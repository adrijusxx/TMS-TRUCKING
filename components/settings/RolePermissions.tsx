'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Shield, Save } from 'lucide-react';
import { toast } from 'sonner';
import {
  getAllPermissions,
  getRolePermissions,
  type Permission,
  type UserRole,
  rolePermissions as defaultRolePermissions,
} from '@/lib/permissions';

// Group permissions by category
const permissionCategories = {
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
};

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Administrator',
  DISPATCHER: 'Dispatcher',
  ACCOUNTANT: 'Accountant',
  DRIVER: 'Driver',
  CUSTOMER: 'Customer',
};

const roleDescriptions: Record<UserRole, string> = {
  ADMIN: 'Full system access with all permissions',
  DISPATCHER: 'Load management and dispatch operations',
  ACCOUNTANT: 'Financial and invoice management',
  DRIVER: 'View assigned loads and upload documents',
  CUSTOMER: 'View own loads and documents',
};

function getPermissionLabel(permission: Permission): string {
  const labels: Record<Permission, string> = {
    'loads.view': 'View Loads',
    'loads.create': 'Create Loads',
    'loads.edit': 'Edit Loads',
    'loads.delete': 'Delete Loads',
    'loads.assign': 'Assign Loads',
    'drivers.view': 'View Drivers',
    'drivers.create': 'Create Drivers',
    'drivers.edit': 'Edit Drivers',
    'drivers.delete': 'Delete Drivers',
    'trucks.view': 'View Trucks',
    'trucks.create': 'Create Trucks',
    'trucks.edit': 'Edit Trucks',
    'trucks.delete': 'Delete Trucks',
    'customers.view': 'View Customers',
    'customers.create': 'Create Customers',
    'customers.edit': 'Edit Customers',
    'customers.delete': 'Delete Customers',
    'invoices.view': 'View Invoices',
    'invoices.create': 'Create Invoices',
    'invoices.edit': 'Edit Invoices',
    'invoices.delete': 'Delete Invoices',
    'invoices.generate': 'Generate Invoices',
    'settlements.view': 'View Settlements',
    'settlements.create': 'Create Settlements',
    'settlements.edit': 'Edit Settlements',
    'settlements.delete': 'Delete Settlements',
    'users.view': 'View Users',
    'users.create': 'Create Users',
    'users.edit': 'Edit Users',
    'users.delete': 'Delete Users',
    'settings.view': 'View Settings',
    'settings.edit': 'Edit Settings',
    'company.edit': 'Edit Company Info',
    'analytics.view': 'View Analytics',
    'reports.view': 'View Reports',
    'documents.view': 'View Documents',
    'documents.upload': 'Upload Documents',
    'documents.delete': 'Delete Documents',
  };
  return labels[permission] || permission;
}

export default function RolePermissions() {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<UserRole>('DISPATCHER');
  const [customPermissions, setCustomPermissions] = useState<Record<UserRole, Permission[]>>(
    defaultRolePermissions
  );

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
    setCustomPermissions((prev) => ({
      ...prev,
      [role]: defaultRolePermissions[role],
    }));
    toast.success(`${roleLabels[role]} permissions reset to default`);
  };

  const handleSave = () => {
    // In a real app, you'd save this to a database
    // For now, we'll store it in localStorage or just show a message
    localStorage.setItem('customRolePermissions', JSON.stringify(customPermissions));
    toast.success('Role permissions saved successfully');
  };

  const currentRolePerms = customPermissions[selectedRole] || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Role Permissions
        </CardTitle>
        <CardDescription>
          Configure permissions for each role. Default permissions are shown but can be customized.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Role Selector */}
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(roleLabels) as UserRole[]).map((role) => (
            <Button
              key={role}
              variant={selectedRole === role ? 'default' : 'outline'}
              onClick={() => setSelectedRole(role)}
            >
              {roleLabels[role]}
            </Button>
          ))}
        </div>

        {/* Role Description */}
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">{roleLabels[selectedRole]}</h3>
            <Badge variant="outline">{currentRolePerms.length} permissions</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {roleDescriptions[selectedRole]}
          </p>
        </div>

        {/* Permissions by Category */}
        <div className="space-y-6">
          {Object.entries(permissionCategories).map(([category, perms]) => {
            const selectedCount = perms.filter((p) => currentRolePerms.includes(p)).length;
            const allSelected = selectedCount === perms.length;
            const someSelected = selectedCount > 0 && selectedCount < perms.length;

            return (
              <div key={category} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={allSelected}
                      ref={(el) => {
                        if (el) {
                          (el as any).indeterminate = someSelected;
                        }
                      }}
                      onCheckedChange={() => handleCategoryToggle(selectedRole, perms)}
                    />
                    <Label className="font-semibold cursor-pointer">
                      {category}
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        ({selectedCount}/{perms.length})
                      </span>
                    </Label>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 ml-6">
                  {perms.map((permission) => (
                    <div key={permission} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${selectedRole}-${permission}`}
                        checked={currentRolePerms.includes(permission)}
                        onCheckedChange={() =>
                          handlePermissionToggle(selectedRole, permission)
                        }
                      />
                      <Label
                        htmlFor={`${selectedRole}-${permission}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {getPermissionLabel(permission)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => handleReset(selectedRole)}
          >
            Reset to Default
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


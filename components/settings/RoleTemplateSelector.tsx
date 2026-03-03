'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROLE_TEMPLATES, type RoleTemplate } from '@/lib/config/role-templates';
import { PermissionValidator } from '@/lib/managers/PermissionValidator';
import type { Permission } from '@/lib/permissions';
import {
  Shield,
  Check,
  AlertTriangle,
  Copy,
  Users,
  Truck,
  Calculator,
  HardHat,
  UserCog,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================
// Types
// ============================================

interface RoleTemplateSelectorProps {
  onApply: (permissions: Permission[]) => void;
  currentPermissions?: Permission[];
  className?: string;
}

// ============================================
// Icon Map
// ============================================

const TEMPLATE_ICONS: Record<string, React.ElementType> = {
  DISPATCHER: Users,
  ACCOUNTANT: Calculator,
  FLEET_MANAGER: Truck,
  SAFETY_OFFICER: HardHat,
  HR_MANAGER: UserCog,
};

// ============================================
// Component
// ============================================

export default function RoleTemplateSelector({
  onApply,
  currentPermissions = [],
  className,
}: RoleTemplateSelectorProps) {
  const [selectedKey, setSelectedKey] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  const selectedTemplate = ROLE_TEMPLATES.find((t) => t.key === selectedKey);

  const handleApply = () => {
    if (!selectedTemplate) return;
    const fixed = PermissionValidator.autoFixDependencies(selectedTemplate.permissions);
    onApply(fixed);
  };

  const handleMerge = () => {
    if (!selectedTemplate) return;
    const merged = Array.from(
      new Set([...currentPermissions, ...selectedTemplate.permissions])
    ) as Permission[];
    const fixed = PermissionValidator.autoFixDependencies(merged);
    onApply(fixed);
  };

  const previewValidation = selectedTemplate
    ? PermissionValidator.validatePermissionSet(selectedTemplate.permissions)
    : null;

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Role Templates</CardTitle>
        </div>
        <CardDescription>
          Apply a predefined permission template to quickly configure a role
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Template Selector */}
        <div className="flex items-center gap-3">
          <Select value={selectedKey} onValueChange={(val) => { setSelectedKey(val); setShowPreview(true); }}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a template..." />
            </SelectTrigger>
            <SelectContent>
              {ROLE_TEMPLATES.map((template) => {
                const Icon = TEMPLATE_ICONS[template.key] ?? Shield;
                return (
                  <SelectItem key={template.key} value={template.key}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{template.name}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Template Preview */}
        {showPreview && selectedTemplate && (
          <TemplatePreview
            template={selectedTemplate}
            validation={previewValidation}
            currentPermissions={currentPermissions}
          />
        )}

        {/* Action Buttons */}
        {selectedTemplate && (
          <div className="flex items-center gap-2 pt-2">
            <Button onClick={handleApply} size="sm">
              <Check className="h-4 w-4 mr-1" />
              Replace All
            </Button>
            {currentPermissions.length > 0 && (
              <Button onClick={handleMerge} variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-1" />
                Merge with Current
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// Template Preview Sub-Component
// ============================================

function TemplatePreview({
  template,
  validation,
  currentPermissions,
}: {
  template: RoleTemplate;
  validation: ReturnType<typeof PermissionValidator.validatePermissionSet> | null;
  currentPermissions: Permission[];
}) {
  const currentSet = new Set(currentPermissions);
  const newPermissions = template.permissions.filter((p) => !currentSet.has(p));
  const overlapCount = template.permissions.length - newPermissions.length;

  // Group permissions by domain for display
  const grouped = groupPermissions(template.permissions);

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{template.description}</p>
        <Badge variant="secondary" size="sm">
          {template.permissions.length} permissions
        </Badge>
      </div>

      {/* Overlap Info */}
      {currentPermissions.length > 0 && overlapCount > 0 && (
        <p className="text-xs text-muted-foreground">
          {overlapCount} permissions overlap with current set, {newPermissions.length} new
        </p>
      )}

      {/* Validation Warnings */}
      {validation && !validation.valid && (
        <div className="flex items-start gap-2 text-xs text-yellow-600 dark:text-yellow-400">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <span>
            {validation.warnings.length} dependency warning(s) — will be auto-fixed on apply
          </span>
        </div>
      )}

      {/* Permission Groups */}
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(grouped).map(([domain, perms]) => (
          <div key={domain} className="text-xs">
            <span className="font-medium capitalize text-foreground">{domain}</span>
            <span className="text-muted-foreground ml-1">({perms.length})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Helpers
// ============================================

function groupPermissions(permissions: Permission[]): Record<string, Permission[]> {
  const groups: Record<string, Permission[]> = {};
  for (const perm of permissions) {
    const domain = perm.split('.')[0];
    if (!groups[domain]) groups[domain] = [];
    groups[domain].push(perm);
  }
  return groups;
}

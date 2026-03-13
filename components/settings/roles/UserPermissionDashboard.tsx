'use client';

import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Shield, ShieldCheck, ShieldX, Lock, Check } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import PermissionCheckboxGrid from './PermissionCheckboxGrid';
import UserPermissionOverrides from './UserPermissionOverrides';
import type { Permission } from '@/lib/permissions';

interface BreakdownEntry {
  permission: Permission;
  source: 'role' | 'parent_role' | 'grant_override' | 'legacy_role';
  sourceLabel: string;
}

interface PermissionBreakdown {
  effective: BreakdownEntry[];
  revoked: Array<{ permission: Permission; reason: string | null }>;
  roleName: string | null;
}

interface UserPermissionDashboardProps {
  roleId: string;
  roleName: string;
  userId: string;
  userName: string;
  onBack: () => void;
}

export default function UserPermissionDashboard({
  roleName,
  userId,
  userName,
  onBack,
}: UserPermissionDashboardProps) {
  const queryClient = useQueryClient();

  const { data: breakdown, isLoading } = useQuery<PermissionBreakdown>({
    queryKey: ['permission-breakdown', userId],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/api/settings/users/${userId}/permission-breakdown`));
      if (!res.ok) throw new Error('Failed to fetch breakdown');
      const json = await res.json();
      return json.data;
    },
  });

  const effectivePermissions = useMemo(() => {
    if (!breakdown) return [];
    return breakdown.effective.map(e => e.permission);
  }, [breakdown]);

  const inheritedPermissions = useMemo(() => {
    if (!breakdown) return [];
    return breakdown.effective
      .filter(e => e.source === 'parent_role')
      .map(e => e.permission);
  }, [breakdown]);

  const stats = useMemo(() => {
    if (!breakdown) return { total: 0, grants: 0, revokes: 0 };
    const grants = breakdown.effective.filter(e => e.source === 'grant_override').length;
    const revokes = breakdown.revoked.length;
    return { total: breakdown.effective.length, grants, revokes };
  }, [breakdown]);

  const handleOverrideMutationSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['permission-breakdown', userId] });
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading permissions...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to {roleName} users
        </Button>
        <div className="flex-1">
          <h3 className="text-xl font-semibold">{userName}</h3>
          <p className="text-sm text-muted-foreground">
            Effective permissions breakdown
          </p>
        </div>
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <Badge variant="outline" className="gap-1 text-sm px-3 py-1">
              <Shield className="h-3.5 w-3.5" />
              Role: {breakdown?.roleName || roleName}
            </Badge>
            <Badge variant="secondary" className="gap-1 text-sm px-3 py-1">
              <Check className="h-3.5 w-3.5" />
              {stats.total} permissions
            </Badge>
            {stats.grants > 0 && (
              <Badge className="gap-1 text-sm px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                {stats.grants} grant{stats.grants !== 1 ? 's' : ''}
              </Badge>
            )}
            {stats.revokes > 0 && (
              <Badge variant="destructive" className="gap-1 text-sm px-3 py-1">
                <ShieldX className="h-3.5 w-3.5" />
                {stats.revokes} revoke{stats.revokes !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground px-1">
        <span className="flex items-center gap-1"><Check className="h-3 w-3" /> = From role</span>
        <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> = Inherited from parent</span>
        <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-green-600" /> = User grant override</span>
        <span className="flex items-center gap-1"><ShieldX className="h-3 w-3 text-destructive" /> = User revoke override</span>
      </div>

      {/* Permission Grid (read-only) */}
      <div>
        <h4 className="text-base font-semibold mb-3">Effective Permissions</h4>
        <PermissionCheckboxGrid
          permissions={effectivePermissions}
          onPermissionsChange={() => {}}
          inheritedPermissions={inheritedPermissions}
          readOnly
        />
      </div>

      {/* Overrides editor */}
      <UserPermissionOverrides
        userId={userId}
        userName={userName}
        onMutationSuccess={handleOverrideMutationSuccess}
      />
    </div>
  );
}

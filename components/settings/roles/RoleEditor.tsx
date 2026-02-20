'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';
import PermissionCheckboxGrid from './PermissionCheckboxGrid';
import type { Permission } from '@/lib/permissions';

interface RoleDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  parentRoleId: string | null;
  rolePermissions: { permission: string }[];
  roleGroups: { group: { id: string; name: string; items: { permission: string }[] } }[];
}

interface RoleListItem {
  id: string;
  name: string;
  slug: string;
  isSystem: boolean;
}

interface RoleEditorProps {
  roleId: string;
  onBack: () => void;
}

export default function RoleEditor({ roleId, onBack }: RoleEditorProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentRoleId, setParentRoleId] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  const { data: role, isLoading } = useQuery<RoleDetail>({
    queryKey: ['role', roleId],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/api/settings/roles/${roleId}`));
      if (!res.ok) throw new Error('Failed to fetch role');
      const json = await res.json();
      return json.data;
    },
  });

  const { data: allRoles = [] } = useQuery<RoleListItem[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/settings/roles'));
      if (!res.ok) throw new Error('Failed to fetch roles');
      const json = await res.json();
      return json.data || [];
    },
  });

  // Fetch parent role's permissions for inheritance display
  const { data: parentPerms = [] } = useQuery<Permission[]>({
    queryKey: ['role-perms', parentRoleId],
    queryFn: async () => {
      if (!parentRoleId) return [];
      const res = await fetch(apiUrl(`/api/settings/roles/${parentRoleId}`));
      if (!res.ok) return [];
      const json = await res.json();
      return (json.data?.rolePermissions || []).map((p: any) => p.permission);
    },
    enabled: !!parentRoleId,
  });

  useEffect(() => {
    if (role) {
      setName(role.name);
      setDescription(role.description || '');
      setParentRoleId(role.parentRoleId);
      setPermissions(role.rolePermissions.map(p => p.permission as Permission));
    }
  }, [role]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(apiUrl(`/api/settings/roles/${roleId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          permissions,
          parentRoleId,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed to save role');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role', roleId] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role saved successfully');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const hasChanges = useMemo(() => {
    if (!role) return false;
    const origPerms = role.rolePermissions.map(p => p.permission).sort();
    const currPerms = [...permissions].sort();
    return (
      name !== role.name ||
      description !== (role.description || '') ||
      parentRoleId !== role.parentRoleId ||
      JSON.stringify(origPerms) !== JSON.stringify(currPerms)
    );
  }, [role, name, description, parentRoleId, permissions]);

  const handleReset = () => {
    if (role) {
      setName(role.name);
      setDescription(role.description || '');
      setParentRoleId(role.parentRoleId);
      setPermissions(role.rolePermissions.map(p => p.permission as Permission));
    }
  };

  // Filter available parent roles (exclude self and children)
  const availableParents = allRoles.filter(r => r.id !== roleId);

  // Group permissions from assigned permission groups
  const groupPermissions = useMemo(() => {
    if (!role?.roleGroups) return [];
    const perms = new Set<string>();
    role.roleGroups.forEach(rg => rg.group.items.forEach(i => perms.add(i.permission)));
    return Array.from(perms) as Permission[];
  }, [role]);

  const inheritedPermissions = useMemo(() => {
    const set = new Set<Permission>([...parentPerms, ...groupPermissions]);
    return Array.from(set);
  }, [parentPerms, groupPermissions]);

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading role...</div>;
  }

  if (!role) {
    return <div className="text-center py-8 text-muted-foreground">Role not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h3 className="text-xl font-semibold">Edit Role: {role.name}</h3>
          <p className="text-sm text-muted-foreground">
            {role.isSystem ? 'System role — name and slug cannot be changed' : 'Custom role'}
          </p>
        </div>
        {hasChanges && <Badge variant="outline">Unsaved Changes</Badge>}
      </div>

      {/* Role Details */}
      <Card>
        <CardHeader><CardTitle className="text-base">Role Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={role.isSystem}
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={role.slug} disabled />
              <p className="text-xs text-muted-foreground">Slugs cannot be changed after creation.</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe this role..."
            />
          </div>
          <div className="space-y-2">
            <Label>Parent Role (Hierarchy)</Label>
            <Select
              value={parentRoleId || '__none__'}
              onValueChange={v => setParentRoleId(v === '__none__' ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="No parent (standalone)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No parent (standalone)</SelectItem>
                {availableParents.map(r => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Child roles inherit all parent permissions. Inherited permissions are shown as locked.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Permission Groups */}
      {role.roleGroups && role.roleGroups.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Assigned Permission Groups</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {role.roleGroups.map(rg => (
                <Badge key={rg.group.id} variant="secondary">
                  {rg.group.name} ({rg.group.items.length} perms)
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Group permissions are included automatically and shown as inherited below.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Permissions */}
      <div>
        <h4 className="text-base font-semibold mb-3">Permissions</h4>
        <PermissionCheckboxGrid
          permissions={permissions}
          onPermissionsChange={setPermissions}
          inheritedPermissions={inheritedPermissions}
        />
      </div>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Changes
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!hasChanges || saveMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

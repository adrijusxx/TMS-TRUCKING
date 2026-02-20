'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';
import PermissionCheckboxGrid from './PermissionCheckboxGrid';
import type { Permission } from '@/lib/permissions';

interface GroupDetail {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  items: { permission: string }[];
  roleAssignments: { role: { id: string; name: string } }[];
}

interface PermissionGroupEditorProps {
  groupId: string;
  onBack: () => void;
}

export default function PermissionGroupEditor({ groupId, onBack }: PermissionGroupEditorProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState<Permission[]>([]);

  const { data: group, isLoading } = useQuery<GroupDetail>({
    queryKey: ['permission-group', groupId],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/api/settings/permission-groups/${groupId}`));
      if (!res.ok) throw new Error('Failed to fetch group');
      const json = await res.json();
      return json.data;
    },
  });

  useEffect(() => {
    if (group) {
      setName(group.name);
      setDescription(group.description || '');
      setPermissions(group.items.map(i => i.permission as Permission));
    }
  }, [group]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(apiUrl(`/api/settings/permission-groups/${groupId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, permissions }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed to save group');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permission-group', groupId] });
      queryClient.invalidateQueries({ queryKey: ['permission-groups'] });
      toast.success('Permission group saved');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const hasChanges = useMemo(() => {
    if (!group) return false;
    const origPerms = group.items.map(i => i.permission).sort();
    const currPerms = [...permissions].sort();
    return (
      name !== group.name ||
      description !== (group.description || '') ||
      JSON.stringify(origPerms) !== JSON.stringify(currPerms)
    );
  }, [group, name, description, permissions]);

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  if (!group) return <div className="text-center py-8 text-muted-foreground">Group not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h3 className="text-xl font-semibold">Edit Group: {group.name}</h3>
        </div>
        {hasChanges && <Badge variant="outline">Unsaved Changes</Badge>}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Group Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe this group..." />
          </div>
          {group.roleAssignments.length > 0 && (
            <div className="space-y-2">
              <Label>Assigned to Roles</Label>
              <div className="flex flex-wrap gap-2">
                {group.roleAssignments.map(ra => (
                  <Badge key={ra.role.id} variant="secondary">{ra.role.name}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h4 className="text-base font-semibold mb-3">Permissions in this Group</h4>
        <PermissionCheckboxGrid permissions={permissions} onPermissionsChange={setPermissions} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-end">
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

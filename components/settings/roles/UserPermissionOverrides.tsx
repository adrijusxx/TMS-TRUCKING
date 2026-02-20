'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, ShieldCheck, ShieldX, Search } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';
import { getAllPermissions, type Permission } from '@/lib/permissions';
import { getPermissionLabel } from './PermissionCheckboxGrid';

interface Override {
  id: string;
  permission: string;
  type: 'GRANT' | 'REVOKE';
  reason: string | null;
  grantedBy: string | null;
  createdAt: string;
}

interface UserPermissionOverridesProps {
  userId: string;
  userName: string;
}

export default function UserPermissionOverrides({ userId, userName }: UserPermissionOverridesProps) {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [newOverride, setNewOverride] = useState<{ permission: string; type: 'GRANT' | 'REVOKE'; reason: string }>({ permission: '', type: 'GRANT', reason: '' });
  const [search, setSearch] = useState('');

  const { data: overrides = [], isLoading } = useQuery<Override[]>({
    queryKey: ['user-overrides', userId],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/api/settings/users/${userId}/overrides`));
      if (!res.ok) throw new Error('Failed to fetch overrides');
      const json = await res.json();
      return json.data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: { permission: string; type: 'GRANT' | 'REVOKE'; reason?: string }) => {
      const res = await fetch(apiUrl(`/api/settings/users/${userId}/overrides`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed to add override');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-overrides', userId] });
      toast.success('Override added');
      setAddOpen(false);
      setNewOverride({ permission: '', type: 'GRANT', reason: '' });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const removeMutation = useMutation({
    mutationFn: async (permission: string) => {
      const res = await fetch(apiUrl(`/api/settings/users/${userId}/overrides`), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permission }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed to remove override');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-overrides', userId] });
      toast.success('Override removed');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const allPermissions = getAllPermissions();
  const existingPerms = new Set(overrides.map(o => o.permission));
  const filteredPermissions = allPermissions.filter(p =>
    !existingPerms.has(p) &&
    (getPermissionLabel(p).toLowerCase().includes(search.toLowerCase()) || p.includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-base font-semibold">Permission Overrides</h4>
          <p className="text-xs text-muted-foreground">
            Grant or revoke individual permissions for {userName}, overriding their role.
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Override</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Permission Override</DialogTitle>
              <DialogDescription>
                Grant or revoke a specific permission for {userName}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Permission</Label>
                <div className="space-y-2">
                  <Input
                    placeholder="Search permissions..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                  <Select value={newOverride.permission} onValueChange={v => setNewOverride(prev => ({ ...prev, permission: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a permission" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {filteredPermissions.slice(0, 50).map(p => (
                        <SelectItem key={p} value={p}>{getPermissionLabel(p)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newOverride.type} onValueChange={(v: 'GRANT' | 'REVOKE') => setNewOverride(prev => ({ ...prev, type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GRANT">Grant (add permission)</SelectItem>
                    <SelectItem value="REVOKE">Revoke (remove permission)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reason (optional)</Label>
                <Textarea
                  placeholder="Why is this override needed?"
                  value={newOverride.reason}
                  onChange={e => setNewOverride(prev => ({ ...prev, reason: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button
                onClick={() => addMutation.mutate({
                  permission: newOverride.permission,
                  type: newOverride.type,
                  reason: newOverride.reason || undefined,
                })}
                disabled={!newOverride.permission || addMutation.isPending}
              >
                {addMutation.isPending ? 'Adding...' : 'Add Override'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : overrides.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground text-sm">
            No permission overrides for this user. Their effective permissions come from their role.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Permission</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overrides.map(override => (
                  <TableRow key={override.id}>
                    <TableCell>
                      {override.type === 'GRANT' ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <ShieldCheck className="h-3 w-3 mr-1" />Grant
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <ShieldX className="h-3 w-3 mr-1" />Revoke
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{getPermissionLabel(override.permission)}</span>
                      <span className="text-xs text-muted-foreground ml-2">({override.permission})</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{override.reason || '—'}</span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMutation.mutate(override.permission)}
                        disabled={removeMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FolderOpen, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';

interface PermissionGroup {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  items: { permission: string }[];
  roleAssignments: { role: { id: string; name: string } }[];
}

interface PermissionGroupListProps {
  onEditGroup: (groupId: string) => void;
}

export default function PermissionGroupList({ onEditGroup }: PermissionGroupListProps) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PermissionGroup | null>(null);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });

  const { data: groups = [], isLoading } = useQuery<PermissionGroup[]>({
    queryKey: ['permission-groups'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/settings/permission-groups'));
      if (!res.ok) throw new Error('Failed to fetch permission groups');
      const json = await res.json();
      return json.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const res = await fetch(apiUrl('/api/settings/permission-groups'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, permissions: ['loads.view'] }), // Minimum 1 perm required
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed to create group');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['permission-groups'] });
      toast.success('Permission group created');
      setCreateOpen(false);
      setNewGroup({ name: '', description: '' });
      // Open editor immediately
      if (data?.data?.id) onEditGroup(data.data.id);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(apiUrl(`/api/settings/permission-groups/${id}`), { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed to delete group');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permission-groups'] });
      toast.success('Permission group deleted');
      setDeleteTarget(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Permission Groups</h3>
          <p className="text-sm text-muted-foreground">
            Bundle permissions into reusable groups and assign them to roles.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Create Group</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Permission Group</DialogTitle>
              <DialogDescription>Groups bundle permissions for easy role assignment.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  placeholder="e.g. Basic Fleet Access"
                  value={newGroup.name}
                  onChange={e => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="What permissions does this group include?"
                  value={newGroup.description}
                  onChange={e => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button
                onClick={() => createMutation.mutate(newGroup)}
                disabled={!newGroup.name || createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating...' : 'Create & Edit Permissions'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading...</p>
          ) : groups.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No permission groups yet. Create one to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Assigned Roles</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map(group => (
                  <TableRow key={group.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <span className="font-medium">{group.name}</span>
                          {group.description && (
                            <p className="text-xs text-muted-foreground">{group.description}</p>
                          )}
                        </div>
                        {group.isSystem && <Badge variant="outline" className="text-xs">System</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{group.items.length}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {group.roleAssignments.length === 0 ? (
                          <span className="text-xs text-muted-foreground">None</span>
                        ) : (
                          group.roleAssignments.map(ra => (
                            <Badge key={ra.role.id} variant="outline" className="text-xs">
                              {ra.role.name}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => onEditGroup(group.id)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(group)}
                          disabled={group.isSystem}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Permission Group</AlertDialogTitle>
            <AlertDialogDescription>
              Delete &quot;{deleteTarget?.name}&quot;? It will be removed from all assigned roles.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

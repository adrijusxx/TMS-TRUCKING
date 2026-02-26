'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { createPoliciesColumns, type PolicyData } from './PoliciesColumns';
import { apiUrl } from '@/lib/utils';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import CreatePolicyDialog from './CreatePolicyDialog';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';

export default function PoliciesTable() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [createOpen, setCreateOpen] = useState(false);
  const [editPolicy, setEditPolicy] = useState<PolicyData | null>(null);
  const [deletePolicy, setDeletePolicy] = useState<PolicyData | null>(null);

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['safety-policies'] });
  }, [queryClient]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(apiUrl(`/api/safety/policies/${id}`), { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete policy');
    },
    onSuccess: () => {
      toast.success('Policy deleted');
      setDeletePolicy(null);
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const canManage = can('safety.policies.manage');

  const columns = useMemo(
    () => createPoliciesColumns({
      onEdit: canManage ? (p) => setEditPolicy(p) : undefined,
      onDelete: canManage ? (p) => setDeletePolicy(p) : undefined,
      onDistribute: canManage ? (p) => {
        toast.info('Distribution feature - select drivers to send policy');
      } : undefined,
    }),
    [canManage]
  );

  const fetchPolicies = useCallback(
    async (params: { page?: number; pageSize?: number; sorting?: SortingState; filters?: ColumnFiltersState }) => {
      const qp = new URLSearchParams();
      if (params.page) qp.set('page', String(params.page));
      if (params.pageSize) qp.set('limit', String(params.pageSize));
      const res = await fetch(apiUrl(`/api/safety/policies?${qp.toString()}`));
      if (!res.ok) throw new Error('Failed to fetch policies');
      const json = await res.json();
      return { data: json.data as PolicyData[], meta: json.meta };
    },
    []
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        {canManage && (
          <Button onClick={() => { setEditPolicy(null); setCreateOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Policy
          </Button>
        )}
      </div>

      <DataTableWrapper<PolicyData>
        config={{
          entityType: 'safety-policies',
          columns,
          defaultSort: [{ id: 'effectiveDate', desc: true }],
          defaultPageSize: 20,
          enableRowSelection: true,
          enableColumnVisibility: true,
        }}
        fetchData={fetchPolicies}
        emptyMessage="No safety policies found"
      />

      <CreatePolicyDialog
        open={createOpen || !!editPolicy}
        onOpenChange={(open) => {
          if (!open) { setCreateOpen(false); setEditPolicy(null); }
        }}
        onSuccess={refresh}
        editPolicy={editPolicy}
      />

      <AlertDialog open={!!deletePolicy} onOpenChange={(open) => { if (!open) setDeletePolicy(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Policy</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletePolicy?.policyName}&quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletePolicy && deleteMutation.mutate(deletePolicy.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { createClaimsColumns, type ClaimData } from './ClaimsColumns';
import { apiUrl } from '@/lib/utils';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import CreateClaimDialog from './CreateClaimDialog';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';

export default function ClaimsTab() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [createOpen, setCreateOpen] = useState(false);
  const [editClaim, setEditClaim] = useState<ClaimData | null>(null);
  const [deleteClaim, setDeleteClaim] = useState<ClaimData | null>(null);

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['safety-claims'] });
  }, [queryClient]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(apiUrl(`/api/safety/claims/${id}`), { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete claim');
      }
    },
    onSuccess: () => {
      toast.success('Claim deleted');
      setDeleteClaim(null);
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleEdit = useCallback((claim: ClaimData) => setEditClaim(claim), []);
  const handleDelete = useCallback((claim: ClaimData) => setDeleteClaim(claim), []);

  const canEditClaims = can('safety.claims.edit');

  const columns = useMemo(
    () => createClaimsColumns({
      onEdit: canEditClaims ? handleEdit : undefined,
      onDelete: canEditClaims ? handleDelete : undefined,
    }),
    [handleEdit, handleDelete, canEditClaims]
  );

  const fetchClaims = useCallback(
    async (params: { page?: number; pageSize?: number; sorting?: SortingState; filters?: ColumnFiltersState }) => {
      const qp = new URLSearchParams();
      if (params.page) qp.set('page', String(params.page));
      if (params.pageSize) qp.set('limit', String(params.pageSize));
      const res = await fetch(apiUrl(`/api/safety/claims?${qp.toString()}`));
      if (!res.ok) throw new Error('Failed to fetch claims');
      const json = await res.json();
      return { data: json.data as ClaimData[], meta: json.meta };
    },
    []
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        {can('safety.claims.create') && (
          <Button onClick={() => { setEditClaim(null); setCreateOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Claim
          </Button>
        )}
      </div>

      <DataTableWrapper<ClaimData>
        config={{
          entityType: 'safety-claims',
          columns,
          defaultSort: [{ id: 'dateOfLoss', desc: true }],
          defaultPageSize: 20,
          enableRowSelection: true,
          enableColumnVisibility: true,
        }}
        fetchData={fetchClaims}
        emptyMessage="No claims found"
      />

      <CreateClaimDialog
        open={createOpen || !!editClaim}
        onOpenChange={(open) => {
          if (!open) { setCreateOpen(false); setEditClaim(null); }
        }}
        onSuccess={refresh}
        editClaim={editClaim}
      />

      <AlertDialog open={!!deleteClaim} onOpenChange={(open) => { if (!open) setDeleteClaim(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Claim</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete claim {deleteClaim?.claimNumber}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteClaim && deleteMutation.mutate(deleteClaim.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

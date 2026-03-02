'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { createAccidentsColumns, type AccidentData } from './AccidentsColumns';
import { apiUrl } from '@/lib/utils';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import AccidentEditSheet from './AccidentEditSheet';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';

export default function AccidentsTab() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [createOpen, setCreateOpen] = useState(false);
  const [editAccident, setEditAccident] = useState<AccidentData | null>(null);
  const [deleteAccident, setDeleteAccident] = useState<AccidentData | null>(null);

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['safety-accidents'] });
  }, [queryClient]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(apiUrl(`/api/safety/incidents/${id}`), { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete accident');
      }
    },
    onSuccess: () => {
      toast.success('Accident deleted');
      setDeleteAccident(null);
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleEdit = useCallback((accident: AccidentData) => setEditAccident(accident), []);
  const handleDelete = useCallback((accident: AccidentData) => setDeleteAccident(accident), []);

  const canEditAccidents = can('safety.incidents.edit');

  const columns = useMemo(
    () => createAccidentsColumns({
      onEdit: canEditAccidents ? handleEdit : undefined,
      onDelete: canEditAccidents ? handleDelete : undefined,
    }),
    [handleEdit, handleDelete, canEditAccidents]
  );

  const fetchAccidents = useCallback(
    async (params: { page?: number; pageSize?: number; sorting?: SortingState; filters?: ColumnFiltersState }) => {
      const qp = new URLSearchParams();
      if (params.page) qp.set('page', String(params.page));
      if (params.pageSize) qp.set('limit', String(params.pageSize));
      const res = await fetch(apiUrl(`/api/safety/incidents?${qp.toString()}`));
      if (!res.ok) throw new Error('Failed to fetch accidents');
      const json = await res.json();
      return {
        data: json.incidents as AccidentData[],
        meta: {
          totalCount: json.pagination.total,
          page: json.pagination.page,
          totalPages: json.pagination.totalPages,
        },
      };
    },
    []
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        {can('safety.incidents.create') && (
          <Button onClick={() => { setEditAccident(null); setCreateOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Report Accident
          </Button>
        )}
      </div>

      <DataTableWrapper<AccidentData>
        config={{
          entityType: 'safety-accidents',
          columns,
          defaultSort: [{ id: 'date', desc: true }],
          defaultPageSize: 20,
          enableRowSelection: true,
          enableColumnVisibility: true,
        }}
        fetchData={fetchAccidents}
        emptyMessage="No accidents found"
      />

      <AccidentEditSheet
        open={createOpen || !!editAccident}
        onOpenChange={(open) => {
          if (!open) { setCreateOpen(false); setEditAccident(null); }
        }}
        onSuccess={refresh}
        editAccident={editAccident}
      />

      <AlertDialog open={!!deleteAccident} onOpenChange={(open) => { if (!open) setDeleteAccident(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Accident</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete accident {deleteAccident?.incidentNumber}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteAccident && deleteMutation.mutate(deleteAccident.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { createInspectionsColumns, type InspectionData } from './InspectionsColumns';
import InspectionEditSheet from './InspectionEditSheet';
import { apiUrl } from '@/lib/utils';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';

export default function InspectionsTab() {
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editInspection, setEditInspection] = useState<InspectionData | null>(null);
  const [deleteInspection, setDeleteInspection] = useState<InspectionData | null>(null);

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['safety-inspections'] });
  }, [queryClient]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(apiUrl(`/api/safety/inspections/${id}`), { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete inspection');
      }
    },
    onSuccess: () => {
      toast.success('Inspection deleted');
      setDeleteInspection(null);
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const [isLoadingEdit, setIsLoadingEdit] = useState(false);

  const handleEdit = useCallback(async (inspection: InspectionData) => {
    setIsLoadingEdit(true);
    try {
      const res = await fetch(apiUrl(`/api/safety/inspections/${inspection.id}`));
      if (res.ok) {
        const json = await res.json();
        const full = json.data;
        setEditInspection({
          ...inspection,
          driverId: full.driverId || null,
          truckId: full.truckId || null,
          trailerId: full.trailerId || null,
          inspectionLevel: full.inspectionLevel || inspection.inspectionLevel,
          inspectionDate: full.inspectionDate || inspection.inspectionDate,
          inspectionLocation: full.inspectionLocation || null,
          inspectionState: full.inspectionState || null,
          inspectorName: full.inspectorName || null,
          inspectorBadgeNumber: full.inspectorBadgeNumber || null,
          violationsFound: full.violationsFound ?? inspection.violationsFound,
          outOfService: full.outOfService ?? inspection.outOfService,
          oosReason: full.oosReason || null,
          recordable: full.recordable ?? inspection.recordable,
          totalCharge: full.totalCharge ?? 0,
          totalFee: full.totalFee ?? 0,
          note: full.note || null,
        });
      } else {
        toast.error('Failed to load inspection details');
      }
    } catch {
      toast.error('Failed to load inspection details');
    } finally {
      setIsLoadingEdit(false);
    }
  }, []);
  const handleDelete = useCallback((inspection: InspectionData) => setDeleteInspection(inspection), []);

  const canEditInspections = can('safety.inspections.edit');

  const columns = useMemo(
    () => createInspectionsColumns({
      onEdit: canEditInspections ? handleEdit : undefined,
      onDelete: canEditInspections ? handleDelete : undefined,
    }),
    [handleEdit, handleDelete, canEditInspections]
  );

  const fetchInspections = useCallback(
    async (params: { page?: number; pageSize?: number; sorting?: SortingState; filters?: ColumnFiltersState }) => {
      const qp = new URLSearchParams();
      if (params.page) qp.set('page', String(params.page));
      if (params.pageSize) qp.set('limit', String(params.pageSize));

      const res = await fetch(apiUrl(`/api/safety/inspections?${qp.toString()}`));
      if (!res.ok) throw new Error('Failed to fetch inspections');
      const json = await res.json();

      const items = json.data || [];
      const normalized: InspectionData[] = items.map((i: any) => ({
        id: i.id,
        driverName: i.driver || null,
        inspectionReport: i.inspectionNumber || null,
        mcNumber: null,
        inspectionLevel: i.type || 'LEVEL_1',
        inspectionDate: i.date,
        violationType: null,
        recordable: false,
        status: i.result || null,
        truckNumber: i.vehicle || null,
        trailerNumber: null,
        totalCharge: 0,
        totalFee: 0,
        note: null,
        violationsFound: i.result === 'Violations',
        outOfService: i.result === 'Out of Service',
      }));

      return { data: normalized, meta: json.meta };
    },
    []
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        {can('safety.inspections.create') && (
          <Button onClick={() => { setEditInspection(null); setCreateOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Inspection
          </Button>
        )}
      </div>

      <DataTableWrapper<InspectionData>
        config={{
          entityType: 'safety-inspections',
          columns,
          defaultSort: [{ id: 'inspectionDate', desc: true }],
          defaultPageSize: 20,
          enableRowSelection: true,
          enableColumnVisibility: true,
        }}
        fetchData={fetchInspections}
        emptyMessage="No inspections found"
      />

      <InspectionEditSheet
        open={createOpen || !!editInspection}
        onOpenChange={(open) => {
          if (!open) { setCreateOpen(false); setEditInspection(null); }
        }}
        onSuccess={refresh}
        editInspection={editInspection}
      />

      <AlertDialog open={!!deleteInspection} onOpenChange={(open) => { if (!open) setDeleteInspection(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Inspection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this inspection? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteInspection && deleteMutation.mutate(deleteInspection.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

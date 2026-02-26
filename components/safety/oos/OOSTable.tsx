'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { createOOSColumns, type OOSData } from './OOSColumns';
import { apiUrl } from '@/lib/utils';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function OOSTable() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [resolveOrder, setResolveOrder] = useState<OOSData | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['safety-oos'] });
  }, [queryClient]);

  const resolveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const res = await fetch(apiUrl(`/api/safety/out-of-service/${id}/resolve`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolutionNotes: notes }),
      });
      if (!res.ok) throw new Error('Failed to resolve OOS order');
    },
    onSuccess: () => {
      toast.success('OOS order resolved');
      setResolveOrder(null);
      setResolutionNotes('');
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleResolve = useCallback((order: OOSData) => setResolveOrder(order), []);
  const canManage = can('safety.oos.manage');

  const columns = useMemo(
    () => createOOSColumns({ onResolve: canManage ? handleResolve : undefined }),
    [handleResolve, canManage]
  );

  const fetchOOS = useCallback(
    async (params: { page?: number; pageSize?: number; sorting?: SortingState; filters?: ColumnFiltersState }) => {
      const qp = new URLSearchParams();
      if (params.page) qp.set('page', String(params.page));
      if (params.pageSize) qp.set('limit', String(params.pageSize));
      const res = await fetch(apiUrl(`/api/safety/out-of-service?${qp.toString()}`));
      if (!res.ok) throw new Error('Failed to fetch OOS orders');
      const json = await res.json();
      return { data: json.data as OOSData[], meta: json.meta };
    },
    []
  );

  return (
    <div className="space-y-4">
      <DataTableWrapper<OOSData>
        config={{
          entityType: 'safety-oos',
          columns,
          defaultSort: [{ id: 'oosDate', desc: true }],
          defaultPageSize: 20,
          enableRowSelection: true,
          enableColumnVisibility: true,
        }}
        fetchData={fetchOOS}
        emptyMessage="No out-of-service orders found"
      />

      <Dialog open={!!resolveOrder} onOpenChange={(open) => { if (!open) { setResolveOrder(null); setResolutionNotes(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve OOS Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Resolving OOS order for: {resolveOrder?.driver ? `${resolveOrder.driver.user.firstName} ${resolveOrder.driver.user.lastName}` : resolveOrder?.truck?.truckNumber ?? 'Unknown'}
            </p>
            <p className="text-sm"><strong>Reason:</strong> {resolveOrder?.oosReason}</p>
            <div>
              <Label htmlFor="resolutionNotes">Resolution Notes</Label>
              <Textarea
                id="resolutionNotes"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Describe the corrective actions taken..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResolveOrder(null); setResolutionNotes(''); }}>Cancel</Button>
            <Button
              onClick={() => resolveOrder && resolveMutation.mutate({ id: resolveOrder.id, notes: resolutionNotes })}
              disabled={resolveMutation.isPending}
            >
              {resolveMutation.isPending ? 'Resolving...' : 'Resolve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

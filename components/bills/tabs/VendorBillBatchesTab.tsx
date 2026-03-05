'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { SortableHeader } from '@/components/ui/sortable-header';
import { useReactTable, getCoreRowModel, getSortedRowModel, type SortingState, type ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Trash2, Download, MoreHorizontal, Loader2 } from 'lucide-react';
import { format, subWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { apiUrl, formatCurrency } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface VendorBillBatch {
  id: string;
  batchNumber: string;
  postStatus: 'UNPOSTED' | 'POSTED' | 'PAID';
  mcNumber: string | null;
  periodStart: string;
  periodEnd: string;
  totalAmount: number;
  billCount: number;
  vendorCount: number;
  truckCount: number;
  tripCount: number;
  notes: string | null;
  createdBy: { firstName: string; lastName: string };
  createdAt: string;
  _count: { bills: number };
}

const statusBadge = (status: string) => {
  switch (status) {
    case 'POSTED': return <Badge className="bg-green-600">{status}</Badge>;
    case 'PAID': return <Badge className="bg-blue-600">{status}</Badge>;
    default: return <Badge variant="secondary">{status}</Badge>;
  }
};

export default function VendorBillBatchesTab() {
  const { can } = usePermissions();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [createPeriodStart, setCreatePeriodStart] = React.useState(() => {
    const lastWeek = subWeeks(new Date(), 1);
    return format(startOfWeek(lastWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  });
  const [createPeriodEnd, setCreatePeriodEnd] = React.useState(() => {
    const lastWeek = subWeeks(new Date(), 1);
    return format(endOfWeek(lastWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  });

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-bill-batches'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/vendor-bills/batches'));
      if (!res.ok) throw new Error('Failed to fetch batches');
      return res.json();
    },
  });

  const batches: VendorBillBatch[] = data?.data || [];

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const res = await fetch(apiUrl('/api/vendor-bills/batches'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodStart: new Date(createPeriodStart).toISOString(),
          periodEnd: new Date(createPeriodEnd).toISOString(),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create batch');
      }
      toast.success('Bill batch created');
      queryClient.invalidateQueries({ queryKey: ['vendor-bill-batches'] });
      setIsCreateOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(apiUrl(`/api/vendor-bills/batches/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postStatus: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      toast.success(`Batch ${newStatus.toLowerCase()}`);
      queryClient.invalidateQueries({ queryKey: ['vendor-bill-batches'] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(apiUrl(`/api/vendor-bills/batches/${id}`), {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete');
      }
      toast.success('Batch deleted');
      queryClient.invalidateQueries({ queryKey: ['vendor-bill-batches'] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const totalAmount = batches.reduce((s, b) => s + b.totalAmount, 0);

  const [sorting, setSorting] = React.useState<SortingState>([]);

  const enrichedBatches = React.useMemo(() => batches.map(b => ({
    ...b,
    createdByName: `${b.createdBy.firstName} ${b.createdBy.lastName}`,
  })), [batches]);

  const columns = React.useMemo<ColumnDef<any>[]>(() => [
    { id: 'select', enableSorting: false },
    { accessorKey: 'batchNumber', header: 'Batch ID' },
    { accessorKey: 'vendorCount', header: 'Vendors' },
    { accessorKey: 'mcNumber', header: 'MC Number' },
    { accessorKey: 'postStatus', header: 'Post Status' },
    { accessorKey: 'createdByName', header: 'Created By' },
    { accessorKey: 'createdAt', header: 'Created Date' },
    { accessorKey: 'periodStart', header: 'Period' },
    { accessorKey: 'billCount', header: 'Bills Count' },
    { accessorKey: 'totalAmount', header: 'Total Bill Due' },
    { accessorKey: 'truckCount', header: 'Trucks' },
    { accessorKey: 'tripCount', header: 'Trips' },
    { accessorKey: 'notes', header: 'Notes' },
    { id: 'actions', enableSorting: false },
  ], []);

  const table = useReactTable({
    data: enrichedBatches,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button variant="destructive" size="sm" onClick={() => {
              selectedIds.forEach((id) => handleDelete(id));
              setSelectedIds(new Set());
            }}>
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Create new batch</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Bill Batch</DialogTitle>
                <DialogDescription>Select a period to batch unbatched vendor bills.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Period Start</Label>
                  <Input type="date" value={createPeriodStart} onChange={(e) => setCreatePeriodStart(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Period End</Label>
                  <Input type="date" value={createPeriodEnd} onChange={(e) => setCreatePeriodEnd(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={isCreating}>
                  {isCreating && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  Create Batch
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> Export</Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"><Checkbox checked={selectedIds.size === batches.length && batches.length > 0} onCheckedChange={(c) => setSelectedIds(c ? new Set(batches.map(b => b.id)) : new Set())} /></TableHead>
              <SortableHeader column={table.getColumn('batchNumber')!}>Batch ID</SortableHeader>
              <SortableHeader column={table.getColumn('vendorCount')!}>Vendors</SortableHeader>
              <SortableHeader column={table.getColumn('mcNumber')!}>MC Number</SortableHeader>
              <SortableHeader column={table.getColumn('postStatus')!}>Post Status</SortableHeader>
              <SortableHeader column={table.getColumn('createdByName')!}>Created By</SortableHeader>
              <SortableHeader column={table.getColumn('createdAt')!}>Created Date</SortableHeader>
              <SortableHeader column={table.getColumn('periodStart')!}>Period</SortableHeader>
              <SortableHeader column={table.getColumn('billCount')!} className="text-right">Bills Count</SortableHeader>
              <SortableHeader column={table.getColumn('totalAmount')!} className="text-right">Total Bill Due</SortableHeader>
              <SortableHeader column={table.getColumn('truckCount')!} className="text-right">Trucks</SortableHeader>
              <SortableHeader column={table.getColumn('tripCount')!} className="text-right">Trips</SortableHeader>
              <SortableHeader column={table.getColumn('notes')!}>Notes</SortableHeader>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => {
              const batch = row.original;
              return (
              <TableRow key={batch.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/dashboard/bills/batches/${batch.batchNumber || batch.id}`)}>
                <TableCell onClick={(e) => e.stopPropagation()}><Checkbox checked={selectedIds.has(batch.id)} onCheckedChange={() => toggleSelect(batch.id)} /></TableCell>
                <TableCell className="font-medium text-primary">{batch.batchNumber}</TableCell>
                <TableCell>{batch.vendorCount}</TableCell>
                <TableCell>{batch.mcNumber || '-'}</TableCell>
                <TableCell>{statusBadge(batch.postStatus)}</TableCell>
                <TableCell>{batch.createdBy.firstName} {batch.createdBy.lastName}</TableCell>
                <TableCell>{format(new Date(batch.createdAt), 'MMM d, yyyy')}</TableCell>
                <TableCell>{format(new Date(batch.periodStart), 'MMM d, yyyy')}-{format(new Date(batch.periodEnd), 'MMM d, yyyy')}</TableCell>
                <TableCell className="text-right">{batch.billCount}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(batch.totalAmount)}</TableCell>
                <TableCell className="text-right">{batch.truckCount}</TableCell>
                <TableCell className="text-right">{batch.tripCount}</TableCell>
                <TableCell className="max-w-[150px] truncate">{batch.notes || '-'}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {batch.postStatus === 'UNPOSTED' && (
                        <DropdownMenuItem onClick={() => handleStatusChange(batch.id, 'POSTED')}>Post Batch</DropdownMenuItem>
                      )}
                      {batch.postStatus === 'POSTED' && (
                        <DropdownMenuItem onClick={() => handleStatusChange(batch.id, 'PAID')}>Mark as Paid</DropdownMenuItem>
                      )}
                      {batch.postStatus !== 'UNPOSTED' && can('batches.reopen') && (
                        <DropdownMenuItem onClick={() => handleStatusChange(batch.id, 'UNPOSTED')}>Reopen</DropdownMenuItem>
                      )}
                      {(batch.postStatus === 'UNPOSTED' || can('batches.delete_posted')) && (
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(batch.id)}>Delete</DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              );
            })}
            {batches.length === 0 && (
              <TableRow>
                <TableCell colSpan={14} className="text-center py-8 text-muted-foreground">No bill batches found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer totals */}
      {batches.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Batch count: {batches.length} &middot; Total: {formatCurrency(totalAmount)}
        </div>
      )}
    </div>
  );
}

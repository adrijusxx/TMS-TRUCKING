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
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Download, Filter, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { apiUrl, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface VendorBill {
  id: string;
  billNumber: string;
  status: string;
  amount: number;
  balance: number;
  billDate: string;
  dueDate: string;
  vendorInvoiceNumber: string | null;
  description: string | null;
  mcNumber: string | null;
  vendor: { id: string; name: string; vendorNumber: string };
  load: { id: string; loadNumber: string } | null;
  truck: { id: string; truckNumber: string } | null;
  batch: { id: string; batchNumber: string } | null;
  createdBy: { firstName: string; lastName: string } | null;
}

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    DRAFT: 'bg-gray-500', POSTED: 'bg-blue-600', PAID: 'bg-green-600',
    PARTIAL: 'bg-amber-500', CANCELLED: 'bg-red-600',
  };
  return <Badge className={map[status] || 'bg-gray-500'}>{status}</Badge>;
};

export default function VendorBillsTab() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [page, setPage] = React.useState(1);

  // Form state
  const [formVendorId, setFormVendorId] = React.useState('');
  const [formAmount, setFormAmount] = React.useState('');
  const [formBillDate, setFormBillDate] = React.useState(format(new Date(), 'yyyy-MM-dd'));
  const [formDueDate, setFormDueDate] = React.useState('');
  const [formDescription, setFormDescription] = React.useState('');
  const [formVendorInvoice, setFormVendorInvoice] = React.useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-bills', statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(apiUrl(`/api/vendor-bills?${params}`));
      if (!res.ok) throw new Error('Failed to fetch bills');
      return res.json();
    },
  });

  const { data: vendorsData } = useQuery({
    queryKey: ['vendors-list'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/vendors?limit=200'));
      if (!res.ok) throw new Error('Failed to fetch vendors');
      return res.json();
    },
  });

  const bills: VendorBill[] = data?.data || [];
  const pagination = data?.pagination;
  const vendors = vendorsData?.data?.vendors || [];

  const [sorting, setSorting] = React.useState<SortingState>([]);

  const enrichedBills = React.useMemo(() => bills.map(b => ({
    ...b,
    vendorName: b.vendor.name,
    loadNumber: b.load?.loadNumber || '',
    truckNumber: b.truck?.truckNumber || '',
    batchNumber: b.batch?.batchNumber || '',
  })), [bills]);

  const columns = React.useMemo<ColumnDef<any>[]>(() => [
    { accessorKey: 'billNumber', header: 'Bill #' },
    { accessorKey: 'vendorName', header: 'Vendor' },
    { accessorKey: 'vendorInvoiceNumber', header: 'Vendor Invoice' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'billDate', header: 'Bill Date' },
    { accessorKey: 'dueDate', header: 'Due Date' },
    { accessorKey: 'amount', header: 'Amount' },
    { accessorKey: 'balance', header: 'Balance' },
    { accessorKey: 'loadNumber', header: 'Load' },
    { accessorKey: 'truckNumber', header: 'Truck' },
    { accessorKey: 'batchNumber', header: 'Batch' },
    { accessorKey: 'description', header: 'Description' },
  ], []);

  const table = useReactTable({
    data: enrichedBills,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleCreate = async () => {
    if (!formVendorId || !formAmount || !formDueDate) {
      toast.error('Vendor, amount, and due date are required');
      return;
    }
    setIsCreating(true);
    try {
      const res = await fetch(apiUrl('/api/vendor-bills'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: formVendorId,
          amount: parseFloat(formAmount),
          billDate: new Date(formBillDate).toISOString(),
          dueDate: new Date(formDueDate).toISOString(),
          description: formDescription || undefined,
          vendorInvoiceNumber: formVendorInvoice || undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      toast.success('Bill created');
      queryClient.invalidateQueries({ queryKey: ['vendor-bills'] });
      setIsCreateOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setFormVendorId('');
    setFormAmount('');
    setFormDueDate('');
    setFormDescription('');
    setFormVendorInvoice('');
  };

  if (isLoading) {
    return <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="POSTED">Posted</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="PARTIAL">Partial</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Bill</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Vendor Bill</DialogTitle>
                <DialogDescription>Enter vendor bill details.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Vendor</Label>
                  <Select value={formVendorId} onValueChange={setFormVendorId}>
                    <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                    <SelectContent>
                      {vendors.map((v: any) => (
                        <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Amount</Label>
                    <Input type="number" step="0.01" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Vendor Invoice #</Label>
                    <Input value={formVendorInvoice} onChange={(e) => setFormVendorInvoice(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Bill Date</Label>
                    <Input type="date" value={formBillDate} onChange={(e) => setFormBillDate(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Due Date</Label>
                    <Input type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Description</Label>
                  <Input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={isCreating}>
                  {isCreating && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Create Bill
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
              <TableHead><SortableHeader column={table.getColumn('billNumber')!}>Bill #</SortableHeader></TableHead>
              <TableHead><SortableHeader column={table.getColumn('vendorName')!}>Vendor</SortableHeader></TableHead>
              <TableHead><SortableHeader column={table.getColumn('vendorInvoiceNumber')!}>Vendor Invoice</SortableHeader></TableHead>
              <TableHead><SortableHeader column={table.getColumn('status')!}>Status</SortableHeader></TableHead>
              <TableHead><SortableHeader column={table.getColumn('billDate')!}>Bill Date</SortableHeader></TableHead>
              <TableHead><SortableHeader column={table.getColumn('dueDate')!}>Due Date</SortableHeader></TableHead>
              <TableHead className="text-right"><SortableHeader column={table.getColumn('amount')!}>Amount</SortableHeader></TableHead>
              <TableHead className="text-right"><SortableHeader column={table.getColumn('balance')!}>Balance</SortableHeader></TableHead>
              <TableHead><SortableHeader column={table.getColumn('loadNumber')!}>Load</SortableHeader></TableHead>
              <TableHead><SortableHeader column={table.getColumn('truckNumber')!}>Truck</SortableHeader></TableHead>
              <TableHead><SortableHeader column={table.getColumn('batchNumber')!}>Batch</SortableHeader></TableHead>
              <TableHead><SortableHeader column={table.getColumn('description')!}>Description</SortableHeader></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => {
              const bill = row.original;
              return (
              <TableRow key={bill.id}>
                <TableCell className="font-medium text-primary">{bill.billNumber}</TableCell>
                <TableCell>{bill.vendor.name}</TableCell>
                <TableCell>{bill.vendorInvoiceNumber || '-'}</TableCell>
                <TableCell>{statusBadge(bill.status)}</TableCell>
                <TableCell>{format(new Date(bill.billDate), 'MMM d, yyyy')}</TableCell>
                <TableCell>{format(new Date(bill.dueDate), 'MMM d, yyyy')}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(bill.amount)}</TableCell>
                <TableCell className="text-right">{formatCurrency(bill.balance)}</TableCell>
                <TableCell>{bill.load?.loadNumber || '-'}</TableCell>
                <TableCell>{bill.truck?.truckNumber || '-'}</TableCell>
                <TableCell>{bill.batch?.batchNumber || '-'}</TableCell>
                <TableCell className="max-w-[150px] truncate">{bill.description || '-'}</TableCell>
              </TableRow>
              );
            })}
            {bills.length === 0 && (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">No vendor bills found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">{page} of {pagination.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}

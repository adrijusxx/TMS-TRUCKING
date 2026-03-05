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
import { Plus, Loader2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { apiUrl, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

export default function VendorOneTimeChargesTab() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);

  // Form
  const [vendorId, setVendorId] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [billDate, setBillDate] = React.useState(format(new Date(), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = React.useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'));

  const { data: vendorsData } = useQuery({
    queryKey: ['vendors-list'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/vendors?limit=200'));
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  // Show unbatched bills (one-time charges = bills not in any batch)
  const { data, isLoading } = useQuery({
    queryKey: ['vendor-bills-unbatched'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/vendor-bills?limit=50'));
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const vendors = vendorsData?.data?.vendors || [];
  const bills = (data?.data || []).filter((b: any) => !b.batch);

  const [sorting, setSorting] = React.useState<SortingState>([]);

  const enrichedBills = React.useMemo(() => bills.map((b: any) => ({
    ...b,
    vendorName: b.vendor?.name || '',
  })), [bills]);

  const columns = React.useMemo<ColumnDef<any>[]>(() => [
    { accessorKey: 'billNumber', header: 'Bill #' },
    { accessorKey: 'vendorName', header: 'Vendor' },
    { accessorKey: 'description', header: 'Description' },
    { accessorKey: 'billDate', header: 'Date' },
    { accessorKey: 'dueDate', header: 'Due Date' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'amount', header: 'Amount' },
    { accessorKey: 'balance', header: 'Balance' },
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
    if (!vendorId || !amount) {
      toast.error('Vendor and amount are required');
      return;
    }
    setIsCreating(true);
    try {
      const res = await fetch(apiUrl('/api/vendor-bills'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId,
          amount: parseFloat(amount),
          billDate: new Date(billDate).toISOString(),
          dueDate: new Date(dueDate).toISOString(),
          description: description || 'One-time charge',
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      toast.success('One-time charge created');
      queryClient.invalidateQueries({ queryKey: ['vendor-bills-unbatched'] });
      setIsCreateOpen(false);
      setVendorId('');
      setAmount('');
      setDescription('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Ad-hoc vendor charges not assigned to any batch
        </p>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Charge</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add One-Time Charge</DialogTitle>
              <DialogDescription>Create an ad-hoc vendor charge.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Vendor</Label>
                <Select value={vendorId} onValueChange={setVendorId}>
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
                  <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Due Date</Label>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="One-time charge description" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Add Charge
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader column={table.getColumn('billNumber')!}>Bill #</SortableHeader>
              <SortableHeader column={table.getColumn('vendorName')!}>Vendor</SortableHeader>
              <SortableHeader column={table.getColumn('description')!}>Description</SortableHeader>
              <SortableHeader column={table.getColumn('billDate')!}>Date</SortableHeader>
              <SortableHeader column={table.getColumn('dueDate')!}>Due Date</SortableHeader>
              <SortableHeader column={table.getColumn('status')!}>Status</SortableHeader>
              <SortableHeader column={table.getColumn('amount')!} className="text-right">Amount</SortableHeader>
              <SortableHeader column={table.getColumn('balance')!} className="text-right">Balance</SortableHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => {
              const bill = row.original;
              return (
                <TableRow key={bill.id}>
                  <TableCell className="font-medium">{bill.billNumber}</TableCell>
                  <TableCell>{bill.vendor?.name}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{bill.description || '-'}</TableCell>
                  <TableCell>{format(new Date(bill.billDate), 'MMM d, yyyy')}</TableCell>
                  <TableCell>{format(new Date(bill.dueDate), 'MMM d, yyyy')}</TableCell>
                  <TableCell><Badge variant="secondary">{bill.status}</Badge></TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(bill.amount)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(bill.balance)}</TableCell>
                </TableRow>
              );
            })}
            {bills.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No unbatched charges</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

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
import { Plus, Loader2, Pause, Play } from 'lucide-react';
import { format } from 'date-fns';
import { apiUrl, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface ScheduledPayment {
  id: string;
  description: string;
  amount: number;
  frequency: string;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  nextPaymentDate: string | null;
  isActive: boolean;
  startDate: string;
  endDate: string | null;
  vendor: { id: string; name: string; vendorNumber: string };
  createdBy: { firstName: string; lastName: string } | null;
}

const frequencyLabel: Record<string, string> = {
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Bi-Weekly',
  MONTHLY: 'Monthly',
  PER_SETTLEMENT: 'Per Settlement',
  ONE_TIME: 'One Time',
};

export default function VendorScheduledPaymentsTab() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);

  // Form
  const [vendorId, setVendorId] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [frequency, setFrequency] = React.useState('MONTHLY');
  const [dayOfMonth, setDayOfMonth] = React.useState('1');
  const [startDate, setStartDate] = React.useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: vendorsData } = useQuery({
    queryKey: ['vendors-list'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/vendors?limit=200'));
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-scheduled-payments'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/vendor-bills/scheduled'));
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const vendors = vendorsData?.data?.vendors || [];
  const scheduled: ScheduledPayment[] = data?.data || [];

  const [sorting, setSorting] = React.useState<SortingState>([]);

  const enrichedScheduled = React.useMemo(() => scheduled.map(sp => ({
    ...sp,
    vendorName: sp.vendor.name,
  })), [scheduled]);

  const columns = React.useMemo<ColumnDef<any>[]>(() => [
    { accessorKey: 'vendorName', header: 'Vendor' },
    { accessorKey: 'description', header: 'Description' },
    { accessorKey: 'amount', header: 'Amount' },
    { accessorKey: 'frequency', header: 'Frequency' },
    { accessorKey: 'nextPaymentDate', header: 'Next Payment' },
    { accessorKey: 'startDate', header: 'Start Date' },
    { accessorKey: 'endDate', header: 'End Date' },
    { id: 'status', accessorFn: (row: any) => row.isActive ? 'Active' : 'Paused', header: 'Status' },
    { id: 'actions', enableSorting: false },
  ], []);

  const table = useReactTable({
    data: enrichedScheduled,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleCreate = async () => {
    if (!vendorId || !amount || !description) {
      toast.error('Vendor, description, and amount are required');
      return;
    }
    setIsCreating(true);
    try {
      const res = await fetch(apiUrl('/api/vendor-bills/scheduled'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId,
          description,
          amount: parseFloat(amount),
          frequency,
          dayOfMonth: frequency === 'MONTHLY' ? parseInt(dayOfMonth) : undefined,
          startDate: new Date(startDate).toISOString(),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      toast.success('Scheduled payment created');
      queryClient.invalidateQueries({ queryKey: ['vendor-scheduled-payments'] });
      setIsCreateOpen(false);
      setVendorId('');
      setDescription('');
      setAmount('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(apiUrl(`/api/vendor-bills/scheduled/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(isActive ? 'Payment paused' : 'Payment activated');
      queryClient.invalidateQueries({ queryKey: ['vendor-scheduled-payments'] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(apiUrl(`/api/vendor-bills/scheduled/${id}`), { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      toast.success('Scheduled payment deleted');
      queryClient.invalidateQueries({ queryKey: ['vendor-scheduled-payments'] });
    } catch (err: any) {
      toast.error(err.message);
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
          Recurring vendor payment schedules
        </p>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Schedule</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Scheduled Payment</DialogTitle>
              <DialogDescription>Set up a recurring vendor payment.</DialogDescription>
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
              <div className="grid gap-2">
                <Label>Description</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., Monthly insurance payment" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Amount</Label>
                  <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Frequency</Label>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="BIWEEKLY">Bi-Weekly</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                {frequency === 'MONTHLY' && (
                  <div className="grid gap-2">
                    <Label>Day of Month</Label>
                    <Input type="number" min="1" max="28" value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} />
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Create Schedule
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
              <SortableHeader column={table.getColumn('vendorName')!}>Vendor</SortableHeader>
              <SortableHeader column={table.getColumn('description')!}>Description</SortableHeader>
              <SortableHeader column={table.getColumn('amount')!} className="text-right">Amount</SortableHeader>
              <SortableHeader column={table.getColumn('frequency')!}>Frequency</SortableHeader>
              <SortableHeader column={table.getColumn('nextPaymentDate')!}>Next Payment</SortableHeader>
              <SortableHeader column={table.getColumn('startDate')!}>Start Date</SortableHeader>
              <SortableHeader column={table.getColumn('endDate')!}>End Date</SortableHeader>
              <SortableHeader column={table.getColumn('status')!}>Status</SortableHeader>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => {
              const sp = row.original;
              return (
                <TableRow key={sp.id} className={!sp.isActive ? 'opacity-50' : ''}>
                  <TableCell>{sp.vendor.name}</TableCell>
                  <TableCell>{sp.description}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(sp.amount)}</TableCell>
                  <TableCell>{frequencyLabel[sp.frequency] || sp.frequency}</TableCell>
                  <TableCell>{sp.nextPaymentDate ? format(new Date(sp.nextPaymentDate), 'MMM d, yyyy') : '-'}</TableCell>
                  <TableCell>{format(new Date(sp.startDate), 'MMM d, yyyy')}</TableCell>
                  <TableCell>{sp.endDate ? format(new Date(sp.endDate), 'MMM d, yyyy') : 'Ongoing'}</TableCell>
                  <TableCell>
                    <Badge variant={sp.isActive ? 'default' : 'secondary'}>
                      {sp.isActive ? 'Active' : 'Paused'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleActive(sp.id, sp.isActive)}>
                        {sp.isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {scheduled.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No scheduled payments</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

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
import { Plus, Loader2, Trash2 } from 'lucide-react';
import { apiUrl, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

const DEDUCTION_TYPES = [
  'FUEL_ADVANCE', 'CASH_ADVANCE', 'INSURANCE', 'OCCUPATIONAL_ACCIDENT',
  'TRUCK_PAYMENT', 'TRUCK_LEASE', 'ESCROW', 'EQUIPMENT_RENTAL',
  'MAINTENANCE', 'TOLLS', 'PERMITS', 'FUEL_CARD', 'FUEL_CARD_FEE',
  'TRAILER_RENTAL', 'OTHER',
] as const;

const ADDITION_TYPES = ['BONUS', 'OVERTIME', 'INCENTIVE', 'REIMBURSEMENT'] as const;

const typeLabel = (t: string) => t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function DriverOneTimeChargesTab() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // Form state
  const [isAddition, setIsAddition] = React.useState(false);
  const [deductionType, setDeductionType] = React.useState('OTHER');
  const [amount, setAmount] = React.useState('');
  const [name, setName] = React.useState('');

  const { data: driversData } = useQuery({
    queryKey: ['drivers-list-simple'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/drivers?limit=200'));
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['deduction-rules-one-time'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/deduction-rules'));
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const drivers = driversData?.data || [];
  const allRules = data?.data || [];
  const oneTimeRules = allRules.filter((r: any) =>
    r.frequency === 'ONE_TIME' || r.deductionFrequency === 'ONE_TIME'
  );

  const getDriverName = (rule: any) => {
    const driver = drivers.find((d: any) => d.id === rule.driverId);
    if (driver) return `${driver.user?.firstName || ''} ${driver.user?.lastName || ''}`.trim();
    return rule.driverId ? 'Unknown' : 'MC-Wide';
  };

  const enrichedRules = React.useMemo(() => oneTimeRules.map((rule: any) => ({
    ...rule,
    driverName: getDriverName(rule),
  })), [oneTimeRules, drivers]);

  const columns = React.useMemo<ColumnDef<any>[]>(() => [
    { accessorKey: 'driverName', header: 'Driver' },
    { accessorKey: 'name', header: 'Name' },
    { id: 'type', accessorFn: (row: any) => row.isAddition ? 'Addition' : 'Deduction', header: 'Type' },
    { accessorKey: 'deductionType', header: 'Category' },
    { accessorKey: 'amount', header: 'Amount' },
    { id: 'status', accessorFn: (row: any) => row.isActive ? 'Active' : 'Inactive', header: 'Status' },
    { id: 'actions', enableSorting: false },
  ], []);

  const table = useReactTable({
    data: enrichedRules,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleCreate = async () => {
    if (!amount || !name) {
      toast.error('Name and amount are required');
      return;
    }
    setIsCreating(true);
    try {
      const res = await fetch(apiUrl('/api/deduction-rules'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          deductionType,
          isAddition,
          calculationType: 'FIXED',
          amount: parseFloat(amount),
          frequency: 'ONE_TIME',
          isActive: true,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed');
      }
      toast.success('One-time charge created');
      queryClient.invalidateQueries({ queryKey: ['deduction-rules-one-time'] });
      setIsCreateOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(apiUrl(`/api/deduction-rules/${id}`), { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      toast.success('Charge deleted');
      queryClient.invalidateQueries({ queryKey: ['deduction-rules-one-time'] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const resetForm = () => {
    setIsAddition(false);
    setDeductionType('OTHER');
    setAmount('');
    setName('');
  };

  const types = isAddition ? ADDITION_TYPES : DEDUCTION_TYPES;

  if (isLoading) {
    return <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          MC-wide one-time charges and bonuses applied once to all drivers during settlement
        </p>
        <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Charge</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add One-Time Charge</DialogTitle>
              <DialogDescription>Create a one-time deduction or addition for a driver.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Sign-on bonus" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Type</Label>
                  <Select value={isAddition ? 'addition' : 'deduction'} onValueChange={(v) => {
                    setIsAddition(v === 'addition');
                    setDeductionType(v === 'addition' ? 'BONUS' : 'OTHER');
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deduction">Deduction</SelectItem>
                      <SelectItem value="addition">Addition</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select value={deductionType} onValueChange={setDeductionType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {types.map((t) => (
                        <SelectItem key={t} value={t}>{typeLabel(t)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Amount</Label>
                <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
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

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <SortableHeader column={table.getColumn('driverName')!}>Driver</SortableHeader>
              <SortableHeader column={table.getColumn('name')!}>Name</SortableHeader>
              <SortableHeader column={table.getColumn('type')!}>Type</SortableHeader>
              <SortableHeader column={table.getColumn('deductionType')!}>Category</SortableHeader>
              <SortableHeader column={table.getColumn('amount')!} className="text-right">Amount</SortableHeader>
              <SortableHeader column={table.getColumn('status')!}>Status</SortableHeader>
              <TableHead className="w-16">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => {
              const rule = row.original;
              return (
                <TableRow key={rule.id}>
                  <TableCell>{rule.driverName}</TableCell>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell>
                    <Badge variant={rule.isAddition ? 'default' : 'secondary'}>
                      {rule.isAddition ? 'Addition' : 'Deduction'}
                    </Badge>
                  </TableCell>
                  <TableCell>{typeLabel(rule.deductionType)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(rule.amount || 0)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={rule.isActive ? 'default' : 'outline'}>
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(rule.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {oneTimeRules.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No one-time charges
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

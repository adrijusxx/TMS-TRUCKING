'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { apiUrl, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import {
  ArrowLeft, Loader2, Trash2, Download, ChevronDown, Send, DollarSign,
} from 'lucide-react';

interface VendorBillBatchDetailProps {
  batchId: string;
}

interface BillItem {
  id: string;
  billNumber: string;
  vendorInvoiceNumber: string | null;
  status: string;
  amount: number;
  amountPaid: number;
  balance: number;
  billDate: string;
  dueDate: string | null;
  description: string | null;
  notes: string | null;
  vendor: { id: string; name: string; vendorNumber: string | null };
  load: { id: string; loadNumber: string } | null;
  truck: { id: string; truckNumber: string } | null;
  _count: { payments: number };
}

interface BatchData {
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
  postedAt: string | null;
  paidAt: string | null;
  createdAt: string;
  bills: BillItem[];
}

const BILL_STATUS_FILTERS = ['All', 'DRAFT', 'POSTED', 'PAID', 'PARTIAL', 'CANCELLED'] as const;

function batchStatusBadge(status: string) {
  switch (status) {
    case 'POSTED': return <Badge className="bg-green-600">{status}</Badge>;
    case 'PAID': return <Badge className="bg-blue-600">{status}</Badge>;
    default: return <Badge className="bg-orange-500">{status}</Badge>;
  }
}

function billStatusBadge(status: string) {
  switch (status) {
    case 'POSTED': return <Badge variant="outline" className="border-green-500 text-green-700">{status}</Badge>;
    case 'PAID': return <Badge variant="outline" className="border-blue-500 text-blue-700">{status}</Badge>;
    case 'PARTIAL': return <Badge variant="outline" className="border-yellow-500 text-yellow-700">{status}</Badge>;
    case 'CANCELLED': return <Badge variant="outline" className="border-red-500 text-red-700">{status}</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
}

export default function VendorBillBatchDetail({ batchId }: VendorBillBatchDetailProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = React.useState<string>('All');
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [editNotes, setEditNotes] = React.useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['vendor-bill-batch', batchId],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/api/vendor-bills/batches/${batchId}`));
      if (!res.ok) throw new Error('Failed to fetch batch');
      const json = await res.json();
      return json.data as BatchData;
    },
  });

  const patchMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch(apiUrl(`/api/vendor-bills/batches/${batchId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Update failed');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-bill-batch', batchId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-bill-batches'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(apiUrl(`/api/vendor-bills/batches/${batchId}`), { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Delete failed');
      }
    },
    onSuccess: () => {
      toast.success('Batch deleted');
      queryClient.invalidateQueries({ queryKey: ['vendor-bill-batches'] });
      router.push('/dashboard/bills');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handlePost = () => {
    patchMutation.mutate({ postStatus: 'POSTED' }, {
      onSuccess: () => toast.success('Batch posted'),
      onError: (err: Error) => toast.error(err.message),
    });
  };

  const handleMarkPaid = () => {
    patchMutation.mutate({ postStatus: 'PAID' }, {
      onSuccess: () => toast.success('Batch marked as paid'),
      onError: (err: Error) => toast.error(err.message),
    });
  };

  const handleSaveNotes = () => {
    patchMutation.mutate({ notes: editNotes }, {
      onSuccess: () => {
        toast.success('Notes saved');
        setEditNotes(null);
      },
      onError: (err: Error) => toast.error(err.message),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>Failed to load batch details.</p>
        <Link href="/dashboard/bills" className="text-primary underline mt-2 inline-block">Back to Bills</Link>
      </div>
    );
  }

  const filteredBills = statusFilter === 'All'
    ? data.bills
    : data.bills.filter((b) => b.status === statusFilter);

  const allFilteredSelected = filteredBills.length > 0 && filteredBills.every((b) => selectedIds.has(b.id));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(filteredBills.map((b) => b.id)) : new Set());
  };

  const totals = filteredBills.reduce(
    (acc, b) => ({
      amount: acc.amount + b.amount,
      paid: acc.paid + b.amountPaid,
      balance: acc.balance + b.balance,
    }),
    { amount: 0, paid: 0, balance: 0 }
  );

  const isEditing = editNotes !== null;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/bills">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{data.batchNumber}</h1>
              {batchStatusBadge(data.postStatus)}
            </div>
            <p className="text-sm text-muted-foreground">
              {format(new Date(data.periodStart), 'MMM d, yyyy')} &mdash; {format(new Date(data.periodEnd), 'MMM d, yyyy')}
              {' | '}Created by {data.createdBy.firstName} {data.createdBy.lastName} on {format(new Date(data.createdAt), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data.postStatus === 'UNPOSTED' && (
            <Button size="sm" onClick={handlePost} disabled={patchMutation.isPending}>
              {patchMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
              Post
            </Button>
          )}
          {data.postStatus === 'POSTED' && (
            <Button size="sm" onClick={handleMarkPaid} disabled={patchMutation.isPending}>
              {patchMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <DollarSign className="h-4 w-4 mr-1" />}
              Mark Paid
            </Button>
          )}
          {data.postStatus === 'UNPOSTED' && (
            <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
              Delete
            </Button>
          )}
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> Export</Button>
        </div>
      </div>

      {/* Notes */}
      <div className="flex items-center gap-2 max-w-xl">
        <Input
          placeholder="Add notes..."
          value={isEditing ? editNotes : (data.notes || '')}
          onChange={(e) => setEditNotes(e.target.value)}
          onFocus={() => { if (!isEditing) setEditNotes(data.notes || ''); }}
        />
        {isEditing && (
          <>
            <Button size="sm" onClick={handleSaveNotes} disabled={patchMutation.isPending}>
              {patchMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditNotes(null)}>Cancel</Button>
          </>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <SummaryCard label="Bills" value={data.billCount} />
        <SummaryCard label="Total Amount" value={formatCurrency(data.totalAmount)} />
        <SummaryCard label="Vendors" value={data.vendorCount} />
        <SummaryCard label="Trucks" value={data.truckCount} />
        <SummaryCard label="Trips" value={data.tripCount} />
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 border-b">
        {BILL_STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => { setStatusFilter(f); setSelectedIds(new Set()); }}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              statusFilter === f
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {f === 'All' ? `All (${data.bills.length})` : `${f} (${data.bills.filter((b) => b.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-sm">
          <span className="font-medium">{selectedIds.size} selected</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">Change Status <ChevronDown className="h-3 w-3 ml-1" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {['DRAFT', 'POSTED', 'PAID', 'CANCELLED'].map((s) => (
                <DropdownMenuItem key={s} onClick={() => {
                  toast.info(`Bulk status change to ${s} - not yet implemented`);
                }}>
                  {s}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="destructive" size="sm">
            <Trash2 className="h-3 w-3 mr-1" /> Delete
          </Button>
        </div>
      )}

      {/* Bills table */}
      <div className="border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={allFilteredSelected} onCheckedChange={(c) => toggleAll(!!c)} />
              </TableHead>
              <TableHead>Bill #</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Vendor Inv #</TableHead>
              <TableHead>Load #</TableHead>
              <TableHead>Truck</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Bill Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Payments</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBills.map((bill) => (
              <TableRow key={bill.id}>
                <TableCell><Checkbox checked={selectedIds.has(bill.id)} onCheckedChange={() => toggleSelect(bill.id)} /></TableCell>
                <TableCell className="font-medium text-primary">{bill.billNumber}</TableCell>
                <TableCell>{bill.vendor.name}</TableCell>
                <TableCell>{bill.vendorInvoiceNumber || '-'}</TableCell>
                <TableCell>{bill.load ? (
                  <Link href={`/dashboard/loads/${bill.load.id}`} className="text-primary hover:underline">{bill.load.loadNumber}</Link>
                ) : '-'}</TableCell>
                <TableCell>{bill.truck?.truckNumber || '-'}</TableCell>
                <TableCell>{billStatusBadge(bill.status)}</TableCell>
                <TableCell>{format(new Date(bill.billDate), 'MMM d, yyyy')}</TableCell>
                <TableCell>{bill.dueDate ? format(new Date(bill.dueDate), 'MMM d, yyyy') : '-'}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(bill.amount)}</TableCell>
                <TableCell className="text-right">{formatCurrency(bill.amountPaid)}</TableCell>
                <TableCell className="text-right text-red-600 font-medium">{formatCurrency(bill.balance)}</TableCell>
                <TableCell className="max-w-[150px] truncate">{bill.description || '-'}</TableCell>
                <TableCell className="text-right">{bill._count.payments}</TableCell>
              </TableRow>
            ))}
            {filteredBills.length === 0 && (
              <TableRow>
                <TableCell colSpan={14} className="text-center py-8 text-muted-foreground">No bills found</TableCell>
              </TableRow>
            )}
            {/* Totals row */}
            {filteredBills.length > 0 && (
              <TableRow className="bg-muted/50 font-medium">
                <TableCell colSpan={9} className="text-right">Totals</TableCell>
                <TableCell className="text-right">{formatCurrency(totals.amount)}</TableCell>
                <TableCell className="text-right">{formatCurrency(totals.paid)}</TableCell>
                <TableCell className="text-right text-red-600">{formatCurrency(totals.balance)}</TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border rounded-lg p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-xl font-semibold mt-1">{value}</p>
    </div>
  );
}

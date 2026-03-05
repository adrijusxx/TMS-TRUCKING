'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChevronLeft, Download, Loader2, CheckCircle, Trash2, Save, Send, FileText, RefreshCw,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { apiUrl, formatCurrency } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';
import SettlementSheet from '@/components/settlements/SettlementSheet';
import SalaryNavigation from './SalaryNavigation';

interface SalaryBatchDetailProps {
  batchId: string;
}

const STATUS_TABS = ['All', 'PENDING', 'APPROVED', 'PAID'] as const;

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  APPROVED: 'bg-blue-100 text-blue-800 border-blue-200',
  PAID: 'bg-green-100 text-green-800 border-green-200',
  DISPUTED: 'bg-red-100 text-red-700 border-red-200',
};

const DRIVER_TYPE_LABELS: Record<string, string> = {
  COMPANY_DRIVER: 'Company driver',
  OWNER_OPERATOR: 'Owner operator',
  LEASE: 'Lease',
};

function formatPaymentTariff(driver: any): string {
  if (!driver) return '-';
  const rate = driver.payRate ?? 0;
  switch (driver.payType) {
    case 'PERCENTAGE': return `${rate}% from gross`;
    case 'PER_MILE': return `$${rate.toFixed(2)} per mile`;
    case 'PER_LOAD': return `$${rate.toFixed(2)} per load`;
    case 'HOURLY': return `$${rate.toFixed(2)}/hr`;
    case 'WEEKLY': return `$${rate.toFixed(2)}/week`;
    default: return driver.payType || '-';
  }
}

export default function SalaryBatchDetail({ batchId }: SalaryBatchDetailProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { can } = usePermissions();

  const [statusTab, setStatusTab] = React.useState<string>('All');
  const [driverTypeFilter, setDriverTypeFilter] = React.useState<string>('all');
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [selectedSettlementId, setSelectedSettlementId] = React.useState<string | null>(null);

  // Editable batch fields
  const [editNotes, setEditNotes] = React.useState('');
  const [editCheckDate, setEditCheckDate] = React.useState('');
  const [editPayCompany, setEditPayCompany] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [isPosting, setIsPosting] = React.useState(false);
  const [isReopening, setIsReopening] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);

  const { data: batch, isLoading } = useQuery({
    queryKey: ['salary-batch', batchId],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/api/salary-batches/${batchId}`));
      if (!res.ok) throw new Error('Failed to load batch');
      return (await res.json()).data;
    },
  });

  // Sync editable fields when batch loads
  React.useEffect(() => {
    if (batch) {
      setEditNotes(batch.notes || '');
      setEditCheckDate(batch.checkDate ? format(new Date(batch.checkDate), 'yyyy-MM-dd') : '');
      setEditPayCompany(batch.payCompany || '');
    }
  }, [batch]);

  const settlements = React.useMemo(() => {
    if (!batch?.settlements) return [];
    let filtered = batch.settlements;
    if (statusTab !== 'All') filtered = filtered.filter((s: any) => s.status === statusTab);
    if (driverTypeFilter !== 'all') filtered = filtered.filter((s: any) => s.driver?.driverType === driverTypeFilter);
    return filtered;
  }, [batch, statusTab, driverTypeFilter]);

  const totals = React.useMemo(() => {
    return settlements.reduce((acc: any, s: any) => ({
      grossPay: acc.grossPay + (s.grossPay || 0),
      advances: acc.advances + (s.advances || 0),
      deductions: acc.deductions + (s.deductions || 0),
      netPay: acc.netPay + (s.netPay || 0),
      trips: acc.trips + (s.loadIds?.length || 0),
      expenses: acc.expenses + (s.deductionItems?.filter((d: any) => d.loadExpenseId).reduce((sum: number, d: any) => sum + d.amount, 0) || 0),
      otherPay: acc.otherPay + (s.deductionItems?.filter((d: any) => d.category === 'addition').reduce((sum: number, d: any) => sum + d.amount, 0) || 0),
    }), { grossPay: 0, advances: 0, deductions: 0, netPay: 0, trips: 0, expenses: 0, otherPay: 0 });
  }, [settlements]);

  const handleSaveBatch = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(apiUrl(`/api/salary-batches/${batchId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: editNotes || null,
          checkDate: editCheckDate || null,
          payCompany: editPayCompany || null,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast.success('Batch updated');
      queryClient.invalidateQueries({ queryKey: ['salary-batch', batchId] });
    } catch (err: any) { toast.error(err.message); }
    finally { setIsSaving(false); }
  };

  const handlePost = async () => {
    setIsPosting(true);
    try {
      const res = await fetch(apiUrl(`/api/salary-batches/${batchId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'POSTED' }),
      });
      if (!res.ok) throw new Error('Failed to post');
      toast.success('Batch posted');
      queryClient.invalidateQueries({ queryKey: ['salary-batch', batchId] });
    } catch (err: any) { toast.error(err.message); }
    finally { setIsPosting(false); }
  };

  const handleReopen = async () => {
    setIsReopening(true);
    try {
      const res = await fetch(apiUrl(`/api/salary-batches/${batchId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'OPEN' }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to reopen');
      }
      toast.success('Batch reopened — financial effects reversed');
      queryClient.invalidateQueries({ queryKey: ['salary-batch', batchId] });
    } catch (err: any) { toast.error(err.message); }
    finally { setIsReopening(false); }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(apiUrl(`/api/salary-batches/${batchId}`), { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Batch deleted');
      router.push('/dashboard/accounting/salary');
    } catch (err: any) { toast.error(err.message); }
    finally { setIsDeleting(false); }
  };

  const handleSend = async () => {
    setIsSending(true);
    try {
      const res = await fetch(apiUrl(`/api/salary-batches/${batchId}/send`), { method: 'POST' });
      if (!res.ok) throw new Error('Failed to send settlements');
      toast.success('Settlements sent to drivers');
      queryClient.invalidateQueries({ queryKey: ['salary-batch', batchId] });
    } catch (err: any) { toast.error(err.message); }
    finally { setIsSending(false); }
  };

  const handleExportCSV = () => {
    if (!batch?.settlements?.length) return;
    const rows = [['Settlement #', 'Driver', 'Driver Type', 'Truck', 'Trips', 'Gross Pay', 'Advances', 'Deductions', 'Net Pay', 'Pickup Date', 'Delivery Date']];
    for (const s of batch.settlements) {
      const driverName = s.driver?.user ? `${s.driver.user.firstName} ${s.driver.user.lastName}` : '';
      rows.push([
        s.settlementNumber, driverName, s.driver?.driverType || '',
        s.driver?.currentTruck?.truckNumber || '', String(s.loadIds?.length || 0),
        String(s.grossPay || 0), String(s.advances || 0), String(s.deductions || 0),
        String(s.netPay || 0),
        s.pickupDate ? format(new Date(s.pickupDate), 'MM/dd/yyyy') : '',
        s.deliveryDate ? format(new Date(s.deliveryDate), 'MM/dd/yyyy') : '',
      ]);
    }
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salary-batch-${batch.batchNumber}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(apiUrl(`/api/salary-batches/${batchId}/export-pdf`));
      if (!res.ok) throw new Error('Failed to generate PDF');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `salary-batch-${batch?.batchNumber || batchId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('PDF exported');
    } catch (err: any) { toast.error(err.message); }
    finally { setIsExporting(false); }
  };

  const toggleAll = () => {
    if (selectedIds.size === settlements.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(settlements.map((s: any) => s.id)));
  };

  const toggleOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (isLoading) return <BatchDetailSkeleton />;
  if (!batch) return <div className="p-8 text-center text-destructive">Batch not found</div>;

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Salary module navigation */}
      <SalaryNavigation activeTab="batches" hideGenerate />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">{batch.batchNumber}</h1>
          <Badge className={batch.status === 'POSTED' ? 'bg-green-600 text-white' : batch.status === 'OPEN' ? 'bg-blue-600 text-white' : 'bg-gray-500 text-white'}>
            {batch.status}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {format(new Date(batch.periodStart), 'MMM d, yyyy')} - {format(new Date(batch.periodEnd), 'MMM d, yyyy')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {batch.status === 'OPEN' && can('settlements.create') && (
            <>
              <Button size="sm" onClick={handlePost} disabled={isPosting}>
                {isPosting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                Post
              </Button>
              <Button size="sm" variant="outline" onClick={handleSend} disabled={isSending}>
                {isSending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                Send
              </Button>
            </>
          )}
          {batch.status === 'POSTED' && can('batches.reopen') && (
            <Button size="sm" variant="outline" onClick={handleReopen} disabled={isReopening}>
              {isReopening ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
              Reopen
            </Button>
          )}
          {(batch.status === 'OPEN' || can('batches.delete_posted')) && (
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4 mr-1" /> Delete</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Batch?</DialogTitle>
                  <DialogDescription>
                    {batch.status === 'POSTED'
                      ? 'This batch is POSTED. Deleting it will reverse all financial effects (escrow, deduction rules) and remove all settlements. This cannot be undone.'
                      : 'This will permanently delete the batch and all settlements. This cannot be undone.'}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={isExporting}>
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <FileText className="h-4 w-4 mr-1" />}
            Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
        </div>
      </div>

      {/* Editable batch info */}
      <div className="flex items-end gap-3 flex-wrap border p-3 rounded-lg bg-muted/30">
        <div className="grid gap-1">
          <Label className="text-xs">Check Date</Label>
          <Input type="date" value={editCheckDate} onChange={e => setEditCheckDate(e.target.value)} className="h-8 w-36 text-sm" />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Pay Company</Label>
          <Input value={editPayCompany} onChange={e => setEditPayCompany(e.target.value)} className="h-8 w-48 text-sm" placeholder="Company name" />
        </div>
        <div className="grid gap-1 flex-1 min-w-[200px]">
          <Label className="text-xs">Notes</Label>
          <Input value={editNotes} onChange={e => setEditNotes(e.target.value)} className="h-8 text-sm" placeholder="Batch notes" />
        </div>
        <Button size="sm" variant="outline" onClick={handleSaveBatch} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
          Save
        </Button>
      </div>

      {/* Status filter tabs + driver type filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_TABS.map(tab => (
          <Button
            key={tab}
            size="sm"
            variant={statusTab === tab ? 'default' : 'outline'}
            onClick={() => setStatusTab(tab)}
          >
            {tab === 'All' ? `All (${batch.settlements?.length || 0})` : tab}
          </Button>
        ))}
        <div className="ml-4">
          <Select value={driverTypeFilter} onValueChange={setDriverTypeFilter}>
            <SelectTrigger className="h-8 w-[160px] text-sm"><SelectValue placeholder="Driver Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="COMPANY_DRIVER">Company Driver</SelectItem>
              <SelectItem value="OWNER_OPERATOR">Owner Operator</SelectItem>
              <SelectItem value="LEASE">Lease</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {selectedIds.size > 0 && (
          <span className="text-sm text-muted-foreground ml-2">{selectedIds.size} selected</span>
        )}
      </div>

      {/* Settlements Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 text-xs">
              <TableHead className="w-8"><Checkbox checked={settlements.length > 0 && selectedIds.size === settlements.length} onCheckedChange={toggleAll} /></TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Driver Type</TableHead>
              <TableHead>Assigned Truck</TableHead>
              <TableHead>Payee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Trips</TableHead>
              <TableHead>Payment Tariff</TableHead>
              <TableHead>Pickup Date</TableHead>
              <TableHead>Delivery Date</TableHead>
              <TableHead className="text-right">Pay</TableHead>
              <TableHead className="text-right">Driver Gross</TableHead>
              <TableHead>Trucks</TableHead>
              <TableHead>Note</TableHead>
              <TableHead className="text-right">Advances</TableHead>
              <TableHead className="text-right">Expenses</TableHead>
              <TableHead className="text-right">Deductions</TableHead>
              <TableHead className="text-right">Other Pay</TableHead>
              <TableHead className="text-right">Net Pay</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {settlements.map((s: any) => {
              const expenses = s.deductionItems?.filter((d: any) => d.loadExpenseId).reduce((sum: number, d: any) => sum + d.amount, 0) || 0;
              const otherPay = s.deductionItems?.filter((d: any) => d.category === 'addition').reduce((sum: number, d: any) => sum + d.amount, 0) || 0;
              return (
                <TableRow
                  key={s.id}
                  className="hover:bg-muted/50 cursor-pointer text-xs"
                  onClick={() => { setSelectedSettlementId(s.id); setSheetOpen(true); }}
                >
                  <TableCell onClick={e => e.stopPropagation()}><Checkbox checked={selectedIds.has(s.id)} onCheckedChange={() => toggleOne(s.id)} /></TableCell>
                  <TableCell className="font-medium text-primary">{s.settlementNumber}</TableCell>
                  <TableCell>{DRIVER_TYPE_LABELS[s.driver?.driverType] || '-'}</TableCell>
                  <TableCell>{s.driver?.currentTruck?.truckNumber || '-'}</TableCell>
                  <TableCell className="text-primary">{s.driver?.user?.firstName} {s.driver?.user?.lastName}</TableCell>
                  <TableCell><Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[s.status] || ''}`}>{s.status}</Badge></TableCell>
                  <TableCell className="text-center">{s.loadIds?.length || 0}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatPaymentTariff(s.driver)}</TableCell>
                  <TableCell className="text-xs">{s.pickupDate ? format(new Date(s.pickupDate), 'MM/dd/yyyy') : '-'}</TableCell>
                  <TableCell className="text-xs">{s.deliveryDate ? format(new Date(s.deliveryDate), 'MM/dd/yyyy') : '-'}</TableCell>
                  <TableCell className="text-right">{formatCurrency(s.grossPay)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(s.grossPay)}</TableCell>
                  <TableCell>{s.driver?.currentTruck?.truckNumber || '-'}</TableCell>
                  <TableCell className="max-w-[80px] truncate">{s.notes || '-'}</TableCell>
                  <TableCell className="text-right">{formatCurrency(s.advances)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(expenses)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(s.deductions)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(otherPay)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(s.netPay)}</TableCell>
                </TableRow>
              );
            })}
            {settlements.length === 0 && (
              <TableRow><TableCell colSpan={19} className="text-center py-8 text-muted-foreground">No settlements found</TableCell></TableRow>
            )}
            {settlements.length > 0 && (
              <TableRow className="bg-muted/50 font-semibold text-xs border-t-2">
                <TableCell colSpan={6}>Totals ({settlements.length})</TableCell>
                <TableCell className="text-center">{totals.trips}</TableCell>
                <TableCell />
                <TableCell />
                <TableCell />
                <TableCell className="text-right">{formatCurrency(totals.grossPay)}</TableCell>
                <TableCell className="text-right">{formatCurrency(totals.grossPay)}</TableCell>
                <TableCell />
                <TableCell />
                <TableCell className="text-right">{formatCurrency(totals.advances)}</TableCell>
                <TableCell className="text-right">{formatCurrency(totals.expenses)}</TableCell>
                <TableCell className="text-right">{formatCurrency(totals.deductions)}</TableCell>
                <TableCell className="text-right">{formatCurrency(totals.otherPay)}</TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(totals.netPay)}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <SettlementSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        settlementId={selectedSettlementId}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['salary-batch', batchId] })}
        batchSettlementIds={batch?.settlements?.map((s: any) => s.id) || []}
        onSettlementChange={(id: string) => setSelectedSettlementId(id)}
      />
    </div>
  );
}

function BatchDetailSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

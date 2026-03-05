'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SettlementAuditLog } from './SettlementAuditLog';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { apiUrl, formatCurrency } from '@/lib/utils';
import { SettlementStatus } from '@prisma/client';
import {
  Loader2, ArrowLeft, XCircle, ChevronLeft, ChevronRight,
  Send, FileText, MoreVertical, Undo2, History, CheckCircle, Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import {
  fetchSettlement, updateSettlement, downloadSettlementPDF,
  sendSettlementEmail, fetchDeductions, fetchAdditions,
} from './settlement-detail/api';
import SettlementLoads from './settlement-detail/SettlementLoads';
import SettlementTransactions from './settlement-detail/SettlementTransactions';
import SettlementDriverBalances from './settlement-detail/SettlementDriverBalances';
import DeductionTariffDialog from './settlement-detail/DeductionTariffDialog';
import AddTripsDialog from './settlement-detail/AddTripsDialog';

interface SettlementDetailProps {
  settlementId: string;
  onOpenDriver?: (driverId: string) => void;
  onOpenLoad?: (loadId: string) => void;
  batchSettlementIds?: string[];
  onSettlementChange?: (id: string) => void;
}

function formatPayTariff(driver: any): string {
  if (!driver) return '-';
  const rate = driver.payRate ?? 0;
  switch (driver.payType) {
    case 'PERCENTAGE': return `${rate}% from gross`;
    case 'PER_MILE': return `$${rate.toFixed(2)} per mile`;
    case 'PER_LOAD': return `$${rate.toFixed(2)} per load`;
    case 'HOURLY': return `$${rate.toFixed(2)}/hr`;
    default: return driver.payType || '-';
  }
}

const DRIVER_TYPE_LABELS: Record<string, string> = {
  COMPANY_DRIVER: 'Company driver',
  OWNER_OPERATOR: 'Owner operator',
  LEASE: 'Lease',
};

export default function SettlementDetail({
  settlementId, onOpenDriver, onOpenLoad, batchSettlementIds, onSettlementChange,
}: SettlementDetailProps) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SettlementStatus | ''>('');
  const [notes, setNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [activeView, setActiveView] = useState<'details' | 'audit'>('details');
  const [editedGrossPay, setEditedGrossPay] = useState('');
  const [editedPeriodStart, setEditedPeriodStart] = useState('');
  const [editedPeriodEnd, setEditedPeriodEnd] = useState('');
  const [addTripsOpen, setAddTripsOpen] = useState(false);
  const [isModifyingLoads, setIsModifyingLoads] = useState(false);

  const { data, isLoading, error: settlementError } = useQuery({
    queryKey: ['settlement', settlementId],
    queryFn: () => fetchSettlement(settlementId),
    retry: 1,
  });

  useEffect(() => {
    if (data?.data) {
      const s = data.data;
      if (s.status && !status) setStatus(s.status as SettlementStatus);
      if (s.notes && !notes) setNotes(s.notes);
      if (isEditing && s.grossPay && !editedGrossPay) setEditedGrossPay(s.grossPay.toString());
      if (isEditing && s.periodStart && !editedPeriodStart) {
        setEditedPeriodStart(new Date(s.periodStart).toISOString().split('T')[0]);
      }
      if (isEditing && s.periodEnd && !editedPeriodEnd) {
        setEditedPeriodEnd(new Date(s.periodEnd).toISOString().split('T')[0]);
      }
    }
  }, [data, isEditing, status, notes, editedGrossPay, editedPeriodStart, editedPeriodEnd]);

  const { data: deductionsData, refetch: refetchDeductions } = useQuery({
    queryKey: ['settlement-deductions', settlementId],
    queryFn: () => fetchDeductions(settlementId),
    enabled: !!settlementId,
  });

  const { data: additionsData, refetch: refetchAdditions } = useQuery({
    queryKey: ['settlement-additions', settlementId],
    queryFn: () => fetchAdditions(settlementId),
    enabled: !!settlementId,
  });

  const updateMutation = useMutation({
    mutationFn: (d: any) => updateSettlement(settlementId, d),
    onSuccess: () => {
      toast.success('Settlement updated');
      queryClient.invalidateQueries({ queryKey: ['settlement', settlementId] });
      setIsEditing(false);
      setStatus(''); setNotes(''); setEditedGrossPay('');
      setEditedPeriodStart(''); setEditedPeriodEnd('');
    },
  });

  const settlement = data?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading settlement...</span>
      </div>
    );
  }

  if (settlementError || !settlement || !settlement.driver) {
    const message = settlementError instanceof Error ? settlementError.message
      : !settlement ? 'Settlement not found or no access.' : 'Missing driver information.';
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <XCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-muted-foreground mb-4">{message}</p>
        <Link href="/dashboard/accounting/salary?tab=statements">
          <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
        </Link>
      </div>
    );
  }

  const currentIdx = batchSettlementIds?.indexOf(settlementId) ?? -1;
  const prevId = currentIdx > 0 ? batchSettlementIds![currentIdx - 1] : null;
  const nextId = batchSettlementIds && currentIdx < batchSettlementIds.length - 1
    ? batchSettlementIds[currentIdx + 1] : null;

  const driver = settlement.driver;
  const additionsTotal = additionsData?.data?.reduce(
    (s: number, a: any) => s + a.amount * (a.quantity ?? 1), 0
  ) || 0;
  const fuelTollExpenses = settlement.deductionItems?.filter(
    (d: any) => ['FUEL_ADVANCE', 'TOLLS', 'FUEL_CARD', 'FUEL_CARD_FEE'].includes(d.deductionType)
  ).reduce((s: number, d: any) => s + d.amount * (d.quantity ?? 1), 0) || 0;

  const handleSave = () => {
    const d: any = {};
    if (status) d.status = status;
    if (notes !== settlement.notes) d.notes = notes;
    if (editedGrossPay && parseFloat(editedGrossPay) !== settlement.grossPay) {
      d.grossPay = parseFloat(editedGrossPay);
    }
    if (editedPeriodStart) d.periodStart = new Date(editedPeriodStart);
    if (editedPeriodEnd) d.periodEnd = new Date(editedPeriodEnd);
    updateMutation.mutate(d);
  };

  const handlePost = async () => {
    setIsPosting(true);
    try {
      await updateSettlement(settlementId, { status: 'APPROVED' });
      toast.success('Settlement posted');
      queryClient.invalidateQueries({ queryKey: ['settlement', settlementId] });
    } catch { toast.error('Failed to post'); }
    finally { setIsPosting(false); }
  };

  const handleUndo = async () => {
    try {
      await updateSettlement(settlementId, { status: 'PENDING' });
      toast.success('Status reverted to Pending');
      queryClient.invalidateQueries({ queryKey: ['settlement', settlementId] });
    } catch { toast.error('Failed to undo'); }
  };

  const handleSendToDriver = async () => {
    setIsSendingEmail(true);
    try { await sendSettlementEmail(settlementId); toast.success('Sent to driver'); }
    catch { toast.error('Failed to send'); }
    finally { setIsSendingEmail(false); }
  };

  const handleDownloadPDF = async () => {
    setIsDownloadingPDF(true);
    try { await downloadSettlementPDF(settlementId); } finally { setIsDownloadingPDF(false); }
  };

  const handleAddTrips = async (loadIds: string[]) => {
    setIsModifyingLoads(true);
    try {
      await updateSettlement(settlementId, { addLoadIds: loadIds });
      toast.success(`Added ${loadIds.length} trip(s)`);
      queryClient.invalidateQueries({ queryKey: ['settlement', settlementId] });
      setAddTripsOpen(false);
    } catch { toast.error('Failed to add trips'); }
    finally { setIsModifyingLoads(false); }
  };

  const handleDeleteLoads = async (loadIds: string[]) => {
    setIsModifyingLoads(true);
    try {
      await updateSettlement(settlementId, { removeLoadIds: loadIds });
      toast.success(`Removed ${loadIds.length} load(s)`);
      queryClient.invalidateQueries({ queryKey: ['settlement', settlementId] });
    } catch { toast.error('Failed to remove loads'); }
    finally { setIsModifyingLoads(false); }
  };

  const periodStr = settlement.periodStart && settlement.periodEnd
    ? `${format(new Date(settlement.periodStart), 'MM/dd')} - ${format(new Date(settlement.periodEnd), 'MM/dd')}`
    : '-';

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <Link href="/dashboard/accounting/salary?tab=statements">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" onClick={handleSendToDriver} disabled={isSendingEmail}
            className="bg-blue-600 hover:bg-blue-700 text-white">
            {isSendingEmail ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
            Send to driver
          </Button>
          <Button size="sm" onClick={handlePost}
            disabled={isPosting || settlement.status === 'APPROVED'}
            className="bg-green-600 hover:bg-green-700 text-white">
            {isPosting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
            Post
          </Button>
          <DeductionTariffDialog deductionRules={driver?.deductionRules || []} driverId={driver?.id} />
          <Button size="sm" variant="outline" onClick={handleDownloadPDF} disabled={isDownloadingPDF}>
            {isDownloadingPDF ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <FileText className="h-4 w-4 mr-1" />}
            Export as PDF
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-[60]">
              <DropdownMenuItem onClick={handleUndo}>
                <Undo2 className="h-4 w-4 mr-2" />Undo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveView('audit')}>
                <History className="h-4 w-4 mr-2" />History
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Settlement Info Header — readable grid layout */}
      <div className="border rounded-lg bg-muted/30 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-3 text-sm">
          {/* Row 1: Identity info */}
          <InfoCell label="Settlement">
            <div className="flex items-center gap-1">
              {prevId && (
                <Button variant="ghost" size="icon" className="h-6 w-6"
                  onClick={() => onSettlementChange?.(prevId)}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
              )}
              <span className="font-semibold">{settlement.settlementNumber}</span>
              {nextId && (
                <Button variant="ghost" size="icon" className="h-6 w-6"
                  onClick={() => onSettlementChange?.(nextId)}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </InfoCell>
          <InfoCell label="Driver">
            <button className="text-primary hover:underline font-medium text-left"
              onClick={() => onOpenDriver?.(driver.id)}>
              {driver.user?.firstName} {driver.user?.lastName}
            </button>
          </InfoCell>
          <InfoCell label="Period">{periodStr}</InfoCell>
          <InfoCell label="Driver type">
            {DRIVER_TYPE_LABELS[driver.driverType] || driver.driverType || '-'}
          </InfoCell>
          <InfoCell label="Payment tariff">{formatPayTariff(driver)}</InfoCell>
          <InfoCell label="Trips count">{settlement.loads?.length || 0}</InfoCell>
        </div>

        <div className="border-t mt-3 pt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-x-6 gap-y-3 text-sm">
          <InfoCell label="Total Gross">
            <span className="font-bold text-base">{formatCurrency(settlement.grossPay)}</span>
          </InfoCell>
          <InfoCell label="Deductions">
            <span className="font-bold text-base text-red-500">({formatCurrency(settlement.deductions)})</span>
          </InfoCell>
          <InfoCell label="Earnings">
            <span className="font-bold text-base">{formatCurrency(settlement.grossPay + additionsTotal)}</span>
          </InfoCell>
          <InfoCell label="Net pay">
            <span className="font-bold text-base">{formatCurrency(settlement.netPay)}</span>
          </InfoCell>
          <InfoCell label="Advances">
            <span className="font-medium">({formatCurrency(settlement.advances)})</span>
          </InfoCell>
          <InfoCell label="Balances">
            <span className="font-medium">{formatCurrency(driver.escrowBalance || 0)}</span>
            {(driver.escrowBalance > 0) && (
              <button className="text-primary text-xs hover:underline ml-1"
                onClick={() => {
                  const el = document.getElementById('driver-balances-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}>
                <Eye className="h-3 w-3 inline" /> Review
              </button>
            )}
          </InfoCell>
          <InfoCell label="Expenses">
            {formatCurrency(0)}
          </InfoCell>
          <InfoCell label="Fuel & Toll expenses">
            <span>{formatCurrency(fuelTollExpenses)}</span>
            {fuelTollExpenses > 0 && (
              <button className="text-primary text-xs hover:underline ml-1"
                onClick={() => {
                  const el = document.getElementById('deductions-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}>
                <Eye className="h-3 w-3 inline" /> Review
              </button>
            )}
          </InfoCell>
          <InfoCell label="Other pay">{formatCurrency(additionsTotal)}</InfoCell>
          <InfoCell label="Attachments & Notes">
            {settlement.notes ? (
              <span className="truncate max-w-[120px] block" title={settlement.notes}>View</span>
            ) : '-'}
          </InfoCell>
        </div>
      </div>

      {activeView === 'details' ? (
        <div className="space-y-6">
          <SettlementLoads
            loads={settlement.loads}
            hideRevenue
            onAddTrips={() => setAddTripsOpen(true)}
            onDeleteLoads={handleDeleteLoads}
            isDeleting={isModifyingLoads}
            onOpenLoad={onOpenLoad}
          />

          <AddTripsDialog
            open={addTripsOpen}
            onOpenChange={setAddTripsOpen}
            driverId={driver.id}
            existingLoadIds={settlement.loadIds || []}
            onAdd={handleAddTrips}
            isAdding={isModifyingLoads}
          />

          <SettlementTransactions
            settlementId={settlementId}
            additionsData={additionsData}
            deductionsData={deductionsData}
            refetchDeductions={refetchDeductions}
            refetchAdditions={refetchAdditions}
          />

          <div id="driver-balances-section">
            <SettlementDriverBalances
              driver={driver}
              escrowItems={settlement.deductionItems?.filter(
                (d: any) => d.deductionType === 'ESCROW'
              )}
            />
          </div>

          {isEditing && (
            <Card>
              <CardHeader><CardTitle>Update Settlement</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as SettlementStatus)}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="DISPUTED">Disputed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea placeholder="Add notes..." value={notes}
                    onChange={(e) => setNotes(e.target.value)} rows={3} />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setIsEditing(false)} variant="outline">Cancel</Button>
                  <Button onClick={handleSave} disabled={updateMutation.isPending}>Save</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div>
          <Button variant="ghost" size="sm" className="mb-2"
            onClick={() => setActiveView('details')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to details
          </Button>
          <SettlementAuditLog
            auditLog={settlement.calculationLog as any}
            calculationHistory={(settlement as any).calculationHistory || []}
            grossPay={settlement.grossPay}
            netPay={settlement.netPay}
            deductions={settlement.deductions}
          />
        </div>
      )}
    </div>
  );
}

function InfoCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <div className="font-medium">{children}</div>
    </div>
  );
}

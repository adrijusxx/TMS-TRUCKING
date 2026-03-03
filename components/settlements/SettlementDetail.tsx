'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SettlementAuditLog } from './SettlementAuditLog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { apiUrl } from '@/lib/utils';
import { SettlementStatus } from '@prisma/client';
import {
  Loader2,
  ArrowLeft,
  XCircle,
  Download,
  Mail,
  ChevronsUpDown,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { statusColors, formatStatus } from './settlement-detail/types';
import {
  fetchSettlement,
  updateSettlement,
  downloadSettlementPDF,
  sendSettlementEmail,
  fetchDeductions,
  fetchAdditions,
} from './settlement-detail/api';
import SettlementBreakdown from './settlement-detail/SettlementBreakdown';
import SettlementLoads from './settlement-detail/SettlementLoads';
import SettlementTransactions from './settlement-detail/SettlementTransactions';

interface SettlementDetailProps {
  settlementId: string;
  onOpenDriver?: (driverId: string) => void;
}

export default function SettlementDetail({ settlementId, onOpenDriver }: SettlementDetailProps) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SettlementStatus | ''>('');
  const [notes, setNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [editedGrossPay, setEditedGrossPay] = useState('');
  const [editedPeriodStart, setEditedPeriodStart] = useState('');
  const [editedPeriodEnd, setEditedPeriodEnd] = useState('');

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
    mutationFn: (data: any) => updateSettlement(settlementId, data),
    onSuccess: () => {
      toast.success('Settlement updated successfully');
      queryClient.invalidateQueries({ queryKey: ['settlement', settlementId] });
      setIsEditing(false);
      setStatus('');
      setNotes('');
      setEditedGrossPay('');
      setEditedPeriodStart('');
      setEditedPeriodEnd('');
    },
  });

  const handleRecalculate = async () => {
    if (!confirm('Are you sure you want to recalculate this settlement? This will reset all auto-generated deductions and update pay based on current load data. Manual edits to deductions may be lost.')) return;
    setIsRecalculating(true);
    try {
      const response = await fetch(apiUrl(`/api/settlements/${settlementId}/recalculate`), { method: 'POST' });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to recalculate settlement');
      }
      const result = await response.json();
      if (result.success) {
        toast.success('Settlement recalculated successfully');
        queryClient.invalidateQueries({ queryKey: ['settlement', settlementId] });
        queryClient.invalidateQueries({ queryKey: ['settlement-deductions', settlementId] });
        queryClient.invalidateQueries({ queryKey: ['settlement-additions', settlementId] });
        refetchDeductions();
        refetchAdditions();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to recalculate settlement');
    } finally {
      setIsRecalculating(false);
    }
  };

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
      : !settlement ? 'The settlement you are looking for does not exist or you do not have access to it.'
      : 'This settlement is missing driver information. Please contact support.';
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <XCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          {settlementError ? 'Error Loading Settlement' : !settlement ? 'Settlement Not Found' : 'Driver Information Missing'}
        </h2>
        <p className="text-muted-foreground mb-4">{message}</p>
        <Link href="/dashboard/settlements">
          <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Back to Settlements</Button>
        </Link>
      </div>
    );
  }

  const handleSave = () => {
    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes !== settlement.notes) updateData.notes = notes;
    if (editedGrossPay && parseFloat(editedGrossPay) !== settlement.grossPay) {
      updateData.grossPay = parseFloat(editedGrossPay);
    }
    if (editedPeriodStart && editedPeriodStart !== new Date(settlement.periodStart).toISOString().split('T')[0]) {
      updateData.periodStart = new Date(editedPeriodStart);
    }
    if (editedPeriodEnd && editedPeriodEnd !== new Date(settlement.periodEnd).toISOString().split('T')[0]) {
      updateData.periodEnd = new Date(editedPeriodEnd);
    }
    updateMutation.mutate(updateData);
  };

  const handleDownloadPDF = async (format?: string) => {
    setIsDownloadingPDF(true);
    try { await downloadSettlementPDF(settlementId, format); } finally { setIsDownloadingPDF(false); }
  };

  const handleSendEmail = async () => {
    setIsSendingEmail(true);
    try { await sendSettlementEmail(settlementId); } finally { setIsSendingEmail(false); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/settlements">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div><h1 className="text-3xl font-bold">{settlement.settlementNumber}</h1></div>
        </div>
        <div className="flex items-center flex-wrap gap-2">
          <Badge variant="outline" className={statusColors[settlement.status as SettlementStatus]}>
            {formatStatus(settlement.status)}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isDownloadingPDF}>
                {isDownloadingPDF ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Downloading...</>
                ) : (
                  <><Download className="mr-2 h-4 w-4" />Download PDF<ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" /></>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-[60]">
              <DropdownMenuItem onClick={() => handleDownloadPDF()}>Formal (Office)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownloadPDF('simple')}>Driver Friendly (Simple)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleSendEmail} disabled={isSendingEmail} variant="outline" size="sm">
            {isSendingEmail ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>
            ) : (
              <><Mail className="mr-2 h-4 w-4" />Email Statement</>
            )}
          </Button>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="outline">Edit</Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={() => setIsEditing(false)} variant="outline">Cancel</Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending}>Save</Button>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="details">Settlement Details</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <SettlementBreakdown
              settlement={settlement}
              additionsData={additionsData}
              isEditing={isEditing}
              editedGrossPay={editedGrossPay}
              editedPeriodStart={editedPeriodStart}
              editedPeriodEnd={editedPeriodEnd}
              onEditGrossPay={setEditedGrossPay}
              onEditPeriodStart={setEditedPeriodStart}
              onEditPeriodEnd={setEditedPeriodEnd}
              onOpenDriver={onOpenDriver}
            />

            <SettlementTransactions
              settlementId={settlementId}
              additionsData={additionsData}
              deductionsData={deductionsData}
              refetchDeductions={refetchDeductions}
              refetchAdditions={refetchAdditions}
            />

            {/* Status Update */}
            {isEditing && (
              <Card className="md:col-span-2 lg:col-span-3">
                <CardHeader><CardTitle>Update Settlement</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
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
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" placeholder="Add notes..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
                  </div>
                </CardContent>
              </Card>
            )}

            {settlement.notes && !isEditing && (
              <Card className="md:col-span-2 lg:col-span-3">
                <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
                <CardContent><p className="text-sm whitespace-pre-wrap">{settlement.notes}</p></CardContent>
              </Card>
            )}

            <SettlementLoads loads={settlement.loads} />
          </div>
        </TabsContent>
        <TabsContent value="audit">
          <SettlementAuditLog
            auditLog={settlement.calculationLog as any}
            calculationHistory={(settlement as any).calculationHistory || []}
            grossPay={settlement.grossPay}
            netPay={settlement.netPay}
            deductions={settlement.deductions}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

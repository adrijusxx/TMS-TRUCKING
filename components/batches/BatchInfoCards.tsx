'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency, formatDate, apiUrl } from '@/lib/utils';
import { BatchPostStatus } from '@prisma/client';
import { CheckCircle2, XCircle, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

const statusColors: Record<BatchPostStatus, string> = {
  UNPOSTED: 'bg-orange-100 text-orange-800 border-orange-200',
  POSTED: 'bg-blue-100 text-blue-800 border-blue-200',
  PAID: 'bg-green-100 text-green-800 border-green-200',
};

const emailStatusColors: Record<string, string> = {
  NOT_SENT: 'bg-gray-100 text-gray-700',
  SENDING: 'bg-yellow-100 text-yellow-800',
  SENT: 'bg-green-100 text-green-800',
  PARTIAL: 'bg-orange-100 text-orange-800',
  FAILED: 'bg-red-100 text-red-800',
};

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

interface BatchInfoCardsProps {
  batch: any;
  batchId: string;
  emailLogsData: any;
}

export default function BatchInfoCards({ batch, batchId, emailLogsData }: BatchInfoCardsProps) {
  const queryClient = useQueryClient();
  const [editNotes, setEditNotes] = useState(batch.notes || '');
  const [editMc, setEditMc] = useState(batch.mcNumber || '');

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(apiUrl(`/api/batches/${batchId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: editNotes || null, mcNumber: editMc || null }),
      });
      if (!res.ok) throw new Error('Failed to save');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch', batchId] });
      toast.success('Batch updated');
    },
    onError: () => toast.error('Failed to save batch fields'),
  });

  const emailStatus = batch.emailStatus || 'NOT_SENT';
  const sentCount = emailLogsData?.data?.filter((l: any) => l.status === 'SENT').length || 0;
  const failedCount = emailLogsData?.data?.filter((l: any) => l.status === 'FAILED').length || 0;
  const isDirty = editNotes !== (batch.notes || '') || editMc !== (batch.mcNumber || '');

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Batch Information</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge className={statusColors[batch.postStatus as BatchPostStatus]}>
                {formatStatus(batch.postStatus)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Created By</span>
              <span>{batch.createdBy.firstName} {batch.createdBy.lastName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{formatDate(batch.createdAt)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Summary</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Invoices</span>
              <span className="text-xl font-bold">{batch.invoiceCount || batch.items.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Amount</span>
              <span className="text-xl font-bold">{formatCurrency(batch.totalAmount)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Email Status</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Badge className={emailStatusColors[emailStatus] || emailStatusColors.NOT_SENT}>
              {formatStatus(emailStatus)}
            </Badge>
            {emailStatus !== 'NOT_SENT' && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                  <span>{sentCount} sent</span>
                </div>
                {failedCount > 0 && (
                  <div className="flex items-center gap-1">
                    <XCircle className="h-3.5 w-3.5 text-red-600" />
                    <span>{failedCount} failed</span>
                  </div>
                )}
              </div>
            )}
            {batch.sentAt && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Sent At</span>
                <span>{formatDate(batch.sentAt)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Editable fields */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">MC Number</label>
          <Input
            value={editMc}
            onChange={(e) => setEditMc(e.target.value)}
            placeholder="MC-XXXXXX"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Notes</label>
          <Textarea
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            placeholder="Batch notes..."
            rows={2}
          />
        </div>
      </div>
      {isDirty && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}

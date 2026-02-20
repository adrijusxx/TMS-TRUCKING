'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatCurrency, formatDate, apiUrl } from '@/lib/utils';
import { BatchPostStatus } from '@prisma/client';
import { Send, ArrowLeft, Loader2, CheckCircle2, XCircle, Mail, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import BatchValidationDialog from './BatchValidationDialog';

interface BatchDetailProps {
  batchId: string;
}

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

async function fetchBatch(id: string) {
  const response = await fetch(apiUrl(`/api/batches/${id}`));
  if (!response.ok) throw new Error('Failed to fetch batch');
  return response.json();
}

async function fetchEmailLogs(batchId: string) {
  const response = await fetch(apiUrl(`/api/batches/${batchId}/email-logs`));
  if (!response.ok) return { data: [] };
  return response.json();
}

export default function BatchDetail({ batchId }: BatchDetailProps) {
  const queryClient = useQueryClient();
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const downloadPackage = async (invoiceId: string, invoiceNumber: string) => {
    setDownloadingId(invoiceId);
    try {
      const response = await fetch(apiUrl(`/api/invoices/${invoiceId}/package`));
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'Failed to generate package');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-package-${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error(`Download failed: ${error.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ['batch', batchId],
    queryFn: () => fetchBatch(batchId),
  });

  const { data: emailLogsData } = useQuery({
    queryKey: ['batch-email-logs', batchId],
    queryFn: () => fetchEmailLogs(batchId),
  });

  const sendBatchMutation = useMutation({
    mutationFn: async () => {
      // First validate
      const valRes = await fetch(apiUrl(`/api/batches/${batchId}/validate`));
      const valData = await valRes.json();

      if (!valData.data?.ready) {
        setValidationErrors(valData.data?.errors || []);
        setShowValidationDialog(true);
        throw new Error('VALIDATION_BLOCKED');
      }

      // Then send
      const response = await fetch(apiUrl(`/api/batches/${batchId}/send`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || 'Failed to send batch');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch', batchId] });
      queryClient.invalidateQueries({ queryKey: ['batch-email-logs', batchId] });
      queryClient.invalidateQueries({ queryKey: ['batches'] });
    },
    onError: (error) => {
      if (error.message !== 'VALIDATION_BLOCKED') {
        console.error('Send batch failed:', error);
      }
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (postStatus: BatchPostStatus) => {
      const response = await fetch(apiUrl(`/api/batches/${batchId}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postStatus }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch', batchId] });
      queryClient.invalidateQueries({ queryKey: ['batches'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const batch = data?.data;
  if (!batch) return <div>Batch not found</div>;

  // Build email log lookup by invoiceId
  const emailLogs: Record<string, any> = {};
  if (emailLogsData?.data) {
    for (const log of emailLogsData.data) {
      emailLogs[log.invoiceId] = log;
    }
  }

  const emailStatus = batch.emailStatus || 'NOT_SENT';
  const sentCount = emailLogsData?.data?.filter((l: any) => l.status === 'SENT').length || 0;
  const failedCount = emailLogsData?.data?.filter((l: any) => l.status === 'FAILED').length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/batches">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{batch.batchNumber}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          {batch.postStatus === 'UNPOSTED' && (
            <Button
              onClick={() => sendBatchMutation.mutate()}
              disabled={sendBatchMutation.isPending}
            >
              {sendBatchMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Send className="h-4 w-4 mr-2" />
              Send Batch
            </Button>
          )}
          <Select
            value={batch.postStatus}
            onValueChange={(value: string) =>
              updateStatusMutation.mutate(value as BatchPostStatus)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UNPOSTED">UNPOSTED</SelectItem>
              <SelectItem value="POSTED">POSTED</SelectItem>
              <SelectItem value="PAID">PAID</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Batch Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <Badge className={statusColors[batch.postStatus as BatchPostStatus]}>
                {formatStatus(batch.postStatus)}
              </Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Created By</div>
              <div>{batch.createdBy.firstName} {batch.createdBy.lastName}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Created Date</div>
              <div>{formatDate(batch.createdAt)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">MC Number</div>
              <div>{batch.mcNumber || '-'}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <div className="text-sm text-muted-foreground">Total Invoices</div>
              <div className="text-2xl font-bold">{batch.invoiceCount || batch.items.length}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Amount</div>
              <div className="text-2xl font-bold">{formatCurrency(batch.totalAmount)}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Badge className={emailStatusColors[emailStatus] || emailStatusColors.NOT_SENT}>
                {formatStatus(emailStatus)}
              </Badge>
            </div>
            {emailStatus !== 'NOT_SENT' && (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>{sentCount} sent</span>
                </div>
                {failedCount > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span>{failedCount} failed</span>
                  </div>
                )}
              </>
            )}
            {batch.sentAt && (
              <div>
                <div className="text-sm text-muted-foreground">Sent At</div>
                <div className="text-sm">{formatDate(batch.sentAt)}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {batch.notes && (
        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{batch.notes}</p></CardContent>
        </Card>
      )}

      {/* Invoice Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices in Batch</CardTitle>
          <CardDescription>
            {batch.items?.length || 0} invoice(s) in this batch
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TooltipProvider>
                  {batch.items?.map((item: any) => {
                    const log = emailLogs[item.invoice.id];
                    return (
                      <TableRow key={item.invoice.id}>
                        <TableCell className="font-medium">
                          {item.invoice.invoiceNumber}
                        </TableCell>
                        <TableCell>{item.invoice.customer.name}</TableCell>
                        <TableCell>{formatDate(item.invoice.invoiceDate)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.invoice.total)}
                        </TableCell>
                        <TableCell>
                          <EmailStatusCell log={log} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => downloadPackage(item.invoice.id, item.invoice.invoiceNumber)}
                                  disabled={downloadingId === item.invoice.id}
                                >
                                  {downloadingId === item.invoice.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Download className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Download PDF Package (Invoice + Rate Con + POD + BOL)</TooltipContent>
                            </Tooltip>
                            <Link href={`/dashboard/invoices/${item.invoice.id}`}>
                              <Button variant="ghost" size="sm">
                                <FileText className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TooltipProvider>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <BatchValidationDialog
        open={showValidationDialog}
        onClose={() => setShowValidationDialog(false)}
        errors={validationErrors}
      />
    </div>
  );
}

function EmailStatusCell({ log }: { log: any }) {
  if (!log) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }

  const icon = log.status === 'SENT' ? (
    <CheckCircle2 className="h-4 w-4 text-green-600" />
  ) : log.status === 'FAILED' ? (
    <XCircle className="h-4 w-4 text-red-600" />
  ) : (
    <Mail className="h-4 w-4 text-muted-foreground" />
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5 cursor-default">
          {icon}
          <span className="text-xs text-muted-foreground truncate max-w-[140px]">
            {log.recipientEmail}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="text-xs space-y-1">
          <div>Status: {log.status}</div>
          <div>Type: {log.recipientType}</div>
          <div>To: {log.recipientEmail}</div>
          {log.sentAt && <div>Sent: {formatDate(log.sentAt)}</div>}
          {log.errorMessage && (
            <div className="text-red-500">Error: {log.errorMessage}</div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

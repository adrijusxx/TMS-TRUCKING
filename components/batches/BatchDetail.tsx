'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency, formatDate, apiUrl } from '@/lib/utils';
import { BatchPostStatus } from '@prisma/client';
import { Send, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface BatchDetailProps {
  batchId: string;
}

const statusColors: Record<BatchPostStatus, string> = {
  UNPOSTED: 'bg-orange-100 text-orange-800 border-orange-200',
  POSTED: 'bg-blue-100 text-blue-800 border-blue-200',
  PAID: 'bg-green-100 text-green-800 border-green-200',
};

function formatStatus(status: BatchPostStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

async function fetchBatch(id: string) {
  const response = await fetch(apiUrl(`/api/batches/${id}`));
  if (!response.ok) throw new Error('Failed to fetch batch');
  return response.json();
}

export default function BatchDetail({ batchId }: BatchDetailProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['batch', batchId],
    queryFn: () => fetchBatch(batchId),
  });

  const sendBatchMutation = useMutation({
    mutationFn: async (data: { factoringCompany?: string; notes?: string }) => {
      const response = await fetch(apiUrl(`/api/batches/${batchId}/send`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to send batch');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch', batchId] });
      queryClient.invalidateQueries({ queryKey: ['batches'] });
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
  if (!batch) {
    return <div>Batch not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/accounting/batches">
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
              onClick={() => sendBatchMutation.mutate({})}
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
              <div>
                {batch.createdBy.firstName} {batch.createdBy.lastName}
              </div>
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
              <div className="text-2xl font-bold">
                {formatCurrency(batch.totalAmount)}
              </div>
            </div>
          </CardContent>
        </Card>

        {batch.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{batch.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

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
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batch.items?.map((item: any) => (
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
                      <Link href={`/dashboard/invoices/${item.invoice.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


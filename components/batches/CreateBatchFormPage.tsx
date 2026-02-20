'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '@/lib/utils';
import { Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import BatchLoadSelector from './BatchLoadSelector';
import Link from 'next/link';

export default function CreateBatchFormPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedLoadIds, setSelectedLoadIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const createBatchMutation = useMutation({
    mutationFn: async (data: { loadIds: string[]; notes?: string }) => {
      const response = await fetch(apiUrl('/api/batches/from-loads'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        const customError: any = new Error(error.error?.message || 'Failed to create batch');
        customError.errorDetails = error.error;
        throw customError;
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      const msg = data.meta
        ? `Batch created: ${data.meta.generatedInvoices} invoice(s) generated, ${data.meta.existingInvoices} existing`
        : 'Batch created successfully';
      toast.success(msg);
      router.push(`/dashboard/batches/${data.data.id}`);
    },
    onError: (error: any) => {
      const details = error.errorDetails?.details;
      toast.error(error.message || 'Failed to create batch', {
        description: details
          ? details.map((d: any) => `Load ${d.loadNumber}: ${d.reason}`).join('; ')
          : undefined,
        duration: 10000,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLoadIds.length === 0) {
      toast.warning('Please select at least one load');
      return;
    }
    createBatchMutation.mutate({
      loadIds: selectedLoadIds,
      notes: notes || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Create New Batch</h1>
          <p className="text-muted-foreground mt-1">
            Select delivered loads to generate invoices and group them into a batch
          </p>
        </div>
        <Link href="/dashboard/batches">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Batches
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Load Selection */}
        <Card className="flex flex-col" style={{ minHeight: '600px' }}>
          <CardHeader>
            <CardTitle>Select Loads</CardTitle>
            <CardDescription>
              Choose delivered loads to include. Invoices will be auto-generated for loads that don&apos;t have one yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0">
            <BatchLoadSelector
              selectedLoadIds={selectedLoadIds}
              onSelectionChange={setSelectedLoadIds}
            />
          </CardContent>
        </Card>

        {/* Notes */}
        {selectedLoadIds.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Batch Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this batch..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Validation Errors */}
        {createBatchMutation.isError && (createBatchMutation.error as any)?.errorDetails?.details && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Cannot Create Batch</AlertTitle>
            <AlertDescription>
              <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                {(createBatchMutation.error as any).errorDetails.details.map((d: any, i: number) => (
                  <li key={i}><strong>Load {d.loadNumber}:</strong> {d.reason}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link href="/dashboard/batches">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button
            type="submit"
            disabled={createBatchMutation.isPending || selectedLoadIds.length === 0}
            size="lg"
          >
            {createBatchMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Batch {selectedLoadIds.length > 0 && `(${selectedLoadIds.length} loads)`}
          </Button>
        </div>
      </form>
    </div>
  );
}

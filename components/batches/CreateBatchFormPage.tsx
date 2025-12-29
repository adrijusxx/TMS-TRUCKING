'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '@/lib/utils';
import { Loader2, ArrowLeft } from 'lucide-react';
import BatchInvoiceSelector from './BatchInvoiceSelector';
import McNumberSelector from '@/components/mc-numbers/McNumberSelector';
import Link from 'next/link';

export default function CreateBatchFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  
  // Get preselected invoice IDs from URL params
  const preselectedInvoiceIdsParam = searchParams.get('invoiceIds');
  const preselectedInvoiceIds = preselectedInvoiceIdsParam 
    ? preselectedInvoiceIdsParam.split(',').filter(Boolean)
    : [];

  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>(preselectedInvoiceIds);
  const [mcNumberId, setMcNumberId] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Update selected invoices when preselectedInvoiceIds changes
  useEffect(() => {
    if (preselectedInvoiceIds.length > 0) {
      setSelectedInvoiceIds(preselectedInvoiceIds);
    }
  }, [preselectedInvoiceIds.join(',')]);

  // Fetch all MC numbers to get the number string from ID
  const { data: mcNumbersData } = useQuery({
    queryKey: ['mc-numbers'],
    queryFn: async () => {
      const response = await fetch(apiUrl('/api/mc-numbers?limit=1000'));
      if (!response.ok) return [];
      const result = await response.json();
      return Array.isArray(result.data) ? result.data : [];
    },
  });

  // Get MC number string from selected ID
  const getMcNumberString = (id: string): string | undefined => {
    if (!mcNumbersData || !Array.isArray(mcNumbersData)) return undefined;
    const mcNumber = mcNumbersData.find((mc: any) => mc.id === id);
    return mcNumber?.number;
  };

  const createBatchMutation = useMutation({
    mutationFn: async (data: {
      invoiceIds: string[];
      mcNumber?: string;
      notes?: string;
    }) => {
      const response = await fetch(apiUrl('/api/batches'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create batch');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      router.push(`/dashboard/accounting/batches/${data.data.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedInvoiceIds.length === 0) {
      alert('Please select at least one invoice');
      return;
    }

    // Get MC number string from ID if selected
    const mcNumberString = mcNumberId ? getMcNumberString(mcNumberId) : undefined;

    createBatchMutation.mutate({
      invoiceIds: selectedInvoiceIds,
      mcNumber: mcNumberString || undefined,
      notes: notes || undefined,
    });
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Create New Batch</h1>
          <p className="text-muted-foreground mt-1">
            Select invoices to group into a batch for processing
          </p>
        </div>
        <Link href="/dashboard/accounting/batches">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Batches
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Batch Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Batch Configuration</CardTitle>
            <CardDescription>Set batch options before selecting invoices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <McNumberSelector
              value={mcNumberId}
              onValueChange={setMcNumberId}
              label="MC Number (Optional)"
              required={false}
            />

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this batch..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Invoice Selection */}
        <Card className="flex flex-col" style={{ minHeight: '600px' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Select Invoices</CardTitle>
                <CardDescription>
                  Choose invoices to include in this batch. Only unpaid invoices not already in batches are shown.
                </CardDescription>
              </div>
              {preselectedInvoiceIds.length > 0 && (
                <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950 px-3 py-1 rounded">
                  {preselectedInvoiceIds.length} invoice(s) preselected
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0 space-y-4">
            <div className="flex-1 min-h-0">
              <BatchInvoiceSelector
                selectedInvoiceIds={selectedInvoiceIds}
                onSelectionChange={setSelectedInvoiceIds}
                excludeInvoiceIds={[]}
              />
            </div>
            
            {selectedInvoiceIds.length > 0 && (
              <div className="border-t pt-4 flex items-center justify-between bg-muted/50 p-4 rounded-lg">
                <div>
                  <div className="text-sm font-medium">
                    {selectedInvoiceIds.length} invoice{selectedInvoiceIds.length !== 1 ? 's' : ''} selected
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total amount will be calculated after batch creation
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Link href="/dashboard/accounting/batches">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={createBatchMutation.isPending || selectedInvoiceIds.length === 0}
            size="lg"
          >
            {createBatchMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Batch {selectedInvoiceIds.length > 0 && `(${selectedInvoiceIds.length})`}
          </Button>
        </div>
      </form>
    </div>
  );
}


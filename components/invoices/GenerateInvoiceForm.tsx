'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate, apiUrl } from '@/lib/utils';
import { ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';

async function fetchDeliveredLoads() {
  const response = await fetch(
    apiUrl('/api/loads?status=DELIVERED&limit=100')
  );
  if (!response.ok) throw new Error('Failed to fetch loads');
  return response.json();
}

async function generateInvoice(data: {
  loadIds: string[];
  invoiceNumber?: string;
  dueDate?: string;
  notes?: string;
}) {
  const response = await fetch(apiUrl('/api/invoices/generate'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to generate invoice');
  }
  return response.json();
}

export default function GenerateInvoiceForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedLoads, setSelectedLoads] = useState<Set<string>>(new Set());
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['delivered-loads'],
    queryFn: fetchDeliveredLoads,
  });

  const generateMutation = useMutation({
    mutationFn: generateInvoice,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      if (data.data && data.data.length > 0) {
        router.push(`/dashboard/invoices/${data.data[0].id}`);
      }
    },
  });

  const loads = data?.data || [];
  const unassignedLoads = loads.filter(
    (load: any) => !load.invoiceId
  );

  const handleToggleLoad = (loadId: string) => {
    const newSelected = new Set(selectedLoads);
    if (newSelected.has(loadId)) {
      newSelected.delete(loadId);
    } else {
      newSelected.add(loadId);
    }
    setSelectedLoads(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedLoads.size === unassignedLoads.length) {
      setSelectedLoads(new Set());
    } else {
      setSelectedLoads(new Set(unassignedLoads.map((l: any) => l.id)));
    }
  };

  const handleGenerate = () => {
    if (selectedLoads.size === 0) {
      alert('Please select at least one load');
      return;
    }

    generateMutation.mutate({
      loadIds: Array.from(selectedLoads),
      invoiceNumber: invoiceNumber || undefined,
      notes: notes || undefined,
    });
  };

  const selectedTotal = unassignedLoads
    .filter((load: any) => selectedLoads.has(load.id))
    .reduce((sum: number, load: any) => sum + load.revenue, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/invoices">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-semibold">Generate Invoice</h2>
          <p className="text-sm text-muted-foreground">
            Select delivered loads to generate invoices
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Loads</CardTitle>
          <CardDescription>
            Choose loads that have been delivered but not yet invoiced
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading loads...</div>
          ) : unassignedLoads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No delivered loads available for invoicing
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={
                      selectedLoads.size === unassignedLoads.length &&
                      unassignedLoads.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                  />
                  <Label>
                    Select All ({unassignedLoads.length} loads)
                  </Label>
                </div>
                <div className="text-sm font-medium">
                  Selected Total: {formatCurrency(selectedTotal)}
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Load #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Delivered</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unassignedLoads.map((load: any) => (
                      <TableRow key={load.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedLoads.has(load.id)}
                            onCheckedChange={() =>
                              handleToggleLoad(load.id)
                            }
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {load.loadNumber}
                        </TableCell>
                        <TableCell>{load.customer.name}</TableCell>
                        <TableCell>
                          {load.pickupCity}, {load.pickupState} →{' '}
                          {load.deliveryCity}, {load.deliveryState}
                        </TableCell>
                        <TableCell>
                          {load.deliveredAt
                            ? formatDate(load.deliveredAt)
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(load.revenue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {selectedLoads.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Invoice Number (Optional)</Label>
              <Input
                id="invoiceNumber"
                placeholder="Auto-generated if left blank"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                placeholder="Add any notes for this invoice..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Link href="/dashboard/invoices">
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
              >
                <FileText className="h-4 w-4 mr-2" />
                {generateMutation.isPending
                  ? 'Generating...'
                  : `Generate Invoice${selectedLoads.size > 1 ? 's' : ''}`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


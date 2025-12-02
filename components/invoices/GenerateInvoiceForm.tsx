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
import { ArrowLeft, FileText, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
    // Create a custom error with full details
    const customError: any = new Error(error.error?.message || 'Failed to generate invoice');
    customError.errorDetails = error.error;
    customError.statusCode = response.status;
    throw customError;
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
      toast.success(`Successfully generated ${data.data?.length || 1} invoice(s)`);
      if (data.data && data.data.length > 0) {
        router.push(`/dashboard/invoices/${data.data[0].id}`);
      }
    },
    onError: (error: any) => {
      const errorDetails = error.errorDetails;
      const errorCode = errorDetails?.code;
      const errorMessage = errorDetails?.message || error.message || 'Failed to generate invoice';
      
      // Build detailed error message
      let detailedMessage = errorMessage;
      
      if (errorDetails?.details && Array.isArray(errorDetails.details) && errorDetails.details.length > 0) {
        const loadDetails = errorDetails.details
          .map((d: any) => `• Load ${d.loadNumber}: ${d.reason}`)
          .join('\n');
        detailedMessage = `${errorMessage}\n\n${loadDetails}`;
      }
      
      // Show toast with error
      toast.error(errorMessage, {
        description: errorDetails?.details 
          ? errorDetails.details.map((d: any) => `Load ${d.loadNumber}: ${d.reason}`).join('; ')
          : undefined,
        duration: 10000,
      });
      
      console.error('Invoice generation error:', {
        code: errorCode,
        message: errorMessage,
        details: errorDetails?.details,
        fullError: error,
      });
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
      toast.error('Please select at least one load');
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
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Load #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Dispatcher</TableHead>
                        <TableHead>Driver</TableHead>
                        <TableHead>Truck/Trailer</TableHead>
                        <TableHead>Delivered</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unassignedLoads.map((load: any) => {
                        const dispatcherName = load.dispatcher
                          ? `${load.dispatcher.firstName || ''} ${load.dispatcher.lastName || ''}`.trim()
                          : '-';
                        const dispatcherPhone = load.dispatcher?.phone || '';
                        
                        const driverName = load.driver?.user
                          ? `${load.driver.user.firstName || ''} ${load.driver.user.lastName || ''}`.trim()
                          : '-';
                        const driverNumber = load.driver?.driverNumber || '';
                        const driverPhone = load.driver?.user?.phone || '';
                        
                        const truckNumber = load.truck?.truckNumber || '-';
                        const trailerNumber = load.trailerNumber || '';
                        const truckTrailer = trailerNumber
                          ? `${truckNumber} / ${trailerNumber}`
                          : truckNumber;

                        return (
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
                              <div className="text-sm">
                                <div className="font-medium">{dispatcherName}</div>
                                {dispatcherPhone && (
                                  <div className="text-xs text-muted-foreground">
                                    {dispatcherPhone}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="font-medium">
                                  {driverName}
                                  {driverNumber && ` (#${driverNumber})`}
                                </div>
                                {driverPhone && (
                                  <div className="text-xs text-muted-foreground">
                                    {driverPhone}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {truckTrailer}
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
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
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

            {generateMutation.isError && generateMutation.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Generating Invoice</AlertTitle>
                <AlertDescription className="mt-2">
                  <div className="font-medium">
                    {(generateMutation.error as any).errorDetails?.message || generateMutation.error.message}
                  </div>
                  {(generateMutation.error as any).errorDetails?.details && (
                    <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                      {(generateMutation.error as any).errorDetails.details.map((detail: any, idx: number) => (
                        <li key={idx}>
                          <strong>Load {detail.loadNumber}:</strong> {detail.reason}
                        </li>
                      ))}
                    </ul>
                  )}
                </AlertDescription>
              </Alert>
            )}

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


'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, FileText, DollarSign, CheckCircle, AlertTriangle, Receipt, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { LoadStatus } from '@prisma/client';
import { apiUrl } from '@/lib/utils';
import DriverCombobox from '@/components/drivers/DriverCombobox';
import Link from 'next/link';

async function triggerLoadStatusUpdate() {
  const response = await fetch(apiUrl('/api/automation/load-status'), {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to update load statuses');
  return response.json();
}

async function fetchInvoiceReady() {
  const response = await fetch(apiUrl('/api/automation/invoice-ready'));
  if (!response.ok) throw new Error('Failed to fetch invoice-ready loads');
  return response.json();
}

async function fetchSettlementReady(driverId?: string) {
  const params = new URLSearchParams();
  if (driverId) params.set('driverId', driverId);
  const response = await fetch(apiUrl(`/api/automation/settlement-ready?${params.toString()}`));
  if (!response.ok) throw new Error('Failed to fetch settlement-ready loads');
  return response.json();
}

async function checkDocumentExpiry() {
  const response = await fetch(apiUrl('/api/automation/document-expiry'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ daysAhead: 30 }),
  });
  if (!response.ok) throw new Error('Failed to check document expiry');
  return response.json();
}

export default function AutomationPanel() {
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  const statusUpdateMutation = useMutation({
    mutationFn: triggerLoadStatusUpdate,
    onSuccess: (data) => {
      toast.success(`Updated ${data.data.updated} load status(es)`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update load statuses');
    },
  });

  const { data: invoiceData, refetch: refetchInvoices } = useQuery({
    queryKey: ['invoice-ready'],
    queryFn: fetchInvoiceReady,
  });

  const { data: settlementData, refetch: refetchSettlements } = useQuery({
    queryKey: ['settlement-ready', selectedDriverId],
    queryFn: () => fetchSettlementReady(selectedDriverId || undefined),
    enabled: false, // Only fetch when manually triggered
  });

  const documentExpiryMutation = useMutation({
    mutationFn: checkDocumentExpiry,
    onSuccess: (data) => {
      toast.success(`Checked ${data.data.totalChecked} documents. ${data.data.totalExpiring} expiring soon.`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to check document expiry');
    },
  });

  async function generateInvoices() {
    const response = await fetch(apiUrl('/api/automation/generate-invoices'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to generate invoices');
    return response.json();
  }

  const invoiceGenerationMutation = useMutation({
    mutationFn: generateInvoices,
    onSuccess: (data) => {
      toast.success(`Generated ${data.data.invoicesGenerated} invoice(s)!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to generate invoices');
    },
  });

  const handleUpdateStatuses = () => {
    statusUpdateMutation.mutate();
  };

  const handleCheckSettlements = () => {
    if (!selectedDriverId) {
      toast.error('Please select a driver');
      return;
    }
    refetchSettlements();
  };

  return (
    <div className="space-y-6">
      {/* Load Status Updates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Automated Load Status Updates
          </CardTitle>
          <CardDescription>
            Automatically update load statuses based on pickup and delivery dates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This will automatically update load statuses based on their scheduled dates.
            Loads past their pickup date will be marked as en route or loaded, and loads
            past their delivery date will be marked as delivered.
          </p>
          <Button
            onClick={handleUpdateStatuses}
            disabled={statusUpdateMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${statusUpdateMutation.isPending ? 'animate-spin' : ''}`} />
            {statusUpdateMutation.isPending ? 'Updating...' : 'Update Load Statuses'}
          </Button>
          {statusUpdateMutation.data && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                Updated <strong>{statusUpdateMutation.data.data.updated}</strong> load(s)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Ready */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Loads Ready for Invoicing
          </CardTitle>
          <CardDescription>
            Find delivered loads that haven't been invoiced yet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Loads that have been delivered but not yet invoiced
            </p>
            <Button variant="outline" size="sm" onClick={() => refetchInvoices()}>
              Refresh
            </Button>
          </div>
          {invoiceData?.data && (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {invoiceData.data.totalLoads} Loads
                </Badge>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {invoiceData.data.byCustomer.length} Customers
                </Badge>
              </div>
              {invoiceData.data.byCustomer.length > 0 && (
                <div className="border rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium mb-2">By Customer:</p>
                  {invoiceData.data.byCustomer.map((group: any) => (
                    <div
                      key={group.customer.id}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <div>
                        <p className="font-medium">{group.customer.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {group.loads.length} load(s)
                        </p>
                      </div>
                      <Badge variant="outline">
                        ${group.totalRevenue.toFixed(2)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
              {invoiceData.data.totalLoads === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No loads ready for invoicing
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settlement Ready */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Loads Ready for Settlement
          </CardTitle>
          <CardDescription>
            Find delivered loads ready for driver settlement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Driver</label>
            <DriverCombobox
              value={selectedDriverId}
              onValueChange={setSelectedDriverId}
              placeholder="Search for a driver..."
            />
          </div>
          <Button
            onClick={handleCheckSettlements}
            disabled={!selectedDriverId}
            variant="outline"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Check Settlement Ready
          </Button>
          {settlementData?.data && (
            <div className="p-3 bg-muted rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge variant="outline">
                    {settlementData.data.totalLoads} Loads
                  </Badge>
                  <Badge variant="outline">
                    ${settlementData.data.totalRevenue.toFixed(2)}
                  </Badge>
                </div>
                {settlementData.data.totalLoads > 0 && (
                  <Link href={`/dashboard/settlements?driverId=${selectedDriverId}`}>
                    <Button variant="outline" size="sm">
                      Go to Settlements
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                )}
              </div>
              {settlementData.data.loads.length > 0 && (
                <div className="mt-2 space-y-1">
                  {settlementData.data.loads.map((load: any) => (
                    <div
                      key={load.id}
                      className="flex items-center justify-between p-2 bg-background rounded text-sm"
                    >
                      <span>{load.loadNumber}</span>
                      <span className="font-medium">${load.revenue.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Expiry Check */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Document Expiry Check
          </CardTitle>
          <CardDescription>
            Check for expiring driver and truck documents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This will check all active drivers and trucks for documents expiring within the next 30 days
            and send notifications to relevant users.
          </p>
          <Button
            onClick={() => documentExpiryMutation.mutate()}
            disabled={documentExpiryMutation.isPending}
            variant="outline"
          >
            <AlertTriangle className={`h-4 w-4 mr-2 ${documentExpiryMutation.isPending ? 'animate-pulse' : ''}`} />
            {documentExpiryMutation.isPending ? 'Checking...' : 'Check Document Expiry'}
          </Button>
          {documentExpiryMutation.data && (
            <div className="p-3 bg-muted rounded-lg space-y-2">
              <div className="flex items-center gap-4">
                <Badge variant="outline">
                  {documentExpiryMutation.data.data.totalChecked} Checked
                </Badge>
                <Badge variant={documentExpiryMutation.data.data.totalExpiring > 0 ? 'destructive' : 'outline'}>
                  {documentExpiryMutation.data.data.totalExpiring} Expiring
                </Badge>
              </div>
              {documentExpiryMutation.data.data.drivers.expiring > 0 && (
                <div className="text-sm">
                  <strong>Drivers:</strong> {documentExpiryMutation.data.data.drivers.expiring} documents expiring
                </div>
              )}
              {documentExpiryMutation.data.data.trucks.expiring > 0 && (
                <div className="text-sm">
                  <strong>Trucks:</strong> {documentExpiryMutation.data.data.trucks.expiring} documents expiring
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Automated Invoice Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Automated Invoice Generation
          </CardTitle>
          <CardDescription>
            Generate invoices for delivered loads that haven't been invoiced
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This will automatically generate invoices for all delivered loads that are ready for invoicing.
            Loads will be grouped by customer and invoices will be created with a 30-day payment term.
          </p>
          <Button
            onClick={() => invoiceGenerationMutation.mutate()}
            disabled={invoiceGenerationMutation.isPending}
            variant="outline"
          >
            <Receipt className={`h-4 w-4 mr-2 ${invoiceGenerationMutation.isPending ? 'animate-pulse' : ''}`} />
            {invoiceGenerationMutation.isPending ? 'Generating...' : 'Generate Invoices'}
          </Button>
          {invoiceGenerationMutation.data && (
            <div className="p-3 bg-muted rounded-lg space-y-2">
              <div className="flex items-center gap-4">
                <Badge variant="outline">
                  {invoiceGenerationMutation.data.data.invoicesGenerated} Invoices Generated
                </Badge>
              </div>
              {invoiceGenerationMutation.data.data.errors.length > 0 && (
                <div className="text-sm text-destructive">
                  <strong>Errors:</strong>
                  <ul className="list-disc list-inside mt-1">
                    {invoiceGenerationMutation.data.data.errors.map((error: string, idx: number) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


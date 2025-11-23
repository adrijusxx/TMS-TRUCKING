'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDateTime, apiUrl } from '@/lib/utils';
import {
  DollarSign,
  Receipt,
  FileText,
  Fuel,
  Wrench,
  FileCheck,
  Building2,
  Calendar,
  MapPin,
  Package,
  CreditCard,
  Truck,
} from 'lucide-react';
import Link from 'next/link';

interface DriverPaymentsActivityProps {
  driverId: string;
}

interface Payment {
  id: string;
  paymentNumber: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  type: string;
  activityType: 'FUEL' | 'BREAKDOWN' | 'INVOICE';
  referenceNumber?: string | null;
  hasReceipt: boolean;
  hasInvoice: boolean;
  documentIds: string[];
  notes?: string | null;
  mcNumber?: {
    id: string;
    number: string;
    companyName?: string | null;
  } | null;
  fuelEntry?: {
    id: string;
    date: string;
    totalCost: number;
    location?: string | null;
    truck: {
      truckNumber: string;
    };
  } | null;
  breakdown?: {
    id: string;
    breakdownNumber: string;
    totalCost: number;
    location?: string | null;
    reportedAt: string;
    truck: {
      truckNumber: string;
    };
  } | null;
  invoice?: {
    id: string;
    invoiceNumber: string;
    total: number;
    invoiceDate: string;
    customer: {
      name: string;
    };
    loads: Array<{
      id: string;
      loadNumber: string;
    }>;
  } | null;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export default function DriverPaymentsActivity({ driverId }: DriverPaymentsActivityProps) {
  const { data, isLoading, error } = useQuery<{
    success: boolean;
    data: Payment[];
    meta: {
      total: number;
      fuelCount: number;
      breakdownCount: number;
      invoiceCount: number;
    };
  }>({
    queryKey: ['driver-payments', driverId],
    queryFn: async () => {
      const response = await fetch(apiUrl(`/api/drivers/${driverId}/payments`));
      if (!response.ok) throw new Error('Failed to fetch driver payments');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payments & Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading payments...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payments & Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error loading payments: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </CardContent>
      </Card>
    );
  }

  const payments = data?.data || [];
  const meta = data?.meta || { total: 0, fuelCount: 0, breakdownCount: 0, invoiceCount: 0 };

  const fuelPayments = payments.filter((p) => p.activityType === 'FUEL');
  const breakdownPayments = payments.filter((p) => p.activityType === 'BREAKDOWN');
  const invoicePayments = payments.filter((p) => p.activityType === 'INVOICE');

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'CREDIT_CARD':
      case 'DEBIT_CARD':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <Receipt className="h-4 w-4" />;
    }
  };

  const renderPaymentCard = (payment: Payment) => {
    let activityLink = '#';
    let activityTitle = '';
    let activityDetails: React.ReactNode = null;

    if (payment.activityType === 'FUEL' && payment.fuelEntry) {
      activityLink = `/dashboard/fleet/fuel/${payment.fuelEntry.id}`;
      activityTitle = 'Fuel Entry';
      activityDetails = (
        <>
          <div className="flex items-center gap-2 text-sm">
            <Truck className="h-3 w-3 text-muted-foreground" />
            <span>{payment.fuelEntry.truck.truckNumber}</span>
          </div>
          {payment.fuelEntry.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span>{payment.fuelEntry.location}</span>
            </div>
          )}
        </>
      );
    } else if (payment.activityType === 'BREAKDOWN' && payment.breakdown) {
      activityLink = `/dashboard/fleet/breakdowns/${payment.breakdown.id}`;
      activityTitle = 'Breakdown';
      activityDetails = (
        <>
          <div className="flex items-center gap-2 text-sm">
            <Truck className="h-3 w-3 text-muted-foreground" />
            <span>{payment.breakdown.truck.truckNumber}</span>
          </div>
          {payment.breakdown.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span>{payment.breakdown.location}</span>
            </div>
          )}
        </>
      );
    } else if (payment.activityType === 'INVOICE' && payment.invoice) {
      activityLink = `/dashboard/invoices/${payment.invoice.id}`;
      activityTitle = 'Invoice';
      activityDetails = (
        <>
          <div className="text-sm">
            <span className="font-medium">{payment.invoice.customer.name}</span>
          </div>
          {payment.invoice.loads.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Package className="h-3 w-3 text-muted-foreground" />
              <span>
                {payment.invoice.loads.map((l) => l.loadNumber).join(', ')}
              </span>
            </div>
          )}
        </>
      );
    }

    return (
      <div
        key={payment.id}
        className="border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {payment.activityType === 'FUEL' && <Fuel className="h-4 w-4 text-blue-500" />}
            {payment.activityType === 'BREAKDOWN' && <Wrench className="h-4 w-4 text-orange-500" />}
            {payment.activityType === 'INVOICE' && <FileText className="h-4 w-4 text-green-500" />}
            <Badge variant="outline">{activityTitle}</Badge>
            {payment.mcNumber && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                MC: {payment.mcNumber.number}
              </Badge>
            )}
          </div>
          <div className="text-right">
            <div className="font-bold text-lg">{formatCurrency(payment.amount)}</div>
            <div className="text-xs text-muted-foreground">
              {formatDateTime(payment.paymentDate)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            {getPaymentMethodIcon(payment.paymentMethod)}
            <span className="text-muted-foreground">Method:</span>
            <span>{payment.paymentMethod.replace(/_/g, ' ')}</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Payment #:</span>
            <span className="font-mono">{payment.paymentNumber}</span>
          </div>
          {payment.referenceNumber && (
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Reference:</span>
              <span>{payment.referenceNumber}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            {payment.hasReceipt ? (
              <FileCheck className="h-4 w-4 text-green-500" />
            ) : (
              <Receipt className="h-4 w-4 text-gray-400" />
            )}
            <span className={payment.hasReceipt ? '' : 'text-muted-foreground'}>
              {payment.hasReceipt ? 'Receipt Available' : 'No Receipt'}
            </span>
          </div>
          {payment.documentIds && payment.documentIds.length > 0 && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <span>{payment.documentIds.length} document(s)</span>
            </div>
          )}
        </div>

        {activityDetails && (
          <div className="pt-2 border-t space-y-1">
            <Link href={activityLink}>
              <Button variant="link" className="h-auto p-0 text-xs">
                View {activityTitle} →
              </Button>
            </Link>
            {activityDetails}
          </div>
        )}

        {payment.notes && (
          <p className="text-sm text-muted-foreground pt-2 border-t">
            <span className="font-medium">Notes:</span> {payment.notes}
          </p>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Payments & Activity Documents
        </CardTitle>
        <CardDescription>
          Track all payments and documents related to this driver's activities (fuel, breakdowns, invoices)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              All ({meta.total})
            </TabsTrigger>
            <TabsTrigger value="fuel">
              Fuel ({meta.fuelCount})
            </TabsTrigger>
            <TabsTrigger value="breakdown">
              Breakdown ({meta.breakdownCount})
            </TabsTrigger>
            <TabsTrigger value="invoice">
              Invoice ({meta.invoiceCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4 mt-4">
            {payments.length > 0 ? (
              payments.map(renderPaymentCard)
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No payments recorded for this driver yet.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="fuel" className="space-y-4 mt-4">
            {fuelPayments.length > 0 ? (
              fuelPayments.map(renderPaymentCard)
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Fuel className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No fuel payments recorded for this driver yet.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="breakdown" className="space-y-4 mt-4">
            {breakdownPayments.length > 0 ? (
              breakdownPayments.map(renderPaymentCard)
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Wrench className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No breakdown payments recorded for this driver yet.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="invoice" className="space-y-4 mt-4">
            {invoicePayments.length > 0 ? (
              invoicePayments.map(renderPaymentCard)
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No invoice payments recorded for this driver yet.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}


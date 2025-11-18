'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, DollarSign, CheckCircle, Clock } from 'lucide-react';
import { formatCurrency, apiUrl } from '@/lib/utils';

interface InvoiceListStatsProps {
  filters?: Record<string, any>;
}

async function fetchInvoiceStats(filters?: Record<string, any>) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value.toString());
    });
  }
  const response = await fetch(apiUrl(`/api/invoices/stats?${params.toString()}`));
  if (!response.ok) throw new Error('Failed to fetch invoice stats');
  return response.json();
}

export default function InvoiceListStats({ filters }: InvoiceListStatsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['invoice-stats', filters],
    queryFn: () => fetchInvoiceStats(filters),
  });

  const stats = data?.data || {
    totalInvoices: 0,
    paidInvoices: 0,
    draftInvoices: 0,
    totalAmount: 0,
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="h-16 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Invoices</p>
              <p className="text-2xl font-bold">{stats.totalInvoices}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Paid</p>
              <p className="text-2xl font-bold text-green-600">{stats.paidInvoices}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Draft</p>
              <p className="text-2xl font-bold text-orange-600">{stats.draftInvoices}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-emerald-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, DollarSign, TrendingUp, Package } from 'lucide-react';
import { formatCurrency, apiUrl } from '@/lib/utils';

interface CustomerListStatsProps {
  filters?: Record<string, any>;
}

async function fetchCustomerStats(filters?: Record<string, any>) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value.toString());
    });
  }
  const response = await fetch(apiUrl(`/api/customers/stats?${params.toString()}`));
  if (!response.ok) throw new Error('Failed to fetch customer stats');
  return response.json();
}

export default function CustomerListStats({ filters }: CustomerListStatsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['customer-stats', filters],
    queryFn: () => fetchCustomerStats(filters),
  });

  const stats = data?.data || {
    totalCustomers: 0,
    activeCustomers: 0,
    totalRevenue: 0,
    totalLoads: 0,
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
              <p className="text-sm text-muted-foreground">Total Customers</p>
              <p className="text-2xl font-bold">{stats.totalCustomers}</p>
            </div>
            <Building2 className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Customers</p>
              <p className="text-2xl font-bold text-green-600">{stats.activeCustomers}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-emerald-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Loads</p>
              <p className="text-2xl font-bold">{stats.totalLoads}</p>
            </div>
            <Package className="h-8 w-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


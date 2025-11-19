'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, TrendingUp, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { formatCurrency, apiUrl } from '@/lib/utils';

interface CustomerPerformance {
  totalCustomers: number;
  activeCustomers: number;
  topCustomers: Array<{
    id: string;
    name: string;
    revenue: number;
    loadsCompleted: number;
    averageRevenuePerLoad: number;
    onTimeRate: number;
  }>;
  totalRevenue: number;
  averageRevenuePerCustomer: number;
}

async function fetchCustomerPerformance() {
  const response = await fetch(apiUrl('/api/dashboard/customer-performance'));
  if (!response.ok) throw new Error('Failed to fetch customer performance');
  return response.json();
}

export default function CustomerPerformanceMetrics() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['customer-performance'],
    queryFn: fetchCustomerPerformance,
    retry: 2,
    staleTime: 60000, // Cache for 1 minute
  });

  const performance: CustomerPerformance = data?.data || {
    totalCustomers: 0,
    activeCustomers: 0,
    topCustomers: [],
    totalRevenue: 0,
    averageRevenuePerCustomer: 0,
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Customer Performance
            </CardTitle>
            <CardDescription>Top customers and revenue metrics</CardDescription>
          </div>
          <Link href="/dashboard/customers">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            Loading customer data...
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-sm text-destructive mb-2">
              Failed to load customer performance data
            </p>
            <p className="text-xs text-muted-foreground">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold">{performance.totalCustomers}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Customers</p>
                <p className="text-2xl font-bold text-green-600">
                  {performance.activeCustomers}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-xl font-bold">{formatCurrency(performance.totalRevenue)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg per Customer</p>
                <p className="text-xl font-bold">
                  {formatCurrency(performance.averageRevenuePerCustomer)}
                </p>
              </div>
            </div>

            {performance.topCustomers.length > 0 && (
              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <p className="text-sm font-medium">Top Customers by Revenue</p>
                </div>
                <div className="space-y-2">
                  {performance.topCustomers.slice(0, 5).map((customer, index) => (
                    <Link
                      key={customer.id}
                      href={`/dashboard/customers/${customer.id}`}
                      className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{customer.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {customer.loadsCompleted} loads • {customer.onTimeRate.toFixed(0)}% on-time
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">{formatCurrency(customer.revenue)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(customer.averageRevenuePerLoad)}/load
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


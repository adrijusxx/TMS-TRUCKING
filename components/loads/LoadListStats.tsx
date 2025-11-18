'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Package, DollarSign, Truck, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface LoadListStatsProps {
  filters?: Record<string, any>;
}

async function fetchLoadStats(filters?: Record<string, any>) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value.toString());
    });
  }
  const response = await fetch(`/api/loads/stats?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch load stats');
  return response.json();
}

export default function LoadListStats({ filters }: LoadListStatsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['load-stats', filters],
    queryFn: () => fetchLoadStats(filters),
  });

  const stats = data?.data || {
    totalLoads: 0,
    totalRevenue: 0,
    activeLoads: 0,
    averageRevenue: 0,
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
              <p className="text-sm text-muted-foreground">Total Loads</p>
              <p className="text-2xl font-bold">{stats.totalLoads}</p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
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
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Loads</p>
              <p className="text-2xl font-bold">{stats.activeLoads}</p>
            </div>
            <Truck className="h-8 w-8 text-orange-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.averageRevenue)}</p>
            </div>
            <Clock className="h-8 w-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


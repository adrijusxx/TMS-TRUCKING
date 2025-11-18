'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Truck, CheckCircle, Wrench, AlertCircle } from 'lucide-react';
import { apiUrl } from '@/lib/utils';

interface TruckListStatsProps {
  filters?: Record<string, any>;
}

async function fetchTruckStats(filters?: Record<string, any>) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value.toString());
    });
  }
  const response = await fetch(apiUrl(`/api/trucks/stats?${params.toString()}`));
  if (!response.ok) throw new Error('Failed to fetch truck stats');
  return response.json();
}

export default function TruckListStats({ filters }: TruckListStatsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['truck-stats', filters],
    queryFn: () => fetchTruckStats(filters),
  });

  const stats = data?.data || {
    totalTrucks: 0,
    availableTrucks: 0,
    inUseTrucks: 0,
    maintenanceTrucks: 0,
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
              <p className="text-sm text-muted-foreground">Total Trucks</p>
              <p className="text-2xl font-bold">{stats.totalTrucks}</p>
            </div>
            <Truck className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Available</p>
              <p className="text-2xl font-bold text-green-600">{stats.availableTrucks}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">In Use</p>
              <p className="text-2xl font-bold text-orange-600">{stats.inUseTrucks}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Maintenance</p>
              <p className="text-2xl font-bold text-red-600">{stats.maintenanceTrucks}</p>
            </div>
            <Wrench className="h-8 w-8 text-red-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


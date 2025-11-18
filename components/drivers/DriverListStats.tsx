'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Users, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { apiUrl } from '@/lib/utils';

interface DriverListStatsProps {
  filters?: Record<string, any>;
}

async function fetchDriverStats(filters?: Record<string, any>) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value.toString());
    });
  }
  const response = await fetch(apiUrl(`/api/drivers/stats?${params.toString()}`));
  if (!response.ok) throw new Error('Failed to fetch driver stats');
  return response.json();
}

export default function DriverListStats({ filters }: DriverListStatsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['driver-stats', filters],
    queryFn: () => fetchDriverStats(filters),
  });

  const stats = data?.data || {
    totalDrivers: 0,
    availableDrivers: 0,
    onDutyDrivers: 0,
    averageRating: 0,
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
              <p className="text-sm text-muted-foreground">Total Drivers</p>
              <p className="text-2xl font-bold">{stats.totalDrivers}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Available</p>
              <p className="text-2xl font-bold text-green-600">{stats.availableDrivers}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">On Duty</p>
              <p className="text-2xl font-bold text-orange-600">{stats.onDutyDrivers}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Rating</p>
              <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


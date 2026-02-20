'use client';

import { Card, CardContent } from '@/components/ui/card';
import { UserX, Truck, Container, ShieldOff } from 'lucide-react';
import type { FleetMonitoringSnapshot } from '@/lib/managers/fleet-monitoring/types';

interface Props {
  data: FleetMonitoringSnapshot | null;
  loading: boolean;
}

export default function MonitoringStatsCards({ data, loading }: Props) {
  const stats = [
    {
      label: 'Idle Drivers',
      value: data?.summary.totalIdleDrivers ?? 0,
      sub: data?.summary.averageIdleHours
        ? `Avg ${data.summary.averageIdleHours}h idle`
        : undefined,
      icon: UserX,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      label: 'Dormant Trucks',
      value: data?.summary.totalDormantTrucks ?? 0,
      sub: undefined,
      icon: Truck,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      label: 'Dormant Trailers',
      value: data?.summary.totalDormantTrailers ?? 0,
      sub: undefined,
      icon: Container,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      label: 'Excluded (OOS)',
      value: (data?.excludedOOS.trucks ?? 0) + (data?.excludedOOS.trailers ?? 0),
      sub: data
        ? `${data.excludedOOS.trucks} trucks, ${data.excludedOOS.trailers} trailers`
        : undefined,
      icon: ShieldOff,
      color: 'text-slate-600',
      bgColor: 'bg-slate-50',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="h-16 animate-pulse bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                {stat.sub && (
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

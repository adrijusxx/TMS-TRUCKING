'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Truck, Users, Container, TrendingUp } from 'lucide-react';
import FleetUtilizationChart from './FleetUtilizationChart';
import FleetUtilizationTable from './FleetUtilizationTable';
import type { FleetUtilizationPeriod } from '@/lib/managers/fleet-monitoring/types';

export default function FleetUtilizationDashboard() {
  const [period, setPeriod] = useState<'daily' | 'weekly'>('daily');
  const [rangeDays, setRangeDays] = useState(30);
  const [data, setData] = useState<FleetUtilizationPeriod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/analytics/fleet-utilization?period=${period}&range=${rangeDays}`
        );
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (error) {
        console.error('Failed to fetch utilization data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [period, rangeDays]);

  // Compute averages from data
  const avgTruck = data.length > 0
    ? Math.round(data.reduce((s, d) => s + d.truckUtilizationRate, 0) / data.length)
    : 0;
  const avgTrailer = data.length > 0
    ? Math.round(data.reduce((s, d) => s + d.trailerUtilizationRate, 0) / data.length)
    : 0;
  const avgDriver = data.length > 0
    ? Math.round(data.reduce((s, d) => s + d.driverUtilizationRate, 0) / data.length)
    : 0;
  const latestTrucks = data.length > 0 ? data[data.length - 1].totalTrucks : 0;
  const latestTrailers = data.length > 0 ? data[data.length - 1].totalTrailers : 0;
  const latestDrivers = data.length > 0 ? data[data.length - 1].totalDrivers : 0;

  const summaryCards = [
    { label: 'Avg Truck Utilization', value: `${avgTruck}%`, total: latestTrucks, icon: Truck, color: 'text-blue-600' },
    { label: 'Avg Trailer Utilization', value: `${avgTrailer}%`, total: latestTrailers, icon: Container, color: 'text-purple-600' },
    { label: 'Avg Driver Utilization', value: `${avgDriver}%`, total: latestDrivers, icon: Users, color: 'text-green-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Period Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button
            variant={period === 'daily' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setPeriod('daily')}
          >
            Daily
          </Button>
          <Button
            variant={period === 'weekly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setPeriod('weekly')}
          >
            Weekly
          </Button>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {[14, 30, 60, 90].map((days) => (
            <Button
              key={days}
              variant={rangeDays === days ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setRangeDays(days)}
            >
              {days}d
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <card.icon className={`h-8 w-8 ${card.color}`} />
                <div>
                  <p className="text-2xl font-bold">{loading ? '—' : card.value}</p>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="text-xs text-muted-foreground">{card.total} total fleet</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <FleetUtilizationChart data={data} loading={loading} period={period} />

      {/* Table */}
      <FleetUtilizationTable data={data} loading={loading} />
    </div>
  );
}

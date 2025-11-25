'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, TrendingUp, Truck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface CompletionMetrics {
  completedToday: number;
  completedThisWeek: number;
  avgCompletionTime: number; // in hours
  onTimePercentage: number;
  trucksAvailable: number;
  pendingPOD: number;
}

export function LoadCompletionMetrics() {
  const [metrics, setMetrics] = useState<CompletionMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
    // Refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      // TODO: Create API endpoint for completion metrics
      // For now, using mock data
      setMetrics({
        completedToday: 12,
        completedThisWeek: 67,
        avgCompletionTime: 4.5,
        onTimePercentage: 94,
        trucksAvailable: 8,
        pendingPOD: 3,
      });
    } catch (error) {
      console.error('Error fetching completion metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics?.completedToday || 0}</div>
          <p className="text-xs text-muted-foreground">
            {metrics?.completedThisWeek || 0} this week
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">On-Time Delivery</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {metrics?.onTimePercentage || 0}%
          </div>
          <p className="text-xs text-muted-foreground">Last 30 days</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Trucks Available</CardTitle>
          <Truck className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics?.trucksAvailable || 0}</div>
          <p className="text-xs text-muted-foreground">Ready for dispatch</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending POD</CardTitle>
          <Clock className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{metrics?.pendingPOD || 0}</div>
          <p className="text-xs text-muted-foreground">Awaiting proof of delivery</p>
        </CardContent>
      </Card>
    </div>
  );
}






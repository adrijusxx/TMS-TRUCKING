'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { useQuery } from '@tanstack/react-query';
import { getTopDrivers } from '@/lib/actions/hr';
import { Skeleton } from '@/components/ui/skeleton';

export function DriverPerformanceMetrics() {
  const { data, isLoading } = useQuery({
    queryKey: ['top-drivers'],
    queryFn: () => getTopDrivers(),
  });

  const drivers = data?.data || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Driver Performance Rankings</CardTitle>
        <CardDescription>Top performing drivers based on revenue matches (Delivered)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : drivers.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">No load data available</div>
          ) : (
            drivers.map((driver: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-muted-foreground w-8">#{index + 1}</div>
                  <div>
                    <p className="font-medium">{driver.name}</p>
                    <p className="text-sm text-muted-foreground">{driver.loads} loads completed</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <p className="font-bold">${driver.revenue.toLocaleString()}</p>
                  </div>
                  {/* OnTime and Rating are placeholders in backend for now */}
                  <div className="text-right hidden sm:block">
                    <p className="text-sm text-muted-foreground">Est. On-Time</p>
                    <p className="font-bold text-green-600">{driver.onTime}%</p>
                  </div>
                  <Badge className="bg-green-500 hidden sm:flex">{driver.rating}</Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}






'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { getTopDrivers } from '@/lib/actions/hr';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';

export function DriverPerformanceMetrics() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['top-drivers'],
    queryFn: () => getTopDrivers(),
  });

  const drivers = data?.data || [];

  const filteredDrivers = useMemo(() => {
    if (!searchTerm.trim()) return drivers;
    const term = searchTerm.toLowerCase();
    return drivers.filter((driver: any) =>
      driver.name.toLowerCase().includes(term)
    );
  }, [drivers, searchTerm]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Driver Performance Rankings</CardTitle>
        <CardDescription>Top performing drivers based on revenue matches (Delivered)</CardDescription>
      </CardHeader>
      <div className="px-6 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search drivers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredDrivers.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              {searchTerm ? 'No drivers match your search' : 'No load data available'}
            </div>
          ) : (
            filteredDrivers.map((driver: any, index: number) => (
              <div key={driver.id || index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
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

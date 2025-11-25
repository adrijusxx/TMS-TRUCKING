'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function DriverPerformanceMetrics() {
  // Mock data - would be fetched from API
  const drivers = [
    { name: 'John Smith', loads: 45, revenue: 125000, onTime: 98, rating: 'Excellent' },
    { name: 'Jane Doe', loads: 42, revenue: 118000, onTime: 95, rating: 'Excellent' },
    { name: 'Mike Johnson', loads: 38, revenue: 98000, onTime: 92, rating: 'Good' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Driver Performance Rankings</CardTitle>
        <CardDescription>Top performing drivers based on loads, revenue, and on-time delivery</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {drivers.map((driver, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="text-2xl font-bold text-muted-foreground">#{index + 1}</div>
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
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">On-Time</p>
                  <p className="font-bold text-green-600">{driver.onTime}%</p>
                </div>
                <Badge className="bg-green-500">{driver.rating}</Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}






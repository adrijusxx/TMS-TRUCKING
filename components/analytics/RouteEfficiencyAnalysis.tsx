'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface RouteEfficiency {
  routeName: string;
  totalLoads: number;
  avgMiles: number;
  deadheadMiles: number;
  deadheadPercentage: number;
  avgRevenue: number;
  revenuePerMile: number;
  efficiency: 'high' | 'medium' | 'low';
}

export function RouteEfficiencyAnalysis() {
  const [routes, setRoutes] = useState<RouteEfficiency[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRouteEfficiency();
  }, []);

  const fetchRouteEfficiency = async () => {
    try {
      // TODO: Implement API endpoint
      const mockData: RouteEfficiency[] = [
        {
          routeName: 'Los Angeles → Dallas',
          totalLoads: 45,
          avgMiles: 1380,
          deadheadMiles: 120,
          deadheadPercentage: 8.7,
          avgRevenue: 3200,
          revenuePerMile: 2.32,
          efficiency: 'high',
        },
        {
          routeName: 'Chicago → Atlanta',
          totalLoads: 38,
          avgMiles: 715,
          deadheadMiles: 95,
          deadheadPercentage: 13.3,
          avgRevenue: 1850,
          revenuePerMile: 2.59,
          efficiency: 'high',
        },
        {
          routeName: 'New York → Miami',
          totalLoads: 32,
          avgMiles: 1280,
          deadheadMiles: 256,
          deadheadPercentage: 20.0,
          avgRevenue: 2900,
          revenuePerMile: 2.27,
          efficiency: 'medium',
        },
      ];
      setRoutes(mockData);
    } catch (error) {
      console.error('Error fetching route efficiency:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEfficiencyBadge = (efficiency: string) => {
    if (efficiency === 'high') return <Badge className="bg-green-500">High Efficiency</Badge>;
    if (efficiency === 'medium') return <Badge className="bg-yellow-500">Medium</Badge>;
    return <Badge variant="destructive">Low Efficiency</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Route Efficiency Analysis</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const avgDeadhead =
    routes.reduce((sum, r) => sum + r.deadheadPercentage, 0) / routes.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Route Efficiency & Deadhead Analysis</CardTitle>
        <CardDescription>Optimize routes and reduce empty miles</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Summary Metrics */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Avg Deadhead %</p>
            <p className="text-2xl font-bold text-red-600">{avgDeadhead.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Target: &lt;10%</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Best Route</p>
            <p className="text-lg font-bold">{routes[0]?.routeName}</p>
            <p className="text-xs text-green-600">{routes[0]?.deadheadPercentage.toFixed(1)}% deadhead</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Avg Revenue/Mile</p>
            <p className="text-2xl font-bold text-green-600">
              ${(routes.reduce((sum, r) => sum + r.revenuePerMile, 0) / routes.length).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Route Table */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-medium">Route</th>
                <th className="text-right p-3 font-medium">Loads</th>
                <th className="text-right p-3 font-medium">Avg Miles</th>
                <th className="text-right p-3 font-medium">Deadhead</th>
                <th className="text-right p-3 font-medium">Deadhead %</th>
                <th className="text-right p-3 font-medium">$/Mile</th>
                <th className="text-center p-3 font-medium">Efficiency</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((route) => (
                <tr key={route.routeName} className="border-t hover:bg-muted/50">
                  <td className="p-3 font-medium">{route.routeName}</td>
                  <td className="p-3 text-right">{route.totalLoads}</td>
                  <td className="p-3 text-right">{route.avgMiles.toLocaleString()}</td>
                  <td className="p-3 text-right text-red-600">
                    {route.deadheadMiles.toLocaleString()}
                  </td>
                  <td className="p-3 text-right">
                    <span
                      className={`font-medium ${
                        route.deadheadPercentage < 10
                          ? 'text-green-600'
                          : route.deadheadPercentage < 15
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {route.deadheadPercentage.toFixed(1)}%
                    </span>
                  </td>
                  <td className="p-3 text-right font-bold text-green-600">
                    ${route.revenuePerMile.toFixed(2)}
                  </td>
                  <td className="p-3 text-center">{getEfficiencyBadge(route.efficiency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Optimization Recommendations */}
        <div className="mt-6 p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950">
          <h4 className="font-semibold mb-2">Optimization Opportunities</h4>
          <ul className="space-y-1 text-sm">
            <li>• NY → Miami route has 20% deadhead - consider backhaul opportunities</li>
            <li>• LA → Dallas route is most efficient - increase volume on this lane</li>
            <li>• Overall deadhead of {avgDeadhead.toFixed(1)}% - target reduction to &lt;10%</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}






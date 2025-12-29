'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface LoadProfitability {
  loadNumber: string;
  revenue: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
  customer: string;
  deliveredAt: string;
}

export function LoadProfitabilityChart() {
  const [loads, setLoads] = useState<LoadProfitability[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    fetchLoadProfitability();
  }, [timeRange]);

  const fetchLoadProfitability = async () => {
    try {
      // TODO: Implement API endpoint
      // For now, using mock data
      const mockData: LoadProfitability[] = [
        {
          loadNumber: 'L-2025-001',
          revenue: 3500,
          totalCost: 2800,
          profit: 700,
          profitMargin: 20,
          customer: 'ABC Logistics',
          deliveredAt: '2025-11-20',
        },
        {
          loadNumber: 'L-2025-002',
          revenue: 4200,
          totalCost: 3600,
          profit: 600,
          profitMargin: 14.3,
          customer: 'XYZ Freight',
          deliveredAt: '2025-11-21',
        },
        {
          loadNumber: 'L-2025-003',
          revenue: 2800,
          totalCost: 2400,
          profit: 400,
          profitMargin: 14.3,
          customer: 'Global Shipping',
          deliveredAt: '2025-11-22',
        },
      ];
      setLoads(mockData);
    } catch (error) {
      console.error('Error fetching load profitability:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProfitColor = (margin: number) => {
    if (margin >= 20) return 'text-green-600';
    if (margin >= 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProfitBadge = (margin: number) => {
    if (margin >= 20) return <Badge className="bg-green-500">Excellent</Badge>;
    if (margin >= 10) return <Badge className="bg-yellow-500">Good</Badge>;
    return <Badge variant="destructive">Low</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Load Profitability Analysis</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const totalRevenue = loads.reduce((sum, load) => sum + load.revenue, 0);
  const totalCost = loads.reduce((sum, load) => sum + load.totalCost, 0);
  const totalProfit = loads.reduce((sum, load) => sum + load.profit, 0);
  const avgMargin = (totalProfit / totalRevenue) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Load Profitability Analysis</CardTitle>
            <CardDescription>Revenue, costs, and profit margins by load</CardDescription>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Total Costs</p>
            <p className="text-2xl font-bold text-red-600">${totalCost.toLocaleString()}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Total Profit</p>
            <p className="text-2xl font-bold text-green-600">${totalProfit.toLocaleString()}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Avg Margin</p>
            <p className={`text-2xl font-bold ${getProfitColor(avgMargin)}`}>
              {avgMargin.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Load Details Table */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-medium">Load #</th>
                <th className="text-left p-3 font-medium">Customer</th>
                <th className="text-right p-3 font-medium">Revenue</th>
                <th className="text-right p-3 font-medium">Costs</th>
                <th className="text-right p-3 font-medium">Profit</th>
                <th className="text-right p-3 font-medium">Margin</th>
                <th className="text-center p-3 font-medium">Rating</th>
                <th className="text-left p-3 font-medium">Delivered</th>
              </tr>
            </thead>
            <tbody>
              {loads.map((load) => (
                <tr key={load.loadNumber} className="border-t hover:bg-muted/50">
                  <td className="p-3 font-medium">{load.loadNumber}</td>
                  <td className="p-3">{load.customer}</td>
                  <td className="p-3 text-right">${load.revenue.toLocaleString()}</td>
                  <td className="p-3 text-right text-red-600">
                    ${load.totalCost.toLocaleString()}
                  </td>
                  <td className="p-3 text-right text-green-600 font-medium">
                    ${load.profit.toLocaleString()}
                  </td>
                  <td className={`p-3 text-right font-bold ${getProfitColor(load.profitMargin)}`}>
                    {load.profitMargin.toFixed(1)}%
                  </td>
                  <td className="p-3 text-center">{getProfitBadge(load.profitMargin)}</td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {new Date(load.deliveredAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}






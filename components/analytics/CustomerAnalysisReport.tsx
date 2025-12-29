'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign } from 'lucide-react';

interface CustomerAnalysis {
  customerName: string;
  totalLoads: number;
  totalRevenue: number;
  avgRevenuePerLoad: number;
  profitMargin: number;
  paymentTerms: string;
  avgPaymentDays: number;
  rating: 'A' | 'B' | 'C';
}

export function CustomerAnalysisReport() {
  const [customers, setCustomers] = useState<CustomerAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerAnalysis();
  }, []);

  const fetchCustomerAnalysis = async () => {
    try {
      // TODO: Implement API endpoint
      const mockData: CustomerAnalysis[] = [
        {
          customerName: 'ABC Logistics',
          totalLoads: 125,
          totalRevenue: 425000,
          avgRevenuePerLoad: 3400,
          profitMargin: 22,
          paymentTerms: 'Net 30',
          avgPaymentDays: 28,
          rating: 'A',
        },
        {
          customerName: 'XYZ Freight',
          totalLoads: 98,
          totalRevenue: 385000,
          avgRevenuePerLoad: 3929,
          profitMargin: 18,
          paymentTerms: 'Net 45',
          avgPaymentDays: 42,
          rating: 'B',
        },
        {
          customerName: 'Global Shipping',
          totalLoads: 76,
          totalRevenue: 298000,
          avgRevenuePerLoad: 3921,
          profitMargin: 20,
          paymentTerms: 'Net 30',
          avgPaymentDays: 30,
          rating: 'A',
        },
      ];
      setCustomers(mockData);
    } catch (error) {
      console.error('Error fetching customer analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRatingBadge = (rating: string) => {
    if (rating === 'A') return <Badge className="bg-green-500">A - Excellent</Badge>;
    if (rating === 'B') return <Badge className="bg-blue-500">B - Good</Badge>;
    return <Badge className="bg-yellow-500">C - Average</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Analysis</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const totalRevenue = customers.reduce((sum, c) => sum + c.totalRevenue, 0);
  const totalLoads = customers.reduce((sum, c) => sum + c.totalLoads, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Profitability Analysis</CardTitle>
        <CardDescription>Revenue, volume, and payment performance by customer</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Total Customers</p>
            <p className="text-2xl font-bold">{customers.length}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Total Revenue</p>
            <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Total Loads</p>
            <p className="text-2xl font-bold">{totalLoads}</p>
          </div>
        </div>

        {/* Customer Table */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-medium">Customer</th>
                <th className="text-right p-3 font-medium">Loads</th>
                <th className="text-right p-3 font-medium">Revenue</th>
                <th className="text-right p-3 font-medium">Avg/Load</th>
                <th className="text-right p-3 font-medium">Margin</th>
                <th className="text-center p-3 font-medium">Payment</th>
                <th className="text-center p-3 font-medium">Rating</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.customerName} className="border-t hover:bg-muted/50">
                  <td className="p-3 font-medium">{customer.customerName}</td>
                  <td className="p-3 text-right">{customer.totalLoads}</td>
                  <td className="p-3 text-right font-bold">
                    ${customer.totalRevenue.toLocaleString()}
                  </td>
                  <td className="p-3 text-right">${customer.avgRevenuePerLoad.toLocaleString()}</td>
                  <td className="p-3 text-right text-green-600 font-medium">
                    {customer.profitMargin}%
                  </td>
                  <td className="p-3 text-center">
                    <div className="text-sm">
                      <div>{customer.paymentTerms}</div>
                      <div className="text-xs text-muted-foreground">
                        Avg: {customer.avgPaymentDays} days
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-center">{getRatingBadge(customer.rating)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top Customers */}
        <div className="mt-6">
          <h3 className="font-semibold mb-4">Top 3 Customers by Revenue</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {customers.slice(0, 3).map((customer, index) => (
              <div key={customer.customerName} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold">#{index + 1}</span>
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <p className="font-medium">{customer.customerName}</p>
                <p className="text-2xl font-bold text-green-600">
                  ${customer.totalRevenue.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">{customer.totalLoads} loads</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}






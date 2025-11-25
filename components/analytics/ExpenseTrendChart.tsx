'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ExpenseTrend {
  category: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export function ExpenseTrendChart() {
  const [expenses, setExpenses] = useState<ExpenseTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpenseTrends();
  }, []);

  const fetchExpenseTrends = async () => {
    try {
      // TODO: Implement API endpoint
      const mockData: ExpenseTrend[] = [
        { category: 'Fuel', amount: 185000, percentage: 45, trend: 'up' },
        { category: 'Driver Pay', amount: 125000, percentage: 30, trend: 'stable' },
        { category: 'Maintenance', amount: 42000, percentage: 10, trend: 'down' },
        { category: 'Tolls', amount: 28000, percentage: 7, trend: 'stable' },
        { category: 'Insurance', amount: 18500, percentage: 4.5, trend: 'stable' },
        { category: 'Other', amount: 14500, percentage: 3.5, trend: 'up' },
      ];
      setExpenses(mockData);
    } catch (error) {
      console.error('Error fetching expense trends:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expense Breakdown</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Breakdown & Trends</CardTitle>
        <CardDescription>Cost analysis by category for the last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Total Expenses */}
        <div className="mb-6 p-4 border rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground mb-2">Total Expenses</p>
          <p className="text-3xl font-bold">${totalExpenses.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">This month</p>
        </div>

        {/* Expense Breakdown */}
        <div className="space-y-4">
          {expenses.map((expense) => (
            <div key={expense.category} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{expense.category}</span>
                  <span
                    className={`text-xs ${
                      expense.trend === 'up'
                        ? 'text-red-500'
                        : expense.trend === 'down'
                        ? 'text-green-500'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {expense.trend === 'up' ? '↑' : expense.trend === 'down' ? '↓' : '→'}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-bold">${expense.amount.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">{expense.percentage}%</div>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${expense.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Insights */}
        <div className="mt-6 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
          <h4 className="font-semibold mb-2">Cost Insights</h4>
          <ul className="space-y-1 text-sm">
            <li>• Fuel costs represent 45% of total expenses</li>
            <li>• Maintenance costs decreased by 8% from last month</li>
            <li>• Consider fuel hedging strategies to reduce volatility</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}






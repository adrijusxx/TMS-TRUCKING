'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp } from 'lucide-react';

interface SettlementForecast {
  week: string;
  estimatedSettlements: number;
  estimatedAmount: number;
  confidence: 'high' | 'medium' | 'low';
}

export function SettlementForecastChart() {
  const [forecast, setForecast] = useState<SettlementForecast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettlementForecast();
  }, []);

  const fetchSettlementForecast = async () => {
    try {
      // TODO: Implement API endpoint with ML-based forecasting
      const mockData: SettlementForecast[] = [
        {
          week: 'Week 1 (Nov 25-Dec 1)',
          estimatedSettlements: 45,
          estimatedAmount: 125000,
          confidence: 'high',
        },
        {
          week: 'Week 2 (Dec 2-8)',
          estimatedSettlements: 48,
          estimatedAmount: 132000,
          confidence: 'high',
        },
        {
          week: 'Week 3 (Dec 9-15)',
          estimatedSettlements: 42,
          estimatedAmount: 118000,
          confidence: 'medium',
        },
        {
          week: 'Week 4 (Dec 16-22)',
          estimatedSettlements: 38,
          estimatedAmount: 105000,
          confidence: 'medium',
        },
      ];
      setForecast(mockData);
    } catch (error) {
      console.error('Error fetching settlement forecast:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    if (confidence === 'high') return <span className="text-green-600">High</span>;
    if (confidence === 'medium') return <span className="text-yellow-600">Medium</span>;
    return <span className="text-red-600">Low</span>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Settlement Forecast</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const totalForecast = forecast.reduce((sum, f) => sum + f.estimatedAmount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settlement Forecast & Cash Flow Planning</CardTitle>
        <CardDescription>Projected settlement amounts for the next 4 weeks</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Total Forecast */}
        <div className="mb-6 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Total Forecasted (4 weeks)</p>
              <p className="text-3xl font-bold">${totalForecast.toLocaleString()}</p>
            </div>
            <TrendingUp className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        {/* Weekly Forecast */}
        <div className="space-y-4">
          {forecast.map((week) => (
            <div key={week.week} className="p-4 border rounded-lg hover:bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{week.week}</h4>
                <div className="text-sm">
                  Confidence: {getConfidenceBadge(week.confidence)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Settlements</p>
                  <p className="text-xl font-bold">{week.estimatedSettlements}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Amount</p>
                  <p className="text-xl font-bold text-green-600">
                    ${week.estimatedAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Planning Notes */}
        <div className="mt-6 p-4 border rounded-lg bg-green-50 dark:bg-green-950">
          <h4 className="font-semibold mb-2">Cash Flow Planning</h4>
          <ul className="space-y-1 text-sm">
            <li>• Ensure ${totalForecast.toLocaleString()} liquidity for next 4 weeks</li>
            <li>• Peak settlement week: Week 2 (${forecast[1]?.estimatedAmount.toLocaleString()})</li>
            <li>• Consider early payment discounts for Week 1 settlements</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}






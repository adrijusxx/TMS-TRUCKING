'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function DriverRetention() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Driver Retention Metrics</CardTitle>
        <CardDescription>Track driver retention and turnover rates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">12-Month Retention</p>
              <p className="text-3xl font-bold text-green-600">92%</p>
              <p className="text-xs text-muted-foreground">41 of 45 drivers retained</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Avg Tenure</p>
              <p className="text-3xl font-bold">3.2 years</p>
              <p className="text-xs text-muted-foreground">Industry avg: 2.1 years</p>
            </div>
          </div>
          <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950">
            <h4 className="font-semibold mb-2">Retention Insights</h4>
            <ul className="space-y-1 text-sm">
              <li>• Retention rate 15% above industry average</li>
              <li>• Zero turnover in last quarter</li>
              <li>• High satisfaction with settlement process</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}






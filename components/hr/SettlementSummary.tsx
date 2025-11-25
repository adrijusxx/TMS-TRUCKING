'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function SettlementSummary() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Settlement Summary</CardTitle>
        <CardDescription>Driver settlement statistics and trends</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Average Weekly Settlement</p>
            <p className="text-2xl font-bold">$3,250</p>
            <p className="text-xs text-green-600">+5% from last month</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Total Paid This Month</p>
            <p className="text-2xl font-bold">$585,000</p>
            <p className="text-xs text-muted-foreground">180 settlements</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Avg Deductions</p>
            <p className="text-2xl font-bold">$850</p>
            <p className="text-xs text-muted-foreground">Per settlement</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}






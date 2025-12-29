'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function BonusCalculations() {
  const bonuses = [
    { driver: 'John Smith', type: 'Performance', amount: 500, status: 'Paid' },
    { driver: 'Jane Doe', type: 'Safety', amount: 300, status: 'Paid' },
    { driver: 'Mike Johnson', type: 'Referral', amount: 1000, status: 'Pending' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bonus Tracking</CardTitle>
        <CardDescription>Performance bonuses, safety bonuses, and referral bonuses</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Total Bonuses (MTD)</p>
              <p className="text-2xl font-bold">$12,500</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Avg Bonus/Driver</p>
              <p className="text-2xl font-bold">$278</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Pending Bonuses</p>
              <p className="text-2xl font-bold text-orange-600">$3,200</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Recent Bonuses</h4>
            {bonuses.map((bonus, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{bonus.driver}</p>
                  <p className="text-sm text-muted-foreground">{bonus.type} Bonus</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-bold">${bonus.amount}</p>
                  <Badge className={bonus.status === 'Paid' ? 'bg-green-500' : 'bg-yellow-500'}>
                    {bonus.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}






'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { getBonusMetrics } from '@/lib/actions/hr';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { Search } from 'lucide-react';

export function BonusCalculations() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['bonus-metrics'],
    queryFn: () => getBonusMetrics(),
  });

  const metrics = data?.data || { totalBonuses: 0, avgBonus: 0, pending: 0, recent: [] };
  const bonuses = metrics.recent || [];

  const filteredBonuses = useMemo(() => {
    if (!searchTerm.trim()) return bonuses;
    const term = searchTerm.toLowerCase();
    return bonuses.filter((bonus: any) =>
      bonus.driver.toLowerCase().includes(term) ||
      bonus.type.toLowerCase().includes(term)
    );
  }, [bonuses, searchTerm]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bonus Tracking</CardTitle>
        <CardDescription>Performance bonuses, safety bonuses, and referral bonuses</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Total Bonuses (MTD)</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.totalBonuses)}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Avg Bonus/Driver</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.avgBonus)}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Pending Bonuses</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(metrics.pending)}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Recent Bonuses</h4>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by driver or bonus type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {filteredBonuses.length === 0 ? (
                <div className="text-sm text-muted-foreground py-2">
                  {searchTerm ? 'No bonuses match your search' : 'No recent bonuses recorded.'}
                </div>
              ) : (
                filteredBonuses.map((bonus: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-medium">{bonus.driver}</p>
                      <p className="text-sm text-muted-foreground">{bonus.type} Bonus</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-bold">{formatCurrency(bonus.amount)}</p>
                      <Badge className={bonus.status === 'Paid' ? 'bg-green-500' : 'bg-yellow-500'}>
                        {bonus.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

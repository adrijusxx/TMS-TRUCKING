'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Fuel } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface EstimatedCostsCardProps {
  estimatedFuelCost: number | null;
  estimatedMaintCost: number | null;
  estimatedFixedCost: number | null;
  estimatedOpCost: number;
  netProfit: number | null;
}

export default function EstimatedCostsCard({
  estimatedFuelCost,
  estimatedMaintCost,
  estimatedFixedCost,
  estimatedOpCost,
  netProfit,
}: EstimatedCostsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Fuel className="h-4 w-4 text-amber-500" />
          <CardTitle className="text-base">Estimated Operating Costs</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-2 text-sm">
          <div>
            <span className="text-xs text-muted-foreground">Fuel</span>
            <p className="font-medium">{formatCurrency(estimatedFuelCost ?? 0)}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Maint.</span>
            <p className="font-medium">{formatCurrency(estimatedMaintCost ?? 0)}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Fixed</span>
            <p className="font-medium">{formatCurrency(estimatedFixedCost ?? 0)}</p>
          </div>
          <div>
            <span className="text-xs font-medium">Total Op Cost</span>
            <p className="font-bold text-red-500">{formatCurrency(estimatedOpCost)}</p>
          </div>
        </div>
        {netProfit != null && (
          <div className="mt-3 pt-3 border-t flex justify-between items-center">
            <span className="text-sm font-medium">Est. Net Profit</span>
            <p className={`font-bold text-lg ${(netProfit - estimatedOpCost) >= 0 ? 'text-status-success' : 'text-status-error'}`}>
              {formatCurrency(netProfit - estimatedOpCost)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

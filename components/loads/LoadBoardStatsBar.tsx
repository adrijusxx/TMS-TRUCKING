'use client';

import { formatCurrency } from '@/lib/utils';

interface LoadBoardStatsBarProps {
  stats: {
    totalMiles: number;
    emptyMiles: number;
    totalGross: number;
    totalDriverGross: number;
    averageRate: string;
  };
}

export default function LoadBoardStatsBar({ stats }: LoadBoardStatsBarProps) {
  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap px-1">
      <div>
        <span>Total Miles: </span>
        <span className="font-medium text-foreground">{stats.totalMiles.toLocaleString()}</span>
      </div>
      <div>
        <span>Empty Miles: </span>
        <span className="font-medium text-foreground">{stats.emptyMiles.toLocaleString()}</span>
      </div>
      <div>
        <span>Total Gross: </span>
        <span className="font-medium text-foreground">{formatCurrency(stats.totalGross)}</span>
      </div>
      <div>
        <span>Driver Gross: </span>
        <span className="font-medium text-foreground">{formatCurrency(stats.totalDriverGross)}</span>
      </div>
      <div>
        <span>Avg Rate: </span>
        <span className="font-medium text-foreground">${stats.averageRate}/mi</span>
      </div>
    </div>
  );
}

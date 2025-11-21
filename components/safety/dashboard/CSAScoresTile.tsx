'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Link from 'next/link';

interface CSAScoresTileProps {
  scores: Record<string, {
    percentile: number;
    trend: string;
    score?: number;
  }>;
}

export default function CSAScoresTile({ scores }: CSAScoresTileProps) {
  const getScoreColor = (percentile: number) => {
    if (percentile <= 50) return 'text-green-600 dark:text-green-400';
    if (percentile <= 75) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'IMPROVING') return <TrendingDown className="h-4 w-4 text-green-600" />;
    if (trend === 'DECLINING') return <TrendingUp className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const scoreEntries = Object.entries(scores);
  const averagePercentile = scoreEntries.length > 0
    ? scoreEntries.reduce((sum, [, score]) => sum + score.percentile, 0) / scoreEntries.length
    : 0;

  return (
    <Link href="/dashboard/safety/compliance/csa-scores">
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">CSA Scores</CardTitle>
          {scoreEntries.length > 0 && getTrendIcon(scoreEntries[0][1].trend)}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getScoreColor(averagePercentile)}`}>
            {averagePercentile.toFixed(0)}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Average percentile across all BASICs
          </p>
          {scoreEntries.length > 0 && (
            <div className="mt-2 space-y-1">
              {scoreEntries.slice(0, 3).map(([category, score]) => (
                <div key={category} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {category.replace(/_/g, ' ').toLowerCase()}
                  </span>
                  <span className={getScoreColor(score.percentile)}>
                    {score.percentile.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}


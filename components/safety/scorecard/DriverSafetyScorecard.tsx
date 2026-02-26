'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiUrl } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface ScoreBreakdown {
  incidents: number;
  hosViolations: number;
  mvrViolations: number;
  drugTests: number;
  inspections: number;
  training: number;
  citations: number;
}

interface ScorecardData {
  driverId: string;
  overallScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  breakdown: ScoreBreakdown;
  trend: Array<{ month: string; score: number }> | null;
}

const riskColors: Record<string, string> = {
  LOW: 'bg-green-100 text-green-800 border-green-200',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
  CRITICAL: 'bg-red-100 text-red-800 border-red-200',
};

const scoreLabels: Record<keyof ScoreBreakdown, { label: string; max: number }> = {
  incidents: { label: 'Incidents', max: 25 },
  hosViolations: { label: 'HOS', max: 20 },
  mvrViolations: { label: 'MVR', max: 15 },
  drugTests: { label: 'Drug Tests', max: 10 },
  inspections: { label: 'Inspections', max: 10 },
  training: { label: 'Training', max: 10 },
  citations: { label: 'Citations', max: 10 },
};

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
}

interface Props {
  driverId: string;
  compact?: boolean;
}

export default function DriverSafetyScorecard({ driverId, compact = false }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['driver-scorecard', driverId],
    queryFn: async () => {
      const res = await fetch(
        apiUrl(`/api/safety/drivers/${driverId}/scorecard?includeTrend=true&trendMonths=6`)
      );
      if (!res.ok) throw new Error('Failed to fetch scorecard');
      const json = await res.json();
      return json.data as ScorecardData;
    },
    enabled: !!driverId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Loading scorecard...
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className={`text-2xl font-bold ${getScoreColor(data.overallScore)}`}>
          {data.overallScore}
        </div>
        <Badge variant="outline" className={riskColors[data.riskLevel]}>
          {data.riskLevel}
        </Badge>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Safety Score</CardTitle>
          <Badge variant="outline" className={riskColors[data.riskLevel]}>
            {data.riskLevel} Risk
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className={`text-5xl font-bold ${getScoreColor(data.overallScore)}`}>
            {data.overallScore}
          </div>
          <p className="text-sm text-muted-foreground mt-1">out of 100</p>
        </div>

        <div className="space-y-3">
          {(Object.entries(scoreLabels) as [keyof ScoreBreakdown, { label: string; max: number }][]).map(
            ([key, { label, max }]) => {
              const value = data.breakdown[key];
              const pct = (value / max) * 100;
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{label}</span>
                    <span className="text-muted-foreground">
                      {value}/{max}
                    </span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              );
            }
          )}
        </div>

        {data.trend && data.trend.length > 0 && (
          <div className="pt-3 border-t">
            <p className="text-sm font-medium mb-2">Trend (6 months)</p>
            <div className="flex items-end gap-1 h-12">
              {data.trend.map((t) => {
                const height = (t.score / 100) * 100;
                return (
                  <div key={t.month} className="flex-1 flex flex-col items-center">
                    <div
                      className={`w-full rounded-t ${getScoreColor(t.score).replace('text-', 'bg-')}`}
                      style={{ height: `${height}%`, minHeight: '2px' }}
                    />
                    <span className="text-[9px] text-muted-foreground mt-1">
                      {t.month.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

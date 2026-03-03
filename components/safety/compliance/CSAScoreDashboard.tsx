'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, BarChart3, Target,
} from 'lucide-react';
import { apiUrl, formatDate } from '@/lib/utils';
import CSATrendChart from './CSATrendChart';
import CSARecommendations from './CSARecommendations';

interface CSAScore {
  basicCategory: string;
  percentile: number;
  score?: number;
  previousPercentile?: number;
  trend?: string;
  violationCount: number;
  violationDetails?: string;
  scoreDate: string;
}

interface CSAScoreData {
  currentScores: Record<string, CSAScore>;
  history: CSAScore[];
}

async function fetchCSAScores() {
  const response = await fetch(apiUrl('/api/safety/compliance/csa-scores'));
  if (!response.ok) throw new Error('Failed to fetch CSA scores');
  return response.json() as Promise<CSAScoreData>;
}

const BASIC_CATEGORIES = [
  { value: 'UNSAFE_DRIVING', label: 'Unsafe Driving', threshold: 65, description: 'Speeding, reckless driving, improper lane change, failure to use seatbelt' },
  { value: 'CRASH_INDICATOR', label: 'Crash Indicator', threshold: 65, description: 'Crash history involvement with state-reported crashes' },
  { value: 'HOS_COMPLIANCE', label: 'HOS Compliance', threshold: 65, description: 'Logbook and ELD violations, driving over hours limits' },
  { value: 'VEHICLE_MAINTENANCE', label: 'Vehicle Maintenance', threshold: 80, description: 'Brake, tire, lighting, and other vehicle defect violations' },
  { value: 'CONTROLLED_SUBSTANCES', label: 'Controlled Substances', threshold: 65, description: 'Drug and alcohol testing violations and impairment' },
  { value: 'HAZMAT_COMPLIANCE', label: 'Hazmat Compliance', threshold: 65, description: 'Hazardous material handling, placarding, shipping papers' },
  { value: 'DRIVER_FITNESS', label: 'Driver Fitness', threshold: 65, description: 'CDL, medical card, and qualification file deficiencies' },
];

/** Parse a contributing factors string into items. */
function parseContributingFactors(details?: string): string[] {
  if (!details) return [];
  return details.split(/[;,\n]/).map((s) => s.trim()).filter(Boolean);
}

/** Project the trend direction from current vs previous percentile. */
function projectTrend(
  current: number,
  previous: number | undefined,
  trend?: string
): { direction: 'improving' | 'declining' | 'stable'; delta: number } {
  if (trend === 'IMPROVING') return { direction: 'improving', delta: (previous ?? current) - current };
  if (trend === 'DECLINING') return { direction: 'declining', delta: current - (previous ?? current) };
  if (previous !== undefined) {
    const delta = current - previous;
    if (delta > 2) return { direction: 'declining', delta };
    if (delta < -2) return { direction: 'improving', delta: Math.abs(delta) };
  }
  return { direction: 'stable', delta: 0 };
}

export default function CSAScoreDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['csa-scores'],
    queryFn: fetchCSAScores,
    refetchInterval: 300000,
  });

  const currentScores = data?.currentScores || {};
  const scores = Object.entries(currentScores);

  const analytics = useMemo(() => {
    if (scores.length === 0) return null;

    const avgPercentile = scores.reduce((sum, [, s]) => sum + s.percentile, 0) / scores.length;
    const highScores = scores.filter(([, s]) => s.percentile >= 75);
    const totalViolations = scores.reduce((sum, [, s]) => sum + s.violationCount, 0);

    // Identify the highest-impact area for improvement
    const sortedByImpact = [...scores].sort(([, a], [, b]) => b.percentile - a.percentile);
    const highestImpact = sortedByImpact[0] ? sortedByImpact[0][0] : null;

    return { avgPercentile, highScores, totalViolations, highestImpact };
  }, [scores]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading CSA scores...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-destructive">Error loading CSA scores</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          title="Average Percentile"
          value={`${(analytics?.avgPercentile ?? 0).toFixed(1)}%`}
          icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
          valueColor={getScoreColor(analytics?.avgPercentile ?? 0)}
          subtitle="Across all BASIC categories"
        />
        <SummaryCard
          title="FMCSA Threshold"
          value="75%"
          icon={<Target className="h-4 w-4 text-muted-foreground" />}
          subtitle="Intervention trigger"
        />
        <SummaryCard
          title="High-Risk Categories"
          value={String(analytics?.highScores.length ?? 0)}
          icon={<AlertTriangle className="h-4 w-4 text-red-600" />}
          valueColor="text-red-600"
          subtitle="At or above 75%"
        />
        <SummaryCard
          title="Total Violations"
          value={String(analytics?.totalViolations ?? 0)}
          icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
          subtitle="Contributing to scores"
        />
      </div>

      {/* Intervention Alert */}
      {analytics && analytics.highScores.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Intervention Required
            </CardTitle>
            <CardDescription>
              Categories at or above the intervention threshold
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.highScores.map(([category, score]) => (
                <InterventionRow key={category} category={category} score={score} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All BASIC Categories with Contributing Factors */}
      <Card>
        <CardHeader>
          <CardTitle>BASIC Categories Detail</CardTitle>
          <CardDescription>Current scores, contributing factors, and trend projections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {BASIC_CATEGORIES.map((category) => {
              const score = currentScores[category.value];
              return (
                <CategoryDetailRow
                  key={category.value}
                  category={category}
                  score={score ?? null}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Trend Chart */}
      {data?.history && data.history.length > 0 && (
        <CSATrendChart history={data.history} />
      )}

      {/* Improvement Recommendations */}
      <CSARecommendations scores={currentScores} />
    </div>
  );
}

function SummaryCard({
  title, value, icon, valueColor = '', subtitle,
}: {
  title: string; value: string; icon: React.ReactNode; valueColor?: string; subtitle: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueColor}`}>{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function InterventionRow({ category, score }: { category: string; score: CSAScore }) {
  const label = BASIC_CATEGORIES.find((c) => c.value === category)?.label ?? category;
  return (
    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg">
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-sm text-muted-foreground">{score.violationCount} violation(s)</div>
      </div>
      <div className="flex items-center gap-3">
        <div className={`text-2xl font-bold ${getScoreColor(score.percentile)}`}>
          {score.percentile.toFixed(0)}%
        </div>
        <TrendIcon trend={score.trend} />
      </div>
    </div>
  );
}

function CategoryDetailRow({
  category,
  score,
}: {
  category: typeof BASIC_CATEGORIES[number];
  score: CSAScore | null;
}) {
  if (!score) {
    return (
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div>
          <div className="font-medium">{category.label}</div>
          <div className="text-sm text-muted-foreground">{category.description}</div>
        </div>
        <Badge variant="outline">N/A</Badge>
      </div>
    );
  }

  const bgColor = getScoreBgColor(score.percentile);
  const intervention = getInterventionStatus(score.percentile, category.threshold);
  const trendInfo = projectTrend(score.percentile, score.previousPercentile, score.trend);
  const factors = parseContributingFactors(score.violationDetails);

  return (
    <div className={`p-4 border rounded-lg ${bgColor}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">{category.label}</span>
            <Badge className={intervention.color}>{intervention.status}</Badge>
            <TrendBadge direction={trendInfo.direction} delta={trendInfo.delta} />
          </div>
          <div className="text-sm text-muted-foreground">{category.description}</div>
          <div className="text-sm text-muted-foreground mt-1">
            {score.violationCount} violation(s) | Last updated: {formatDate(score.scoreDate)}
            {` | Threshold: ${category.threshold}%`}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`text-3xl font-bold ${getScoreColor(score.percentile)}`}>
            {score.percentile.toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Contributing Factors */}
      {factors.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <div className="text-xs font-medium text-muted-foreground mb-1">Contributing Factors:</div>
          <div className="flex flex-wrap gap-1.5">
            {factors.slice(0, 6).map((factor, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {factor}
              </Badge>
            ))}
            {factors.length > 6 && (
              <Badge variant="outline" className="text-xs">+{factors.length - 6} more</Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TrendIcon({ trend }: { trend?: string }) {
  if (trend === 'IMPROVING') return <TrendingDown className="h-4 w-4 text-green-600" />;
  if (trend === 'DECLINING') return <TrendingUp className="h-4 w-4 text-red-600" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function TrendBadge({ direction, delta }: { direction: string; delta: number }) {
  if (direction === 'improving') {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
        Improving {delta > 0 ? `(-${delta.toFixed(0)}pt)` : ''}
      </Badge>
    );
  }
  if (direction === 'declining') {
    return (
      <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
        Declining {delta > 0 ? `(+${delta.toFixed(0)}pt)` : ''}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-xs">Stable</Badge>
  );
}

function getScoreColor(percentile: number): string {
  if (percentile <= 50) return 'text-green-600 dark:text-green-400';
  if (percentile <= 75) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

function getScoreBgColor(percentile: number): string {
  if (percentile <= 50) return 'bg-green-50 dark:bg-green-950/20 border-green-200';
  if (percentile <= 75) return 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200';
  return 'bg-red-50 dark:bg-red-950/20 border-red-200';
}

function getInterventionStatus(percentile: number, threshold: number) {
  if (percentile >= threshold) return { status: 'INTERVENTION', color: 'bg-red-100 text-red-800' };
  if (percentile >= 50) return { status: 'WARNING', color: 'bg-yellow-100 text-yellow-800' };
  return { status: 'CLEAR', color: 'bg-green-100 text-green-800' };
}

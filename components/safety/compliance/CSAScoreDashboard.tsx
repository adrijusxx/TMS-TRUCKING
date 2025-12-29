'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import { formatDate } from '@/lib/utils';

interface CSAScore {
  basicCategory: string;
  percentile: number;
  score?: number;
  trend?: string;
  violationCount: number;
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
  { value: 'UNSAFE_DRIVING', label: 'Unsafe Driving' },
  { value: 'CRASH_INDICATOR', label: 'Crash Indicator' },
  { value: 'HOS_COMPLIANCE', label: 'HOS Compliance' },
  { value: 'VEHICLE_MAINTENANCE', label: 'Vehicle Maintenance' },
  { value: 'CONTROLLED_SUBSTANCES', label: 'Controlled Substances' },
  { value: 'HAZMAT_COMPLIANCE', label: 'Hazmat Compliance' },
  { value: 'DRIVER_FITNESS', label: 'Driver Fitness' }
];

export default function CSAScoreDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['csa-scores'],
    queryFn: fetchCSAScores,
    refetchInterval: 300000 // Refetch every 5 minutes
  });

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
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading CSA scores</p>
        </div>
      </div>
    );
  }

  const currentScores = data?.currentScores || {};
  const scores = Object.entries(currentScores);

  const getScoreColor = (percentile: number) => {
    if (percentile <= 50) return 'text-green-600 dark:text-green-400';
    if (percentile <= 75) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (percentile: number) => {
    if (percentile <= 50) return 'bg-green-50 dark:bg-green-950/20 border-green-200';
    if (percentile <= 75) return 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200';
    return 'bg-red-50 dark:bg-red-950/20 border-red-200';
  };

  const getTrendIcon = (trend?: string) => {
    if (trend === 'IMPROVING') {
      return <TrendingDown className="h-4 w-4 text-green-600" />;
    }
    if (trend === 'DECLINING') {
      return <TrendingUp className="h-4 w-4 text-red-600" />;
    }
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getInterventionStatus = (percentile: number) => {
    if (percentile >= 75) return { status: 'INTERVENTION', color: 'bg-red-100 text-red-800' };
    if (percentile >= 50) return { status: 'WARNING', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'CLEAR', color: 'bg-green-100 text-green-800' };
  };

  const highScores = scores.filter(([, score]) => score.percentile >= 75);
  const averagePercentile =
    scores.length > 0
      ? scores.reduce((sum, [, score]) => sum + score.percentile, 0) / scores.length
      : 0;

  return (
    <div className="space-y-6">

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Percentile</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(averagePercentile)}`}>
              {averagePercentile.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all BASIC categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Intervention Threshold</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">75%</div>
            <p className="text-xs text-muted-foreground mt-1">
              FMCSA intervention threshold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High-Risk Categories</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{highScores.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Categories at or above 75%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* High-Risk Alert */}
      {highScores.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Intervention Required
            </CardTitle>
            <CardDescription>
              The following categories are at or above the intervention threshold (75%)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {highScores.map(([category, score]) => (
                <div
                  key={category}
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg"
                >
                  <div>
                    <div className="font-medium">
                      {BASIC_CATEGORIES.find(c => c.value === category)?.label || category}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {score.violationCount} violation(s)
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`text-2xl font-bold ${getScoreColor(score.percentile)}`}>
                      {score.percentile.toFixed(0)}%
                    </div>
                    {getTrendIcon(score.trend)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All BASIC Categories */}
      <Card>
        <CardHeader>
          <CardTitle>All BASIC Categories</CardTitle>
          <CardDescription>Current CSA scores by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {BASIC_CATEGORIES.map((category) => {
              const score = currentScores[category.value];
              if (!score) {
                return (
                  <div
                    key={category.value}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{category.label}</div>
                      <div className="text-sm text-muted-foreground">No data available</div>
                    </div>
                    <Badge variant="outline">N/A</Badge>
                  </div>
                );
              }

              const intervention = getInterventionStatus(score.percentile);

              return (
                <div
                  key={category.value}
                  className={`flex items-center justify-between p-4 border rounded-lg ${getScoreBgColor(
                    score.percentile
                  )}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-medium">{category.label}</div>
                      <Badge className={intervention.color}>{intervention.status}</Badge>
                      {getTrendIcon(score.trend)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {score.violationCount} violation(s) • Last updated:{' '}
                      {formatDate(score.scoreDate)}
                    </div>
                  </div>
                  <div className={`text-3xl font-bold ${getScoreColor(score.percentile)}`}>
                    {score.percentile.toFixed(0)}%
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


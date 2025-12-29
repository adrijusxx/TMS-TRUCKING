'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Truck,
  Gauge,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Wrench,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DIAGNOSTIC_CATEGORIES } from '@/lib/data/dtc-codes';

interface DiagnosticsAnalyticsProps {
  analytics: {
    summary: {
      totalActive: number;
      totalResolved: number;
      criticalCount: number;
      warningCount: number;
      infoCount: number;
      trucksAffected: number;
      checkEngineLightCount: number;
    };
    byCategory: Array<{ category: string; count: number }>;
    bySeverity: Array<{ severity: string; count: number }>;
    topCodes: Array<{ code: string; description: string; count: number }>;
    trend: Array<{ date: string; count: number }>;
    fleetHealthScore: number;
  } | null;
  loading?: boolean;
  compact?: boolean;
}

export function DiagnosticsAnalytics({ analytics, loading, compact = false }: DiagnosticsAnalyticsProps) {
  if (loading || !analytics) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-3">
              <div className="h-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const { summary, byCategory, topCodes, trend, fleetHealthScore } = analytics;

  // Calculate trend direction and percentage
  const recentTrend = trend.slice(-14);
  const oldWeek = recentTrend.slice(0, 7).reduce((a, b) => a + b.count, 0);
  const newWeek = recentTrend.slice(-7).reduce((a, b) => a + b.count, 0);
  const trendPercent = oldWeek > 0 ? Math.round(((newWeek - oldWeek) / oldWeek) * 100) : 0;
  const trendDirection = trendPercent > 5 ? 'up' : trendPercent < -5 ? 'down' : 'stable';

  // Get health score color and label
  const getHealthInfo = (score: number) => {
    if (score >= 90) return { color: 'text-green-600', bg: 'bg-green-500', label: 'Excellent' };
    if (score >= 75) return { color: 'text-green-500', bg: 'bg-green-400', label: 'Good' };
    if (score >= 60) return { color: 'text-yellow-500', bg: 'bg-yellow-500', label: 'Fair' };
    if (score >= 40) return { color: 'text-orange-500', bg: 'bg-orange-500', label: 'Poor' };
    return { color: 'text-red-500', bg: 'bg-red-500', label: 'Critical' };
  };

  const healthInfo = getHealthInfo(fleetHealthScore);
  const maxCategoryCount = Math.max(...byCategory.map(c => c.count), 1);

  if (compact) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          title="Fleet Health"
          value={`${fleetHealthScore}%`}
          subtitle={healthInfo.label}
          icon={<Gauge className="h-5 w-5" />}
          color={healthInfo.color}
          trend={trendDirection === 'down' ? 'positive' : trendDirection === 'up' ? 'negative' : undefined}
          trendValue={trendDirection !== 'stable' ? `${Math.abs(trendPercent)}%` : undefined}
        />
        <StatCard
          title="Critical"
          value={summary.criticalCount}
          subtitle="Immediate action"
          icon={<AlertTriangle className="h-5 w-5" />}
          color="text-red-500"
          bgColor="bg-red-50 dark:bg-red-950"
        />
        <StatCard
          title="Warning"
          value={summary.warningCount}
          subtitle="Service soon"
          icon={<AlertCircle className="h-5 w-5" />}
          color="text-yellow-500"
          bgColor="bg-yellow-50 dark:bg-yellow-950"
        />
        <StatCard
          title="Trucks Affected"
          value={summary.trucksAffected}
          subtitle={`${summary.checkEngineLightCount} with CEL`}
          icon={<Truck className="h-5 w-5" />}
          color="text-blue-500"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Fleet Health Score */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Fleet Health</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className={cn('text-3xl font-bold', healthInfo.color)}>
                    {fleetHealthScore}%
                  </span>
                  <span className="text-xs text-muted-foreground">{healthInfo.label}</span>
                </div>
              </div>
              <div className={cn('p-2 rounded-lg', healthInfo.bg, 'bg-opacity-20')}>
                <Gauge className={cn('h-5 w-5', healthInfo.color)} />
              </div>
            </div>
            <Progress value={fleetHealthScore} className="mt-3 h-1.5" />
            {trendDirection !== 'stable' && (
              <div className={cn(
                'flex items-center gap-1 mt-2 text-xs',
                trendDirection === 'down' ? 'text-green-600' : 'text-red-600'
              )}>
                {trendDirection === 'down' ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                <span>{Math.abs(trendPercent)}% vs last week</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Critical Count */}
        <Card className="border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-950/30">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Critical</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{summary.criticalCount}</p>
                <p className="text-xs text-red-600/70 mt-1">Immediate attention</p>
              </div>
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warning Count */}
        <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50/30 dark:bg-yellow-950/30">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Warning</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">{summary.warningCount}</p>
                <p className="text-xs text-yellow-600/70 mt-1">Service soon</p>
              </div>
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trucks Affected */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Trucks Affected</p>
                <p className="text-3xl font-bold mt-1">{summary.trucksAffected}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary.checkEngineLightCount} with CEL on
                </p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Truck className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* By Category */}
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Faults by System
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {byCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No data</p>
            ) : (
              <div className="space-y-3">
                {byCategory.slice(0, 6).map(({ category, count }) => {
                  const catInfo = DIAGNOSTIC_CATEGORIES[category as keyof typeof DIAGNOSTIC_CATEGORIES] 
                    || DIAGNOSTIC_CATEGORIES.unknown;
                  const percentage = Math.round((count / maxCategoryCount) * 100);
                  
                  return (
                    <div key={category}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="capitalize">{catInfo.label}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Codes */}
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Top Recurring Codes
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {topCodes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No fault codes recorded</p>
            ) : (
              <div className="space-y-2">
                {topCodes.slice(0, 5).map(({ code, description, count }, index) => (
                  <div
                    key={code}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-medium text-muted-foreground w-5">
                        {index + 1}.
                      </span>
                      <div className="min-w-0">
                        <span className="font-mono text-sm font-semibold">{code}</span>
                        <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                          {description}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="flex-shrink-0">{count}x</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 30-Day Trend */}
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              30-Day Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="h-32 flex items-end gap-0.5">
              {trend.map(({ date, count }) => {
                const maxCount = Math.max(...trend.map(t => t.count), 1);
                const height = (count / maxCount) * 100;
                const isToday = date === new Date().toISOString().split('T')[0];
                return (
                  <div
                    key={date}
                    className="flex-1 group relative"
                    title={`${date}: ${count} faults`}
                  >
                    <div
                      className={cn(
                        'w-full rounded-t transition-all',
                        isToday ? 'bg-primary' : 'bg-primary/60 hover:bg-primary/80'
                      )}
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-popover border rounded text-xs opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10 shadow-lg">
                      <div className="font-medium">{count} faults</div>
                      <div className="text-muted-foreground">{new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>30 days ago</span>
              <span>Today</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Footer */}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Badge variant="outline" className="gap-1">
          <Activity className="h-3 w-3" />
          Total Active: {summary.totalActive}
        </Badge>
        <Badge variant="outline" className="gap-1">
          <CheckCircle2 className="h-3 w-3 text-green-500" />
          Resolved: {summary.totalResolved}
        </Badge>
        <Badge variant="outline" className="gap-1 text-blue-600">
          <Info className="h-3 w-3" />
          Info: {summary.infoCount}
        </Badge>
      </div>
    </div>
  );
}

// Reusable stat card component
function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
  bgColor,
  trend,
  trendValue,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  bgColor?: string;
  trend?: 'positive' | 'negative';
  trendValue?: string;
}) {
  return (
    <Card className={bgColor}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className={cn('text-2xl font-bold', color)}>{value}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-xs text-muted-foreground">{subtitle}</span>
              {trend && trendValue && (
                <span className={cn(
                  'text-xs flex items-center',
                  trend === 'positive' ? 'text-green-500' : 'text-red-500'
                )}>
                  {trend === 'positive' ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                  {trendValue}
                </span>
              )}
            </div>
          </div>
          <div className={cn('p-1.5 rounded-lg', color.replace('text-', 'bg-').replace('500', '100'))}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

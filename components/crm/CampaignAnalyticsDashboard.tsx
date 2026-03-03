'use client';

/**
 * CampaignAnalyticsDashboard
 *
 * Shows key campaign metrics as cards and a funnel visualization
 * for the progression: Recipients -> Sent -> Responded -> Converted.
 */

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Send, MessageSquare, UserCheck, Users,
  AlertTriangle, TrendingUp,
} from 'lucide-react';

interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
}

interface CampaignMetrics {
  campaignId: string;
  campaignName: string;
  channel: string;
  status: string;
  totalRecipients: number;
  totalSent: number;
  totalFailed: number;
  totalResponded: number;
  totalConverted: number;
  sendRate: number;
  responseRate: number;
  conversionRate: number;
  funnel: FunnelStage[];
}

interface CampaignAnalyticsDashboardProps {
  campaignId: string;
}

export default function CampaignAnalyticsDashboard({
  campaignId,
}: CampaignAnalyticsDashboardProps) {
  const { data, isLoading, error } = useQuery<{ success: boolean; data: CampaignMetrics }>({
    queryKey: ['campaign-analytics', campaignId],
    queryFn: async () => {
      const res = await fetch(`/api/crm/campaigns/${campaignId}/analytics`);
      if (!res.ok) throw new Error('Failed to fetch analytics');
      return res.json();
    },
    enabled: !!campaignId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
        <AlertTriangle className="h-4 w-4" />
        <span>Failed to load analytics</span>
      </div>
    );
  }

  const m = data.data;

  return (
    <div className="space-y-6">
      {/* Campaign header */}
      <div className="flex items-center gap-3">
        <h3 className="text-lg font-semibold">{m.campaignName}</h3>
        <Badge variant="outline">{m.channel}</Badge>
        <StatusBadge status={m.status} />
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          icon={Users}
          label="Recipients"
          value={m.totalRecipients}
        />
        <MetricCard
          icon={Send}
          label="Sent"
          value={m.totalSent}
          subtext={`${m.sendRate}% send rate`}
        />
        <MetricCard
          icon={MessageSquare}
          label="Responded"
          value={m.totalResponded}
          subtext={`${m.responseRate}% response rate`}
        />
        <MetricCard
          icon={UserCheck}
          label="Converted"
          value={m.totalConverted}
          subtext={`${m.conversionRate}% conversion`}
          highlight
        />
      </div>

      {/* Failed count warning */}
      {m.totalFailed > 0 && (
        <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-400 px-4 py-2 rounded-md">
          <AlertTriangle className="h-4 w-4" />
          {m.totalFailed} message(s) failed to send
        </div>
      )}

      {/* Funnel visualization */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Conversion Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FunnelChart stages={m.funnel} />
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  icon: Icon, label, value, subtext, highlight,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  subtext?: string;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? 'border-green-200 dark:border-green-800' : ''}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <p className={`text-2xl font-bold ${highlight ? 'text-green-600' : ''}`}>
          {value.toLocaleString()}
        </p>
        {subtext && (
          <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
        )}
      </CardContent>
    </Card>
  );
}

function FunnelChart({ stages }: { stages: FunnelStage[] }) {
  if (stages.length === 0) {
    return <p className="text-center text-muted-foreground py-4">No data</p>;
  }

  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className="space-y-3">
      {stages.map((stage, idx) => {
        const widthPct = Math.max(5, (stage.count / maxCount) * 100);
        const isLast = idx === stages.length - 1;
        const colors = STAGE_COLORS[idx] ?? STAGE_COLORS[0];

        return (
          <div key={stage.stage}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{stage.stage}</span>
              <span className="text-sm text-muted-foreground">
                {stage.count.toLocaleString()}
                {stage.percentage < 100 && (
                  <span className="ml-1 text-xs">({stage.percentage}%)</span>
                )}
              </span>
            </div>
            <div className="w-full bg-muted rounded h-8 relative overflow-hidden">
              <div
                className={`h-8 rounded transition-all flex items-center justify-center ${colors}`}
                style={{ width: `${widthPct}%` }}
              >
                {widthPct > 20 && (
                  <span className="text-xs font-medium text-white">
                    {stage.count}
                  </span>
                )}
              </div>
            </div>
            {/* Drop-off indicator */}
            {!isLast && stages[idx + 1] && stage.count > 0 && (
              <div className="text-xs text-muted-foreground ml-2 mt-0.5">
                {stage.count - stages[idx + 1].count} dropped ({
                  Math.round(((stage.count - stages[idx + 1].count) / stage.count) * 100)
                }%)
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DRAFT: 'bg-muted text-muted-foreground',
    ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
    PAUSED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400',
    COMPLETED: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
    ARCHIVED: 'bg-muted text-muted-foreground',
  };
  return (
    <Badge variant="outline" className={styles[status] ?? ''}>
      {status}
    </Badge>
  );
}

const STAGE_COLORS = [
  'bg-blue-500',
  'bg-indigo-500',
  'bg-purple-500',
  'bg-green-500',
];

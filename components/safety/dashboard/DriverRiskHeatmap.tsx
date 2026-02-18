'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { apiUrl, cn } from '@/lib/utils';
import { getMcContext } from '@/lib/utils/query-keys';
import { Users } from 'lucide-react';

interface DriverRisk {
  driverId: string;
  driverName: string;
  driverNumber: string;
  overallCompliance: number;
  statusSummary: {
    medicalCard: { status: string };
    cdl: { status: string };
    drugTests: { status: string };
  };
}

async function fetchDriverRisks(): Promise<{ data: DriverRisk[]; total: number }> {
  const response = await fetch(apiUrl('/api/safety/driver-compliance?limit=50'));
  if (!response.ok) throw new Error('Failed to fetch driver compliance');
  const json = await response.json();
  // API returns { data: DriverComplianceData[] }
  return json;
}

function getRiskLevel(score: number): 'ok' | 'warn' | 'critical' {
  if (score >= 80) return 'ok';
  if (score >= 60) return 'warn';
  return 'critical';
}

const riskStyles = {
  ok: { card: 'border-green-300 bg-green-50 dark:bg-green-950/10', score: 'text-green-700', badge: 'bg-green-100 text-green-800 border-green-200' },
  warn: { card: 'border-yellow-300 bg-yellow-50 dark:bg-yellow-950/10', score: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  critical: { card: 'border-red-300 bg-red-50 dark:bg-red-950/10', score: 'text-red-700', badge: 'bg-red-100 text-red-800 border-red-200' },
};

function hasCriticalIssue(driver: DriverRisk): string | null {
  const s = driver.statusSummary;
  if (s.medicalCard?.status === 'EXPIRED') return 'Med Exp';
  if (s.cdl?.status === 'EXPIRED') return 'CDL Exp';
  if (s.medicalCard?.status === 'EXPIRING') return 'Med Soon';
  if (s.cdl?.status === 'EXPIRING') return 'CDL Soon';
  if (s.drugTests?.status === 'MISSING') return 'No Drug Test';
  return null;
}

export default function DriverRiskHeatmap() {
  const mcContext = getMcContext();
  const { data, isLoading } = useQuery({
    queryKey: ['driver-risk-heatmap', mcContext],
    queryFn: fetchDriverRisks,
    refetchInterval: 60000,
  });

  const drivers: DriverRisk[] = (data as any)?.data ?? [];

  // Sort: critical first, then warn, then ok
  const sorted = [...drivers].sort((a, b) => a.overallCompliance - b.overallCompliance);

  const counts = {
    ok: sorted.filter((d) => getRiskLevel(d.overallCompliance) === 'ok').length,
    warn: sorted.filter((d) => getRiskLevel(d.overallCompliance) === 'warn').length,
    critical: sorted.filter((d) => getRiskLevel(d.overallCompliance) === 'critical').length,
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Driver Risk Heatmap</CardTitle>
              <CardDescription>Compliance status at a glance — click any card to review</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />{counts.critical} Critical</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />{counts.warn} At Risk</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />{counts.ok} Compliant</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">No driver compliance data available</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {sorted.map((driver) => {
              const risk = getRiskLevel(driver.overallCompliance);
              const styles = riskStyles[risk];
              const issue = hasCriticalIssue(driver);
              return (
                <Link
                  key={driver.driverId}
                  href={`/dashboard/safety/compliance?driver=${driver.driverId}`}
                  className={cn(
                    'rounded-lg border p-2.5 flex flex-col gap-1 hover:opacity-80 transition-opacity',
                    styles.card
                  )}
                >
                  <span className="text-xs font-medium leading-tight truncate">{driver.driverName}</span>
                  <span className={cn('text-lg font-bold leading-none', styles.score)}>
                    {driver.overallCompliance}%
                  </span>
                  {issue && (
                    <Badge variant="outline" className={cn('text-xs px-1 py-0 self-start', styles.badge)}>
                      {issue}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle, CheckCircle2, XCircle, Clock, Heart,
} from 'lucide-react';
import { apiUrl, formatDate } from '@/lib/utils';

interface DriverMedicalInfo {
  driverId: string;
  driverName: string;
  driverNumber: string;
  cardNumber: string;
  expirationDate: string;
  medicalExaminerName: string | null;
}

interface MedicalDataResponse {
  drivers: DriverMedicalInfo[];
}

async function fetchMedicalExpirations(): Promise<MedicalDataResponse> {
  const res = await fetch(apiUrl('/api/safety/driver-compliance?include=medicalCards'));
  if (!res.ok) throw new Error('Failed to fetch medical expirations');
  return res.json();
}

/** Calculate days until a date string from now. */
function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

type AlertTier = 'expired' | 'critical' | 'warning' | 'caution' | 'ok';

function getAlertTier(days: number): AlertTier {
  if (days <= 0) return 'expired';
  if (days <= 14) return 'critical';
  if (days <= 30) return 'warning';
  if (days <= 90) return 'caution';
  return 'ok';
}

const TIER_CONFIG: Record<AlertTier, { bg: string; text: string; border: string; label: string }> = {
  expired: { bg: 'bg-red-50 dark:bg-red-950/20', text: 'text-red-700 dark:text-red-400', border: 'border-red-300', label: 'Expired' },
  critical: { bg: 'bg-red-50 dark:bg-red-950/20', text: 'text-red-600 dark:text-red-400', border: 'border-red-200', label: 'Critical (<14d)' },
  warning: { bg: 'bg-orange-50 dark:bg-orange-950/20', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200', label: 'Warning (<30d)' },
  caution: { bg: 'bg-yellow-50 dark:bg-yellow-950/20', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-200', label: 'Caution (<90d)' },
  ok: { bg: 'bg-green-50 dark:bg-green-950/20', text: 'text-green-700 dark:text-green-400', border: 'border-green-200', label: 'Valid' },
};

function TierIcon({ tier }: { tier: AlertTier }) {
  switch (tier) {
    case 'expired': return <XCircle className="h-5 w-5 text-red-600" />;
    case 'critical': return <AlertTriangle className="h-5 w-5 text-red-600" />;
    case 'warning': return <AlertTriangle className="h-5 w-5 text-orange-600" />;
    case 'caution': return <Clock className="h-5 w-5 text-yellow-600" />;
    case 'ok': return <CheckCircle2 className="h-5 w-5 text-green-600" />;
  }
}

export default function MedicalExamCountdown() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['medical-expirations'],
    queryFn: fetchMedicalExpirations,
    refetchInterval: 300000,
  });

  const sortedDrivers = useMemo(() => {
    if (!data?.drivers) return [];
    return [...data.drivers].sort((a, b) => {
      return daysUntil(a.expirationDate) - daysUntil(b.expirationDate);
    });
  }, [data]);

  const stats = useMemo(() => {
    const counts: Record<AlertTier, number> = { expired: 0, critical: 0, warning: 0, caution: 0, ok: 0 };
    for (const d of sortedDrivers) {
      const tier = getAlertTier(daysUntil(d.expirationDate));
      counts[tier]++;
    }
    return counts;
  }, [sortedDrivers]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading medical exam data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Error loading medical exam data</p>
      </div>
    );
  }

  const total = sortedDrivers.length;
  const validPercent = total > 0 ? Math.round((stats.ok / total) * 100) : 0;
  const needsAction = stats.expired + stats.critical + stats.warning;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard title="Total Drivers" value={total} icon={<Heart className="h-4 w-4" />} />
        <SummaryCard
          title="Needs Action"
          value={needsAction}
          icon={<AlertTriangle className="h-4 w-4 text-red-600" />}
          valueClass={needsAction > 0 ? 'text-red-600' : 'text-green-600'}
        />
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Compliance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{validPercent}%</div>
            <Progress value={validPercent} className="h-2 mt-2" />
          </CardContent>
        </Card>
        <SummaryCard title="Expiring <90d" value={stats.caution} icon={<Clock className="h-4 w-4 text-yellow-600" />} />
      </div>

      {/* Alert Breakdown */}
      <div className="grid gap-3 grid-cols-5">
        {(['expired', 'critical', 'warning', 'caution', 'ok'] as AlertTier[]).map((tier) => {
          const cfg = TIER_CONFIG[tier];
          return (
            <div key={tier} className={`rounded-lg p-3 text-center border ${cfg.bg} ${cfg.border}`}>
              <div className={`text-2xl font-bold ${cfg.text}`}>{stats[tier]}</div>
              <div className="text-xs text-muted-foreground">{cfg.label}</div>
            </div>
          );
        })}
      </div>

      {/* Driver List — sorted by most urgent */}
      <Card>
        <CardHeader>
          <CardTitle>Medical Card Expirations</CardTitle>
          <CardDescription>All drivers sorted by expiration urgency</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedDrivers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No medical card data found</p>
          ) : (
            <div className="space-y-2">
              {sortedDrivers.map((driver) => {
                const days = daysUntil(driver.expirationDate);
                const tier = getAlertTier(days);
                const cfg = TIER_CONFIG[tier];

                return (
                  <div
                    key={driver.driverId}
                    className={`flex items-center justify-between p-3 border rounded-lg ${cfg.bg} ${cfg.border}`}
                  >
                    <div className="flex items-center gap-3">
                      <TierIcon tier={tier} />
                      <div>
                        <div className="font-medium text-sm">{driver.driverName}</div>
                        <div className="text-xs text-muted-foreground">
                          #{driver.driverNumber} &middot; Card: {driver.cardNumber}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">
                          Exp: {formatDate(driver.expirationDate)}
                        </div>
                        <div className={`text-sm font-semibold ${cfg.text}`}>
                          {days <= 0
                            ? `Expired ${Math.abs(days)}d ago`
                            : `${days}d remaining`}
                        </div>
                      </div>
                      <Badge className={`${cfg.bg} ${cfg.text} ${cfg.border}`}>
                        {cfg.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  title, value, icon, valueClass = '',
}: {
  title: string; value: number; icon: React.ReactNode; valueClass?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueClass}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

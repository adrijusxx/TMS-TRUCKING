'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  RefreshCw,
  Wifi,
  WifiOff,
  AlertTriangle,
  CircleDot,
  MapPin,
  MessageCircle,
  CreditCard,
  Truck as TruckIcon,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ConnectionTestButton from './ConnectionTestButton';

// ============================================
// Types
// ============================================

interface IntegrationHealth {
  provider: string;
  label: string;
  status: 'connected' | 'degraded' | 'disconnected' | 'unconfigured';
  lastSyncAt?: string | null;
  errorCount?: number;
  details?: Record<string, unknown>;
}

// ============================================
// Constants
// ============================================

const STATUS_CONFIG = {
  connected: { variant: 'success' as const, label: 'Connected', icon: Wifi },
  degraded: { variant: 'warning' as const, label: 'Degraded', icon: AlertTriangle },
  disconnected: { variant: 'error' as const, label: 'Disconnected', icon: WifiOff },
  unconfigured: { variant: 'neutral' as const, label: 'Not Configured', icon: CircleDot },
};

const PROVIDER_ICONS: Record<string, React.ElementType> = {
  SAMSARA: TruckIcon,
  QUICKBOOKS: FileText,
  TELEGRAM: MessageCircle,
  STRIPE: CreditCard,
  GOOGLE_MAPS: MapPin,
};

const TESTABLE_PROVIDERS = ['SAMSARA', 'QUICKBOOKS', 'TELEGRAM'];

// ============================================
// Component
// ============================================

export default function IntegrationHealthDashboard() {
  const [integrations, setIntegrations] = useState<IntegrationHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/integrations/health');
      const data = await res.json();
      if (data.success) {
        setIntegrations(data.data);
      }
    } catch {
      // Silently fail — status cards will show as loading
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHealth();
  };

  if (loading) {
    return <HealthDashboardSkeleton />;
  }

  const connectedCount = integrations.filter((i) => i.status === 'connected').length;
  const totalConfigured = integrations.filter((i) => i.status !== 'unconfigured').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Integration Health</CardTitle>
            <CardDescription>
              {connectedCount}/{totalConfigured} integrations connected
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn('h-4 w-4 mr-1', refreshing && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration) => (
            <IntegrationStatusCard
              key={integration.provider}
              integration={integration}
              onRefresh={fetchHealth}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// Status Card
// ============================================

function IntegrationStatusCard({
  integration,
  onRefresh,
}: {
  integration: IntegrationHealth;
  onRefresh: () => void;
}) {
  const config = STATUS_CONFIG[integration.status];
  const ProviderIcon = PROVIDER_ICONS[integration.provider] ?? CircleDot;
  const StatusIcon = config.icon;
  const isTestable = TESTABLE_PROVIDERS.includes(integration.provider);

  return (
    <div className="rounded-lg border p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ProviderIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{integration.label}</span>
        </div>
        <Badge variant={config.variant} size="xs" dot>
          <StatusIcon className="h-3 w-3 mr-1" />
          {config.label}
        </Badge>
      </div>

      {/* Details */}
      <div className="space-y-1 text-xs text-muted-foreground">
        {integration.lastSyncAt && (
          <p>Last sync: {formatRelativeTime(integration.lastSyncAt)}</p>
        )}
        {integration.errorCount !== undefined && integration.errorCount > 0 && (
          <p className="text-yellow-600 dark:text-yellow-400">
            {integration.errorCount} error(s) in last 24h
          </p>
        )}
        {!!integration.details?.reason && (
          <p>{String(integration.details.reason)}</p>
        )}
        {!!integration.details?.environment && (
          <p>Environment: {String(integration.details.environment)}</p>
        )}
        {!!integration.details?.subscriptionStatus && (
          <p>Status: {String(integration.details.subscriptionStatus)}</p>
        )}
      </div>

      {/* Test Button */}
      {isTestable && integration.status !== 'unconfigured' && (
        <ConnectionTestButton
          provider={integration.provider as 'SAMSARA' | 'QUICKBOOKS' | 'TELEGRAM'}
          size="xs"
          onComplete={onRefresh}
        />
      )}
    </div>
  );
}

// ============================================
// Skeleton
// ============================================

function HealthDashboardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-64 mt-1" />
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-4 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// Helpers
// ============================================

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

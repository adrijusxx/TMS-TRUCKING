/**
 * Document Expiration Alerts
 *
 * Shows the driver's compliance documents with their expiration status.
 * Color-coded: green (>90 days), yellow (30-90), red (<30), expired.
 * Links to upload/renew flow when applicable.
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileWarning,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { apiUrl } from '@/lib/utils';

interface DriverDocument {
  id: string;
  documentType: string;
  label: string;
  status: 'COMPLETE' | 'MISSING' | 'EXPIRING' | 'EXPIRED';
  expirationDate: string | null;
  daysUntilExpiry: number | null;
}

interface DocumentAlerts {
  documents: DriverDocument[];
  expiredCount: number;
  expiringCount: number;
}

/** Human-readable labels for DQF document types. */
const DOC_TYPE_LABELS: Record<string, string> = {
  APPLICATION: 'Application',
  ROAD_TEST: 'Road Test',
  PREVIOUS_EMPLOYMENT_VERIFICATION: 'Employment Verification',
  ANNUAL_REVIEW: 'Annual Review',
  MEDICAL_EXAMINERS_CERTIFICATE: 'Medical Card',
  CDL_COPY: 'CDL Copy',
  SSN_COPY: 'SSN Copy',
  MVR_RECORD: 'MVR Record',
  PSP_RECORD: 'PSP Record',
  DRUG_TEST_RESULT: 'Drug Test',
  ALCOHOL_TEST_RESULT: 'Alcohol Test',
  TRAINING_CERTIFICATE: 'Training Certificate',
  OTHER: 'Other Document',
};

type ExpiryTier = 'expired' | 'critical' | 'warning' | 'good' | 'unknown';

function getExpiryTier(daysUntilExpiry: number | null, status: string): ExpiryTier {
  if (status === 'EXPIRED') return 'expired';
  if (status === 'MISSING') return 'critical';
  if (daysUntilExpiry === null) return 'unknown';
  if (daysUntilExpiry <= 0) return 'expired';
  if (daysUntilExpiry <= 30) return 'critical';
  if (daysUntilExpiry <= 90) return 'warning';
  return 'good';
}

const TIER_CONFIG: Record<ExpiryTier, {
  icon: React.ElementType;
  badgeClass: string;
  label: string;
  borderClass: string;
}> = {
  expired: {
    icon: XCircle,
    badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    label: 'Expired',
    borderClass: 'border-l-red-500',
  },
  critical: {
    icon: AlertTriangle,
    badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    label: 'Expiring Soon',
    borderClass: 'border-l-red-400',
  },
  warning: {
    icon: Clock,
    badgeClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    label: 'Expiring',
    borderClass: 'border-l-yellow-500',
  },
  good: {
    icon: CheckCircle,
    badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    label: 'Valid',
    borderClass: 'border-l-green-500',
  },
  unknown: {
    icon: FileWarning,
    badgeClass: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    label: 'Missing',
    borderClass: 'border-l-gray-400',
  },
};

function formatExpiryDate(dateStr: string | null, daysUntil: number | null): string {
  if (!dateStr) return 'No expiration set';
  const date = new Date(dateStr);
  const formatted = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  if (daysUntil === null) return formatted;
  if (daysUntil <= 0) return `Expired on ${formatted}`;
  if (daysUntil === 1) return `Expires tomorrow`;
  if (daysUntil <= 7) return `Expires in ${daysUntil} days`;
  return `Expires ${formatted}`;
}

function DocumentRow({ doc }: { doc: DriverDocument }) {
  const tier = getExpiryTier(doc.daysUntilExpiry, doc.status);
  const config = TIER_CONFIG[tier];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-3 py-3 border-b last:border-b-0 border-l-4 pl-3 ${config.borderClass}`}>
      <Icon className={`h-5 w-5 shrink-0 ${
        tier === 'expired' ? 'text-red-500' :
        tier === 'critical' ? 'text-red-400' :
        tier === 'warning' ? 'text-yellow-500' :
        tier === 'good' ? 'text-green-500' : 'text-gray-400'
      }`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {DOC_TYPE_LABELS[doc.documentType] || doc.label || doc.documentType}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatExpiryDate(doc.expirationDate, doc.daysUntilExpiry)}
        </p>
      </div>
      <Badge className={`text-xs shrink-0 ${config.badgeClass}`}>
        {config.label}
      </Badge>
    </div>
  );
}

interface DocumentExpirationAlertsProps {
  /** If true, only show alerts for documents that need attention. */
  alertsOnly?: boolean;
  /** Maximum number of documents to display. */
  maxItems?: number;
}

export default function DocumentExpirationAlerts({
  alertsOnly = false,
  maxItems,
}: DocumentExpirationAlertsProps) {
  const { data, isLoading } = useQuery<DocumentAlerts>({
    queryKey: ['driver-doc-alerts'],
    queryFn: async () => {
      const response = await fetch(apiUrl('/api/mobile/driver/documents'));
      if (!response.ok) throw new Error('Failed to fetch documents');
      const result = await response.json();
      return result.data as DocumentAlerts;
    },
    refetchInterval: 300000, // 5 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-40 bg-muted rounded" />
            <div className="h-12 bg-muted rounded" />
            <div className="h-12 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.documents.length === 0) return null;

  let documents = data.documents;

  // Sort: expired first, then by days until expiry ascending
  documents.sort((a, b) => {
    const tierA = getExpiryTier(a.daysUntilExpiry, a.status);
    const tierB = getExpiryTier(b.daysUntilExpiry, b.status);
    const tierOrder: Record<ExpiryTier, number> = {
      expired: 0,
      critical: 1,
      unknown: 2,
      warning: 3,
      good: 4,
    };
    const orderDiff = tierOrder[tierA] - tierOrder[tierB];
    if (orderDiff !== 0) return orderDiff;
    return (a.daysUntilExpiry ?? 999) - (b.daysUntilExpiry ?? 999);
  });

  if (alertsOnly) {
    documents = documents.filter((d) => {
      const tier = getExpiryTier(d.daysUntilExpiry, d.status);
      return tier !== 'good';
    });
  }

  if (maxItems) {
    documents = documents.slice(0, maxItems);
  }

  if (documents.length === 0) return null;

  const hasUrgent = data.expiredCount > 0 || data.expiringCount > 0;

  return (
    <Card className={hasUrgent ? 'border-red-200 dark:border-red-900' : undefined}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Documents
          </CardTitle>
          {hasUrgent && (
            <div className="flex gap-1.5">
              {data.expiredCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {data.expiredCount} expired
                </Badge>
              )}
              {data.expiringCount > 0 && (
                <Badge className="text-xs bg-yellow-100 text-yellow-800">
                  {data.expiringCount} expiring
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="divide-y-0">
          {documents.map((doc) => (
            <DocumentRow key={doc.id} doc={doc} />
          ))}
        </div>

        {alertsOnly && data.documents.length > documents.length && (
          <Button variant="ghost" size="sm" className="w-full mt-2 text-xs">
            View all {data.documents.length} documents
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

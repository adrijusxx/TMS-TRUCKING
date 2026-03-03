'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2, XCircle, AlertTriangle, Clock, ShieldCheck,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface DQFChecklistProps {
  dqf: {
    id: string;
    documents: Array<{
      id: string;
      documentType: string;
      status: string;
      expirationDate: string | null;
      document?: {
        id: string;
        title: string;
        fileName: string;
      } | null;
    }>;
  };
  driverId: string;
}

const REQUIRED_DOCUMENTS = [
  { type: 'APPLICATION', label: 'Application for Employment', expires: false },
  { type: 'ROAD_TEST', label: 'Road Test Certificate', expires: false },
  { type: 'PREVIOUS_EMPLOYMENT_VERIFICATION', label: 'Previous Employment Verification', expires: false },
  { type: 'ANNUAL_REVIEW', label: 'Annual Review of Driving Record', expires: true },
  { type: 'MEDICAL_EXAMINERS_CERTIFICATE', label: "Medical Examiner's Certificate", expires: true },
  { type: 'CDL_COPY', label: 'CDL Copy', expires: true },
  { type: 'SSN_COPY', label: 'Social Security Card Copy', expires: false },
  { type: 'MVR_RECORD', label: 'Motor Vehicle Record (MVR)', expires: true },
  { type: 'PSP_RECORD', label: 'Pre-Employment Screening (PSP)', expires: false },
  { type: 'DRUG_TEST_RESULT', label: 'Drug Test Result', expires: false },
  { type: 'ALCOHOL_TEST_RESULT', label: 'Alcohol Test Result', expires: false },
  { type: 'TRAINING_CERTIFICATE', label: 'Training Certificate', expires: true },
];

/** Compute days until expiration from an ISO date string. */
function getDaysUntilExpiration(expirationDate: string | null): number | null {
  if (!expirationDate) return null;
  const expiry = new Date(expirationDate);
  const now = new Date();
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/** Determine color tier based on days remaining. */
function getColorTier(days: number | null): 'green' | 'yellow' | 'red' | 'gray' {
  if (days === null) return 'gray';
  if (days <= 0) return 'red';
  if (days <= 30) return 'red';
  if (days <= 90) return 'yellow';
  return 'green';
}

const TIER_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  green: { bg: 'bg-green-50 dark:bg-green-950/20', text: 'text-green-700 dark:text-green-400', border: 'border-green-200' },
  yellow: { bg: 'bg-yellow-50 dark:bg-yellow-950/20', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-200' },
  red: { bg: 'bg-red-50 dark:bg-red-950/20', text: 'text-red-700 dark:text-red-400', border: 'border-red-200' },
  gray: { bg: 'bg-gray-50 dark:bg-gray-900', text: 'text-gray-500 dark:text-gray-400', border: 'border-gray-200' },
};

function StatusIcon({ status, days }: { status: string; days: number | null }) {
  if (status === 'MISSING') return <XCircle className="h-5 w-5 text-gray-400" />;
  if (status === 'EXPIRED' || (days !== null && days <= 0))
    return <XCircle className="h-5 w-5 text-red-600" />;
  if (days !== null && days <= 30) return <AlertTriangle className="h-5 w-5 text-red-600" />;
  if (days !== null && days <= 90) return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
  if (status === 'COMPLETE') return <CheckCircle2 className="h-5 w-5 text-green-600" />;
  return <Clock className="h-5 w-5 text-gray-400" />;
}

function CountdownBadge({ days }: { days: number | null }) {
  if (days === null) return null;
  const tier = getColorTier(days);
  const styles = TIER_STYLES[tier];

  if (days <= 0) {
    return (
      <Badge className={`${styles.bg} ${styles.text} ${styles.border}`}>
        Expired {Math.abs(days)} day{Math.abs(days) !== 1 ? 's' : ''} ago
      </Badge>
    );
  }

  return (
    <Badge className={`${styles.bg} ${styles.text} ${styles.border}`}>
      {days} day{days !== 1 ? 's' : ''} remaining
    </Badge>
  );
}

export default function DQFChecklist({ dqf, driverId }: DQFChecklistProps) {
  const documentsByType = useMemo(() => {
    const map: Record<string, typeof dqf.documents[number]> = {};
    for (const doc of dqf.documents) {
      map[doc.documentType] = doc;
    }
    return map;
  }, [dqf.documents]);

  const stats = useMemo(() => {
    let complete = 0;
    let missing = 0;
    let expiring = 0;
    let expired = 0;

    for (const req of REQUIRED_DOCUMENTS) {
      const doc = documentsByType[req.type];
      const status = doc?.status || 'MISSING';
      if (status === 'COMPLETE') complete++;
      else if (status === 'MISSING') missing++;
      else if (status === 'EXPIRING') expiring++;
      else if (status === 'EXPIRED') expired++;
    }

    return {
      complete,
      missing,
      expiring,
      expired,
      total: REQUIRED_DOCUMENTS.length,
      percentage: Math.round((complete / REQUIRED_DOCUMENTS.length) * 100),
    };
  }, [documentsByType]);

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            DQF Compliance Checklist
          </CardTitle>
          <CardDescription>
            Driver Qualification File status with expiration tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress */}
            <div className="flex items-center justify-between text-sm">
              <span>Completion: {stats.complete}/{stats.total} documents</span>
              <span className="font-semibold">{stats.percentage}%</span>
            </div>
            <Progress value={stats.percentage} className="h-2" />

            {/* Status Counts */}
            <div className="grid grid-cols-4 gap-3">
              <StatChip label="Complete" count={stats.complete} color="green" />
              <StatChip label="Expiring" count={stats.expiring} color="yellow" />
              <StatChip label="Expired" count={stats.expired} color="red" />
              <StatChip label="Missing" count={stats.missing} color="gray" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Required Documents</CardTitle>
          <CardDescription>All required documents for DOT compliance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {REQUIRED_DOCUMENTS.map((req) => {
              const doc = documentsByType[req.type];
              const status = doc?.status || 'MISSING';
              const days = getDaysUntilExpiration(doc?.expirationDate ?? null);
              const tier = status === 'MISSING'
                ? 'gray'
                : req.expires
                  ? getColorTier(days)
                  : status === 'COMPLETE' ? 'green' : 'gray';
              const styles = TIER_STYLES[tier];

              return (
                <div
                  key={req.type}
                  className={`flex items-center justify-between p-3 border rounded-lg ${styles.bg} ${styles.border}`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <StatusIcon status={status} days={req.expires ? days : null} />
                    <div className="min-w-0">
                      <div className="font-medium text-sm">{req.label}</div>
                      {doc?.expirationDate && (
                        <div className="text-xs text-muted-foreground">
                          Expires: {formatDate(doc.expirationDate)}
                        </div>
                      )}
                      {doc?.document && (
                        <div className="text-xs text-muted-foreground truncate">
                          {doc.document.fileName}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {req.expires && days !== null && <CountdownBadge days={days} />}
                    <StatusBadge status={status} />
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

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'COMPLETE':
      return <Badge className="bg-green-100 text-green-800 border-green-200">Complete</Badge>;
    case 'MISSING':
      return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Missing</Badge>;
    case 'EXPIRING':
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Expiring</Badge>;
    case 'EXPIRED':
      return <Badge className="bg-red-100 text-red-800 border-red-200">Expired</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
}

function StatChip({ label, count, color }: { label: string; count: number; color: string }) {
  const styles = TIER_STYLES[color];
  return (
    <div className={`rounded-lg p-2 text-center ${styles.bg} ${styles.border} border`}>
      <div className={`text-xl font-bold ${styles.text}`}>{count}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2, XCircle, AlertTriangle, ClipboardCheck, FileText, ShieldCheck,
} from 'lucide-react';
import { apiUrl } from '@/lib/utils';

// DOT audit requirement categories per FMCSA §395, §382, §391, etc.
const DOT_AUDIT_CATEGORIES = [
  {
    id: 'dq_files',
    label: 'Driver Qualification Files (Part 391)',
    items: [
      'Application for employment',
      'Motor vehicle record (MVR) — annual',
      'Road test certificate or equivalent',
      'Medical examiner\'s certificate',
      'CDL copy with endorsements',
      'Previous employer inquiries (3 years)',
      'Annual review of driving record',
      'Drug/alcohol pre-employment test results',
    ],
  },
  {
    id: 'drug_testing',
    label: 'Drug & Alcohol Testing (Part 382)',
    items: [
      'Drug & alcohol testing policy',
      'Random selection documentation',
      'Pre-employment test results',
      'Post-accident test results (if applicable)',
      'Return-to-duty records (if applicable)',
      'FMCSA Clearinghouse queries — annual',
      'Consortium/TPA agreement (if applicable)',
    ],
  },
  {
    id: 'hos_records',
    label: 'Hours of Service (Part 395)',
    items: [
      'ELD records — current 6 months',
      'Supporting documents (fuel receipts, bills of lading)',
      'Driver\'s record of duty status',
      'ELD malfunction documentation (if applicable)',
    ],
  },
  {
    id: 'vehicle_maintenance',
    label: 'Vehicle Maintenance (Part 396)',
    items: [
      'Systematic inspection/repair/maintenance program',
      'Driver Vehicle Inspection Reports (DVIRs)',
      'Annual vehicle inspections',
      'Brake inspector qualifications',
    ],
  },
  {
    id: 'accident_register',
    label: 'Accident Register (Part 390)',
    items: [
      'Accident register — last 3 years',
      'Copies of all accident reports',
      'Investigation documentation',
      'Preventable determination records',
    ],
  },
  {
    id: 'insurance',
    label: 'Insurance & Authority',
    items: [
      'Operating authority (MC number)',
      'Proof of insurance (Form BMC-91)',
      'Insurance certificates',
      'Process agent designation (BOC-3)',
    ],
  },
];

interface ReadinessData {
  totalDrivers: number;
  auditReadyDrivers: number;
  readinessPercentage: number;
  commonGaps: Array<{ documentType: string; count: number }>;
  categoryScores?: Record<string, number>;
}

async function fetchAuditReadiness(): Promise<ReadinessData> {
  const res = await fetch(apiUrl('/api/safety/audit-prep'));
  if (!res.ok) throw new Error('Failed to fetch audit readiness');
  const json = await res.json();
  return json.data ?? json;
}

export default function AuditReadinessDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['audit-readiness-full'],
    queryFn: fetchAuditReadiness,
    refetchInterval: 300000,
  });

  const overallScore = data?.readinessPercentage ?? 0;
  const gaps = data?.commonGaps ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading audit readiness data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Error loading audit readiness data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Readiness Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Overall Audit Readiness
          </CardTitle>
          <CardDescription>
            Company-wide DOT audit preparedness assessment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <ReadinessGauge percentage={overallScore} />
              <div className="flex-1 space-y-2">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <StatBlock label="Total Drivers" value={data?.totalDrivers ?? 0} />
                  <StatBlock label="Audit Ready" value={data?.auditReadyDrivers ?? 0} color="text-green-600" />
                  <StatBlock
                    label="Needs Action"
                    value={(data?.totalDrivers ?? 0) - (data?.auditReadyDrivers ?? 0)}
                    color="text-red-600"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Gap Analysis */}
      {gaps.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Compliance Gap Analysis
            </CardTitle>
            <CardDescription>
              Most common missing documents across all drivers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {gaps.slice(0, 10).map((gap) => {
                const total = data?.totalDrivers ?? 1;
                const pct = Math.round((gap.count / total) * 100);
                return (
                  <div key={gap.documentType} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{formatDocType(gap.documentType)}</span>
                      <span className="text-muted-foreground">
                        {gap.count} driver{gap.count !== 1 ? 's' : ''} ({pct}%)
                      </span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* DOT Audit Requirements Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            DOT Audit Requirements Checklist
          </CardTitle>
          <CardDescription>
            FMCSA compliance areas and required documentation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {DOT_AUDIT_CATEGORIES.map((category) => {
              const categoryScore = data?.categoryScores?.[category.id] ?? null;
              return (
                <AuditCategory
                  key={category.id}
                  category={category}
                  score={categoryScore}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Priority Action Items
          </CardTitle>
          <CardDescription>
            Items to address for immediate audit readiness improvement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActionItemsList gaps={gaps} totalDrivers={data?.totalDrivers ?? 0} />
        </CardContent>
      </Card>
    </div>
  );
}

function ReadinessGauge({ percentage }: { percentage: number }) {
  const color = percentage >= 90
    ? 'text-green-600'
    : percentage >= 70
      ? 'text-yellow-600'
      : 'text-red-600';

  return (
    <div className="flex flex-col items-center w-32">
      <div className={`text-4xl font-bold ${color}`}>{percentage}%</div>
      <div className="text-xs text-muted-foreground mt-1">Readiness Score</div>
      <Progress value={percentage} className="h-3 w-full mt-2" />
    </div>
  );
}

function StatBlock({ label, value, color = '' }: { label: string; value: number; color?: string }) {
  return (
    <div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function AuditCategory({
  category,
  score,
}: {
  category: typeof DOT_AUDIT_CATEGORIES[number];
  score: number | null;
}) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-sm">{category.label}</h4>
        {score !== null && (
          <Badge
            className={
              score >= 90
                ? 'bg-green-100 text-green-800'
                : score >= 70
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
            }
          >
            {score}% Complete
          </Badge>
        )}
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {category.items.map((item) => (
          <div key={item} className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionItemsList({
  gaps,
  totalDrivers,
}: {
  gaps: Array<{ documentType: string; count: number }>;
  totalDrivers: number;
}) {
  if (gaps.length === 0) {
    return (
      <div className="text-center py-6">
        <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
        <p className="text-green-700 font-medium">All clear!</p>
        <p className="text-sm text-muted-foreground">No compliance gaps found</p>
      </div>
    );
  }

  const prioritized = [...gaps].sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-3">
      {prioritized.slice(0, 8).map((gap, idx) => {
        const severity = gap.count > totalDrivers * 0.5
          ? 'CRITICAL'
          : gap.count > totalDrivers * 0.25
            ? 'HIGH'
            : 'MEDIUM';

        const severityColors: Record<string, string> = {
          CRITICAL: 'bg-red-100 text-red-800 border-red-200',
          HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
          MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        };

        return (
          <div
            key={gap.documentType}
            className="flex items-center justify-between p-3 border rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium text-muted-foreground w-6">
                {idx + 1}.
              </div>
              <div>
                <div className="font-medium text-sm">{formatDocType(gap.documentType)}</div>
                <div className="text-xs text-muted-foreground">
                  {gap.count} of {totalDrivers} drivers missing this document
                </div>
              </div>
            </div>
            <Badge className={severityColors[severity]}>{severity}</Badge>
          </div>
        );
      })}
    </div>
  );
}

/** Convert enum-style document type to human-readable label. */
function formatDocType(docType: string): string {
  return docType
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

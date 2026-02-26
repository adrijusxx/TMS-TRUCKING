'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiUrl, formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { CheckCircle, XCircle, AlertTriangle, FileText } from 'lucide-react';

interface AuditDocument {
  documentType: string;
  label: string;
  status: 'COMPLETE' | 'MISSING' | 'EXPIRED' | 'EXPIRING';
  expirationDate?: string | null;
}

interface AuditPackage {
  driverId: string;
  driverName: string;
  readinessPercentage: number;
  documents: AuditDocument[];
  totalRequired: number;
  totalComplete: number;
  totalMissing: number;
  totalExpired: number;
  gaps: Array<{
    documentType: string;
    label: string;
    issue: string;
    remediation: string;
    expirationDate?: string | null;
  }> | null;
}

interface ReadinessReport {
  totalDrivers: number;
  auditReadyDrivers: number;
  readinessPercentage: number;
  commonGaps: Array<{ documentType: string; count: number }>;
}

const statusIcons: Record<string, React.ReactNode> = {
  COMPLETE: <CheckCircle className="h-4 w-4 text-green-600" />,
  MISSING: <XCircle className="h-4 w-4 text-red-600" />,
  EXPIRED: <XCircle className="h-4 w-4 text-red-600" />,
  EXPIRING: <AlertTriangle className="h-4 w-4 text-orange-600" />,
};

const statusColors: Record<string, string> = {
  COMPLETE: 'bg-green-100 text-green-800 border-green-200',
  MISSING: 'bg-red-100 text-red-800 border-red-200',
  EXPIRED: 'bg-red-100 text-red-800 border-red-200',
  EXPIRING: 'bg-orange-100 text-orange-800 border-orange-200',
};

export default function AuditPrepDashboard() {
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  const { data: readiness, isLoading: loadingReadiness } = useQuery({
    queryKey: ['audit-readiness'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/safety/audit-prep'));
      if (!res.ok) throw new Error('Failed to fetch readiness');
      const json = await res.json();
      return json.data as ReadinessReport;
    },
  });

  const { data: drivers } = useQuery({
    queryKey: ['drivers-list'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/drivers?limit=200&status=ACTIVE'));
      if (!res.ok) throw new Error('Failed to fetch drivers');
      const json = await res.json();
      return json.data as Array<{
        id: string;
        user: { firstName: string; lastName: string };
      }>;
    },
  });

  const { data: auditPackage, isLoading: loadingPackage } = useQuery({
    queryKey: ['audit-package', selectedDriverId],
    queryFn: async () => {
      const res = await fetch(
        apiUrl(`/api/safety/audit-prep/${selectedDriverId}?includeGaps=true`)
      );
      if (!res.ok) throw new Error('Failed to fetch audit package');
      const json = await res.json();
      return json.data as AuditPackage;
    },
    enabled: !!selectedDriverId,
  });

  return (
    <div className="space-y-6">
      {/* Company Readiness Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Drivers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{readiness?.totalDrivers ?? '-'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Audit Ready</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {readiness?.auditReadyDrivers ?? '-'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Readiness</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{readiness?.readinessPercentage ?? 0}%</div>
            <Progress value={readiness?.readinessPercentage ?? 0} className="h-2 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Common Gaps</CardTitle>
          </CardHeader>
          <CardContent>
            {readiness?.commonGaps.slice(0, 3).map((g) => (
              <div key={g.documentType} className="text-xs text-muted-foreground">
                {g.documentType}: {g.count} drivers
              </div>
            )) ?? <span className="text-muted-foreground">-</span>}
          </CardContent>
        </Card>
      </div>

      {/* Driver Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Driver Audit Package
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select a driver..." />
            </SelectTrigger>
            <SelectContent>
              {(drivers ?? []).map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.user.firstName} {d.user.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {loadingPackage && (
            <p className="text-muted-foreground">Loading audit package...</p>
          )}

          {auditPackage && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="text-lg font-bold">{auditPackage.driverName}</div>
                <Badge
                  variant="outline"
                  className={
                    auditPackage.readinessPercentage === 100
                      ? 'bg-green-100 text-green-800'
                      : 'bg-orange-100 text-orange-800'
                  }
                >
                  {auditPackage.readinessPercentage}% Ready
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {auditPackage.totalComplete}/{auditPackage.totalRequired} complete
                </span>
              </div>

              {/* Document Checklist */}
              <div className="border rounded-lg divide-y">
                {auditPackage.documents.map((doc) => (
                  <div
                    key={doc.documentType}
                    className="flex items-center justify-between p-3"
                  >
                    <div className="flex items-center gap-3">
                      {statusIcons[doc.status]}
                      <span className="text-sm">{doc.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.expirationDate && (
                        <span className="text-xs text-muted-foreground">
                          Exp: {formatDate(doc.expirationDate)}
                        </span>
                      )}
                      <Badge variant="outline" className={statusColors[doc.status]}>
                        {doc.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {/* Gap Analysis */}
              {auditPackage.gaps && auditPackage.gaps.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Gap Analysis & Remediation</h4>
                  <div className="space-y-2">
                    {auditPackage.gaps.map((gap) => (
                      <div
                        key={gap.documentType}
                        className="border rounded p-3 bg-red-50 dark:bg-red-950/20"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span className="font-medium text-sm">{gap.label}</span>
                          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                            {gap.issue}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground ml-6">
                          {gap.remediation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { apiUrl } from '@/lib/utils';

interface HOSStatus {
  driverId: string;
  status: string;
  today: {
    driveTime: number;
    onDutyTime: number;
    offDutyTime: number;
    sleeperTime: number;
  };
  weekly: {
    driveTime: number;
    onDutyTime: number;
  };
  available: {
    driving: number;
    onDuty: number;
    weekly: number;
  };
  violations: string[];
  warnings: string[];
  lastUpdated: string | null;
}

async function fetchHOSStatus() {
  const response = await fetch(apiUrl('/api/mobile/hos/status'));
  if (!response.ok) throw new Error('Failed to fetch HOS status');
  return response.json();
}

export default function HOSStatusCard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['hos-status'],
    queryFn: fetchHOSStatus,
    refetchInterval: 300000, // Refetch every 5 minutes (reduced from 1 minute)
    staleTime: 2 * 60 * 1000, // Data is fresh for 2 minutes
  });

  const hosStatus: HOSStatus | undefined = data?.data;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !hosStatus) {
    return null;
  }

  const getStatusColor = () => {
    if (hosStatus.violations.length > 0) return 'bg-red-100 text-red-800';
    if (hosStatus.warnings.length > 0) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = () => {
    if (hosStatus.violations.length > 0) return 'VIOLATION';
    if (hosStatus.warnings.length > 0) return 'WARNING';
    return 'COMPLIANT';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Hours of Service
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          <Badge className={getStatusColor()}>
            {getStatusText()}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Drive Time</p>
            <p className="text-lg font-semibold">
              {hosStatus.today.driveTime.toFixed(1)}h / 11h
            </p>
            <p className="text-xs text-muted-foreground">
              {hosStatus.available.driving.toFixed(1)}h remaining
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">On Duty Time</p>
            <p className="text-lg font-semibold">
              {hosStatus.today.onDutyTime.toFixed(1)}h / 14h
            </p>
            <p className="text-xs text-muted-foreground">
              {hosStatus.available.onDuty.toFixed(1)}h remaining
            </p>
          </div>
        </div>

        <div className="pt-2 border-t">
          <p className="text-sm text-muted-foreground mb-1">Weekly Total</p>
          <p className="text-sm font-semibold">
            {hosStatus.weekly.onDutyTime.toFixed(1)}h / 70h
          </p>
          <p className="text-xs text-muted-foreground">
            {hosStatus.available.weekly.toFixed(1)}h remaining
          </p>
        </div>

        {(hosStatus.violations.length > 0 || hosStatus.warnings.length > 0) && (
          <div className="space-y-2 pt-2 border-t">
            {hosStatus.violations.length > 0 && (
              <>
                <p className="text-sm font-semibold flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  Violations
                </p>
                {hosStatus.violations.map((violation, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded text-sm bg-red-50 text-red-800"
                  >
                    <p className="text-xs">{violation}</p>
                  </div>
                ))}
              </>
            )}
            {hosStatus.warnings.length > 0 && (
              <>
                <p className="text-sm font-semibold flex items-center gap-2 text-yellow-600">
                  <AlertTriangle className="h-4 w-4" />
                  Warnings
                </p>
                {hosStatus.warnings.map((warning, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded text-sm bg-yellow-50 text-yellow-800"
                  >
                    <p className="text-xs">{warning}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {hosStatus.violations.length === 0 && hosStatus.warnings.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-green-600 pt-2 border-t">
            <CheckCircle className="h-4 w-4" />
            <span>No violations - Compliant</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


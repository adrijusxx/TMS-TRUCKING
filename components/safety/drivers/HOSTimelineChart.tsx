'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';

interface HOSRecord {
  id: string;
  date: string;
  drivingHours: number;
  onDutyHours: number;
  offDutyHours: number;
  sleeperBerthHours: number;
  totalHours: number;
  violations: Array<{
    id: string;
    violationType: string;
    violationDescription: string;
    violationDate: string;
    hoursExceeded: number | null;
  }>;
}

interface HOSTimelineChartProps {
  records: HOSRecord[];
}

const STATUS_COLORS = {
  driving: { bg: 'bg-blue-500', label: 'Driving', color: '#3b82f6' },
  onDuty: { bg: 'bg-orange-500', label: 'On-Duty', color: '#f97316' },
  sleeper: { bg: 'bg-purple-500', label: 'Sleeper', color: '#a855f7' },
  offDuty: { bg: 'bg-green-500', label: 'Off-Duty', color: '#22c55e' },
};

export default function HOSTimelineChart({ records }: HOSTimelineChartProps) {
  if (records.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>HOS Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">No HOS records available</p>
        </CardContent>
      </Card>
    );
  }

  const sortedRecords = [...records].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>HOS Timeline</CardTitle>
        <div className="flex gap-4 text-xs mt-2">
          {Object.entries(STATUS_COLORS).map(([key, val]) => (
            <div key={key} className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded ${val.bg}`} />
              <span className="text-muted-foreground">{val.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500 border-2 border-red-700" />
            <span className="text-muted-foreground">Violation</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sortedRecords.map((record) => {
            const total = record.totalHours || 24;
            const drivingPct = (record.drivingHours / total) * 100;
            const onDutyPct = (record.onDutyHours / total) * 100;
            const sleeperPct = (record.sleeperBerthHours / total) * 100;
            const offDutyPct = (record.offDutyHours / total) * 100;
            const hasViolation = record.violations.length > 0;

            return (
              <div key={record.id} className="flex items-center gap-3">
                <div className="w-20 text-xs text-muted-foreground shrink-0">
                  {formatDate(record.date)}
                </div>
                <div className="flex-1 relative">
                  <div
                    className={`flex h-6 rounded overflow-hidden ${hasViolation ? 'ring-2 ring-red-500' : ''}`}
                  >
                    {drivingPct > 0 && (
                      <div
                        className="bg-blue-500 transition-all"
                        style={{ width: `${drivingPct}%` }}
                        title={`Driving: ${record.drivingHours.toFixed(1)}h`}
                      />
                    )}
                    {onDutyPct > 0 && (
                      <div
                        className="bg-orange-500 transition-all"
                        style={{ width: `${onDutyPct}%` }}
                        title={`On-Duty: ${record.onDutyHours.toFixed(1)}h`}
                      />
                    )}
                    {sleeperPct > 0 && (
                      <div
                        className="bg-purple-500 transition-all"
                        style={{ width: `${sleeperPct}%` }}
                        title={`Sleeper: ${record.sleeperBerthHours.toFixed(1)}h`}
                      />
                    )}
                    {offDutyPct > 0 && (
                      <div
                        className="bg-green-500 transition-all"
                        style={{ width: `${offDutyPct}%` }}
                        title={`Off-Duty: ${record.offDutyHours.toFixed(1)}h`}
                      />
                    )}
                  </div>
                  {hasViolation && (
                    <div
                      className="absolute -right-1 -top-1 w-3 h-3 bg-red-500 rounded-full border border-white"
                      title={record.violations.map((v) => v.violationDescription).join(', ')}
                    />
                  )}
                </div>
                <div className="w-16 text-xs text-right text-muted-foreground shrink-0">
                  {record.drivingHours.toFixed(1)}h drv
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

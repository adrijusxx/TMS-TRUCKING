'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

interface HOSRollingViewProps {
  records: HOSRecord[];
  cycleLimit?: number; // Default 70 hours
  cycleDays?: number; // Default 8 days
}

export default function HOSRollingView({
  records,
  cycleLimit = 70,
  cycleDays = 8,
}: HOSRollingViewProps) {
  const rollingData = useMemo(() => {
    if (records.length === 0) return [];

    const sorted = [...records].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return sorted.map((record, index) => {
      // Calculate rolling total for the last `cycleDays` days
      const startIdx = Math.max(0, index - cycleDays + 1);
      const windowRecords = sorted.slice(startIdx, index + 1);
      const rollingTotal = windowRecords.reduce(
        (sum, r) => sum + r.drivingHours + r.onDutyHours,
        0
      );
      const remaining = Math.max(0, cycleLimit - rollingTotal);
      const pct = Math.min(100, (rollingTotal / cycleLimit) * 100);

      return {
        date: record.date,
        rollingTotal,
        remaining,
        pct,
        dailyDriving: record.drivingHours,
        dailyOnDuty: record.onDutyHours,
        isOverLimit: rollingTotal > cycleLimit,
      };
    });
  }, [records, cycleLimit, cycleDays]);

  if (rollingData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{cycleDays}-Day Rolling Hours</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">No HOS records available</p>
        </CardContent>
      </Card>
    );
  }

  const latest = rollingData[rollingData.length - 1];
  const maxTotal = Math.max(cycleLimit, ...rollingData.map((d) => d.rollingTotal));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{cycleDays}-Day Rolling Hours</CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={
                latest.isOverLimit
                  ? 'bg-red-100 text-red-800 border-red-200'
                  : latest.pct > 85
                    ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    : 'bg-green-100 text-green-800 border-green-200'
              }
            >
              {latest.rollingTotal.toFixed(1)}h / {cycleLimit}h
            </Badge>
            <span className="text-sm text-muted-foreground">
              {latest.remaining.toFixed(1)}h remaining
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          {rollingData.slice(-14).map((day) => {
            const barWidth = (day.rollingTotal / maxTotal) * 100;
            const limitLine = (cycleLimit / maxTotal) * 100;

            return (
              <div key={day.date} className="flex items-center gap-3">
                <div className="w-20 text-xs text-muted-foreground shrink-0">
                  {formatDate(day.date)}
                </div>
                <div className="flex-1 relative h-5">
                  <div
                    className={`h-full rounded transition-all ${
                      day.isOverLimit
                        ? 'bg-red-500'
                        : day.pct > 85
                          ? 'bg-yellow-500'
                          : 'bg-blue-500'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                  {/* Cycle limit line */}
                  <div
                    className="absolute top-0 bottom-0 w-px bg-red-400 border-l border-dashed border-red-400"
                    style={{ left: `${limitLine}%` }}
                    title={`${cycleLimit}h limit`}
                  />
                </div>
                <div className="w-14 text-xs text-right text-muted-foreground shrink-0">
                  {day.rollingTotal.toFixed(1)}h
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-500" /> Under 85%
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-500" /> 85-100%
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500" /> Over Limit
          </div>
          <div className="flex items-center gap-1">
            <div className="w-px h-3 border-l border-dashed border-red-400" /> {cycleLimit}h Limit
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

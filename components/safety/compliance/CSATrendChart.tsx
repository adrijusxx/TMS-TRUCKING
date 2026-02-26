'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CSAScore {
  basicCategory: string;
  percentile: number;
  score?: number;
  trend?: string;
  violationCount: number;
  scoreDate: string;
}

interface CSATrendChartProps {
  history: CSAScore[];
}

const CATEGORY_COLORS: Record<string, string> = {
  UNSAFE_DRIVING: '#ef4444',
  CRASH_INDICATOR: '#f97316',
  HOS_COMPLIANCE: '#eab308',
  VEHICLE_MAINTENANCE: '#22c55e',
  CONTROLLED_SUBSTANCES: '#3b82f6',
  HAZMAT_COMPLIANCE: '#8b5cf6',
  DRIVER_FITNESS: '#ec4899',
};

const CATEGORY_LABELS: Record<string, string> = {
  UNSAFE_DRIVING: 'Unsafe Driving',
  CRASH_INDICATOR: 'Crash Indicator',
  HOS_COMPLIANCE: 'HOS Compliance',
  VEHICLE_MAINTENANCE: 'Vehicle Maint.',
  CONTROLLED_SUBSTANCES: 'Controlled Subst.',
  HAZMAT_COMPLIANCE: 'Hazmat',
  DRIVER_FITNESS: 'Driver Fitness',
};

export default function CSATrendChart({ history }: CSATrendChartProps) {
  const chartData = useMemo(() => {
    if (!history || history.length === 0) return null;

    // Group by month, then by category
    const byMonth = new Map<string, Map<string, number>>();
    const categories = new Set<string>();

    for (const score of history) {
      const month = score.scoreDate.slice(0, 7); // YYYY-MM
      categories.add(score.basicCategory);
      if (!byMonth.has(month)) byMonth.set(month, new Map());
      // Keep the latest score for each category in each month
      byMonth.get(month)!.set(score.basicCategory, score.percentile);
    }

    const months = Array.from(byMonth.keys()).sort();
    if (months.length < 2) return null;

    return { months, categories: Array.from(categories), byMonth };
  }, [history]);

  if (!chartData) {
    return (
      <Card>
        <CardHeader><CardTitle>CSA Score Trends</CardTitle></CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">Not enough historical data for trends</p>
        </CardContent>
      </Card>
    );
  }

  const { months, categories, byMonth } = chartData;
  const width = 600;
  const height = 250;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const xScale = (i: number) => padding.left + (i / (months.length - 1)) * chartW;
  const yScale = (v: number) => padding.top + chartH - (v / 100) * chartH;

  return (
    <Card>
      <CardHeader><CardTitle>CSA Score Trends</CardTitle></CardHeader>
      <CardContent>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((v) => (
            <g key={v}>
              <line
                x1={padding.left} y1={yScale(v)}
                x2={width - padding.right} y2={yScale(v)}
                stroke="hsl(var(--border))" strokeWidth={0.5}
                strokeDasharray={v === 75 ? '4,2' : undefined}
              />
              <text x={padding.left - 5} y={yScale(v) + 3} textAnchor="end" className="fill-muted-foreground" fontSize={10}>
                {v}%
              </text>
            </g>
          ))}
          {/* 75% intervention threshold */}
          <line
            x1={padding.left} y1={yScale(75)}
            x2={width - padding.right} y2={yScale(75)}
            stroke="#ef4444" strokeWidth={1} strokeDasharray="6,3" opacity={0.6}
          />
          <text x={width - padding.right + 2} y={yScale(75) + 3} className="fill-red-500" fontSize={9}>75%</text>

          {/* X-axis labels */}
          {months.map((m, i) => (
            <text key={m} x={xScale(i)} y={height - 5} textAnchor="middle" className="fill-muted-foreground" fontSize={9}>
              {m.slice(5)}
            </text>
          ))}

          {/* Lines per category */}
          {categories.map((cat) => {
            const points = months
              .map((m, i) => {
                const val = byMonth.get(m)?.get(cat);
                return val !== undefined ? { x: xScale(i), y: yScale(val) } : null;
              })
              .filter(Boolean) as { x: number; y: number }[];

            if (points.length < 2) return null;

            const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

            return (
              <g key={cat}>
                <path d={pathD} fill="none" stroke={CATEGORY_COLORS[cat] || '#888'} strokeWidth={2} />
                {points.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={CATEGORY_COLORS[cat] || '#888'} />
                ))}
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-3 text-xs">
          {categories.map((cat) => (
            <div key={cat} className="flex items-center gap-1">
              <div className="w-3 h-1 rounded" style={{ backgroundColor: CATEGORY_COLORS[cat] || '#888' }} />
              <span className="text-muted-foreground">{CATEGORY_LABELS[cat] || cat}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

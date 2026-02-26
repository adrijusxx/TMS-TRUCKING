'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, CheckCircle } from 'lucide-react';

interface CSAScore {
  basicCategory: string;
  percentile: number;
  score?: number;
  trend?: string;
  violationCount: number;
  scoreDate: string;
}

interface CSARecommendationsProps {
  scores: Record<string, CSAScore>;
}

const RECOMMENDATIONS: Record<string, { threshold: number; actions: string[] }> = {
  UNSAFE_DRIVING: {
    threshold: 50,
    actions: [
      'Implement driver coaching program focused on speeding and following distance',
      'Install dash cameras with AI-based event detection',
      'Review and update defensive driving training curriculum',
      'Establish incentive programs for safe driving records',
    ],
  },
  CRASH_INDICATOR: {
    threshold: 50,
    actions: [
      'Conduct root cause analysis for all recent crashes',
      'Review driver hiring criteria and MVR screening process',
      'Implement post-crash drug and alcohol testing compliance',
      'Schedule defensive driving refresher courses',
    ],
  },
  HOS_COMPLIANCE: {
    threshold: 50,
    actions: [
      'Audit ELD compliance and data transfer procedures',
      'Review dispatch planning for realistic scheduling',
      'Train drivers on proper log editing procedures',
      'Monitor 30-minute break and 14-hour window compliance',
    ],
  },
  VEHICLE_MAINTENANCE: {
    threshold: 50,
    actions: [
      'Review and strengthen pre-trip/post-trip inspection processes',
      'Audit preventive maintenance schedules and compliance',
      'Address tire, brake, and lighting defect trends',
      'Ensure DVIR completion and defect resolution tracking',
    ],
  },
  CONTROLLED_SUBSTANCES: {
    threshold: 50,
    actions: [
      'Verify random drug testing pool compliance (50% drug, 10% alcohol)',
      'Audit Clearinghouse queries for all drivers',
      'Review pre-employment testing and documentation',
      'Ensure Return-to-Duty process compliance',
    ],
  },
  HAZMAT_COMPLIANCE: {
    threshold: 50,
    actions: [
      'Verify hazmat endorsement and training compliance',
      'Review shipping paper and placard procedures',
      'Conduct security plan assessment and updates',
      'Ensure proper loading, unloading, and segregation training',
    ],
  },
  DRIVER_FITNESS: {
    threshold: 50,
    actions: [
      'Audit medical certificate expiration tracking system',
      'Verify CDL validity and endorsement compliance',
      'Review driver qualification files for completeness',
      'Implement automated expiration alerts for medical cards',
    ],
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  UNSAFE_DRIVING: 'Unsafe Driving',
  CRASH_INDICATOR: 'Crash Indicator',
  HOS_COMPLIANCE: 'HOS Compliance',
  VEHICLE_MAINTENANCE: 'Vehicle Maintenance',
  CONTROLLED_SUBSTANCES: 'Controlled Substances',
  HAZMAT_COMPLIANCE: 'Hazmat Compliance',
  DRIVER_FITNESS: 'Driver Fitness',
};

export default function CSARecommendations({ scores }: CSARecommendationsProps) {
  const atRiskCategories = Object.entries(scores)
    .filter(([cat, score]) => {
      const rec = RECOMMENDATIONS[cat];
      return rec && score.percentile >= rec.threshold;
    })
    .sort(([, a], [, b]) => b.percentile - a.percentile);

  if (atRiskCategories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-green-600 py-4">
            All BASIC categories are below intervention thresholds. Keep up the good work!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {atRiskCategories.map(([cat, score]) => {
          const rec = RECOMMENDATIONS[cat];
          if (!rec) return null;

          return (
            <div key={cat} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{CATEGORY_LABELS[cat] || cat}</span>
                <Badge
                  variant="outline"
                  className={
                    score.percentile >= 75
                      ? 'bg-red-100 text-red-800 border-red-200'
                      : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                  }
                >
                  {score.percentile.toFixed(0)}%
                </Badge>
              </div>
              <ul className="space-y-1.5">
                {rec.actions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary mt-0.5">•</span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

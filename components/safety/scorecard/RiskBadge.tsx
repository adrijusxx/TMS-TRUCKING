'use client';

import { Badge } from '@/components/ui/badge';

const riskColors: Record<string, string> = {
  LOW: 'bg-green-100 text-green-800 border-green-200',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
  CRITICAL: 'bg-red-100 text-red-800 border-red-200',
};

interface Props {
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  showLabel?: boolean;
}

export default function RiskBadge({ level, showLabel = true }: Props) {
  return (
    <Badge variant="outline" className={riskColors[level]}>
      {showLabel ? `${level} Risk` : level}
    </Badge>
  );
}

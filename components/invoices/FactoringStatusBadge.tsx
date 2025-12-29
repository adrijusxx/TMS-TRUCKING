'use client';

import { Badge } from '@/components/ui/badge';
import { FactoringStatus } from '@prisma/client';

interface FactoringStatusBadgeProps {
  status: FactoringStatus;
  className?: string;
}

const factoringStatusColors: Record<FactoringStatus, string> = {
  NOT_FACTORED: 'bg-gray-100 text-gray-800 border-gray-200',
  SUBMITTED_TO_FACTOR: 'bg-blue-100 text-blue-800 border-blue-200',
  FUNDED: 'bg-green-100 text-green-800 border-green-200',
  RESERVE_RELEASED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

const factoringStatusLabels: Record<FactoringStatus, string> = {
  NOT_FACTORED: 'Not Factored',
  SUBMITTED_TO_FACTOR: 'Submitted',
  FUNDED: 'Funded',
  RESERVE_RELEASED: 'Reserve Released',
};

export function FactoringStatusBadge({ status, className }: FactoringStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={`${factoringStatusColors[status]} ${className || ''}`}
    >
      {factoringStatusLabels[status]}
    </Badge>
  );
}

function formatFactoringStatus(status: FactoringStatus): string {
  return factoringStatusLabels[status];
}


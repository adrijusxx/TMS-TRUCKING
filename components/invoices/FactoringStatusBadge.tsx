'use client';

import { Badge } from '@/components/ui/badge';
import { FactoringStatus } from '@prisma/client';

interface FactoringStatusBadgeProps {
  status: FactoringStatus;
  className?: string;
}

const factoringStatusColors: Record<FactoringStatus, string> = {
  NOT_FACTORED: 'bg-gray-100 text-gray-800 border-gray-200',
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  SUBMITTED_TO_FACTOR: 'bg-blue-100 text-blue-800 border-blue-200',
  APPROVED: 'bg-sky-100 text-sky-800 border-sky-200',
  DECLINED: 'bg-red-100 text-red-800 border-red-200',
  FUNDED: 'bg-green-100 text-green-800 border-green-200',
  RESERVE_RELEASED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

const factoringStatusLabels: Record<FactoringStatus, string> = {
  NOT_FACTORED: 'Not Factored',
  PENDING: 'Pending',
  SUBMITTED_TO_FACTOR: 'Submitted',
  APPROVED: 'Approved',
  DECLINED: 'Declined',
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


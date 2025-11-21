'use client';

import { Badge } from '@/components/ui/badge';
import { InvoiceSubStatus } from '@prisma/client';

interface InvoiceSubStatusBadgeProps {
  status: InvoiceSubStatus | null | undefined;
  className?: string;
}

const subStatusColors: Record<InvoiceSubStatus, string> = {
  NOT_YET_DUE: 'bg-blue-100 text-blue-800 border-blue-200',
  DUE_SOON: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  OVERDUE: 'bg-red-100 text-red-800 border-red-200',
  PARTIALLY_PAID: 'bg-orange-100 text-orange-800 border-orange-200',
  DISPUTED: 'bg-purple-100 text-purple-800 border-purple-200',
  WRITTEN_OFF: 'bg-gray-100 text-gray-800 border-gray-200',
  PAID: 'bg-green-100 text-green-800 border-green-200',
};

const subStatusLabels: Record<InvoiceSubStatus, string> = {
  NOT_YET_DUE: 'Not Yet Due',
  DUE_SOON: 'Due Soon',
  OVERDUE: 'Overdue',
  PARTIALLY_PAID: 'Partially Paid',
  DISPUTED: 'Disputed',
  WRITTEN_OFF: 'Written Off',
  PAID: 'Paid',
};

export function InvoiceSubStatusBadge({ status, className }: InvoiceSubStatusBadgeProps) {
  if (!status) return null;

  return (
    <Badge
      variant="outline"
      className={`${subStatusColors[status]} ${className || ''}`}
    >
      {subStatusLabels[status]}
    </Badge>
  );
}

export function formatSubStatus(status: InvoiceSubStatus | null | undefined): string {
  if (!status) return '';
  return subStatusLabels[status];
}

/**
 * Calculate sub-status based on invoice data
 */
export function calculateSubStatus(params: {
  dueDate: Date | string;
  balance: number;
  total: number;
  status: string;
  disputedAt?: Date | string | null;
  writtenOffAt?: Date | string | null;
}): InvoiceSubStatus | null {
  const { dueDate, balance, total, status, disputedAt, writtenOffAt } = params;

  // Check written off first
  if (writtenOffAt) {
    return 'WRITTEN_OFF';
  }

  // Check disputed
  if (disputedAt) {
    return 'DISPUTED';
  }

  // Check if paid
  if (status === 'PAID' || balance <= 0) {
    return 'PAID';
  }

  // Check partially paid
  if (balance < total && balance > 0) {
    return 'PARTIALLY_PAID';
  }

  // Calculate aging
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dueDateOnly = new Date(due);
  dueDateOnly.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - dueDateOnly.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    // Not yet due
    if (diffDays >= -5) {
      return 'DUE_SOON'; // Due within 5 days
    }
    return 'NOT_YET_DUE';
  }

  // Overdue
  return 'OVERDUE';
}


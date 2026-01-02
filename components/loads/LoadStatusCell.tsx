'use client';

import * as React from 'react';
import { LoadStatus, LoadDispatchStatus } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { statusColors, formatStatus } from '@/lib/config/entities/loads';
import { DispatchStatusBadge } from '@/components/loads/DispatchStatusSelector';

interface LoadStatusCellProps {
  loadId: string;
  status: LoadStatus;
  dispatchStatus?: LoadDispatchStatus | null;
}

export function LoadStatusCell({ loadId, status, dispatchStatus }: LoadStatusCellProps) {
  // Show dispatchStatus if set, otherwise show main status
  if (dispatchStatus) {
    return <DispatchStatusBadge status={dispatchStatus} />;
  }

  return (
    <Badge variant="outline" className={statusColors[status]}>
      {formatStatus(status)}
    </Badge>
  );
}

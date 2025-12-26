'use client';

import * as React from 'react';
import { LoadStatus } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { statusColors, formatStatus } from '@/lib/config/entities/loads';

interface LoadStatusCellProps {
  loadId: string;
  status: LoadStatus;
}

export function LoadStatusCell({ loadId, status }: LoadStatusCellProps) {
  return (
    <Badge variant="outline" className={statusColors[status]}>
      {formatStatus(status)}
    </Badge>
  );
}



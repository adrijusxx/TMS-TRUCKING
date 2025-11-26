'use client';

import * as React from 'react';
import { LoadStatus } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { InlineStatusEditor } from './InlineStatusEditor';
import { usePermissions } from '@/hooks/usePermissions';
import { statusColors, formatStatus } from '@/lib/config/entities/loads';

interface LoadStatusCellProps {
  loadId: string;
  status: LoadStatus;
}

export function LoadStatusCell({ loadId, status }: LoadStatusCellProps) {
  const { can } = usePermissions();
  
  if (can('loads.edit')) {
    return (
      <InlineStatusEditor
        loadId={loadId}
        currentStatus={status}
      />
    );
  }
  
  return (
    <Badge variant="outline" className={statusColors[status]}>
      {formatStatus(status)}
    </Badge>
  );
}


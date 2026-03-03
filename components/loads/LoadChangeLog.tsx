'use client';

import { useQuery } from '@tanstack/react-query';
import { formatDateTime, apiUrl } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRightLeft,
  Clock,
  DollarSign,
  UserCheck,
  Truck,
  AlertCircle,
  FileText,
} from 'lucide-react';

// ----- Types -----

interface ChangeEntry {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

interface ChangeLogEntry {
  id: string;
  action: string;
  description: string | null;
  user: { id: string; name: string; email: string } | null;
  changes: ChangeEntry[];
  createdAt: string;
}

interface LoadChangeLogProps {
  loadId: string;
  className?: string;
}

// ----- Constants -----

/** Fields we highlight with special formatting */
const CRITICAL_FIELDS = new Set([
  'revenue', 'driverPay', 'status', 'driverId', 'customerId',
  'dispatchStatus', 'totalExpenses', 'netProfit',
]);

const ACTION_LABELS: Record<string, { label: string; variant: 'info' | 'warning' | 'success' | 'error' | 'neutral' }> = {
  CREATE: { label: 'Created', variant: 'success' },
  UPDATE: { label: 'Updated', variant: 'info' },
  DELETE: { label: 'Deleted', variant: 'error' },
  STATUS_CHANGE: { label: 'Status Change', variant: 'warning' },
  OVERRIDE: { label: 'Override', variant: 'error' },
};

// ----- Helpers -----

function getFieldIcon(field: string) {
  if (field === 'revenue' || field === 'driverPay' || field === 'totalExpenses' || field === 'netProfit') {
    return <DollarSign className="h-3.5 w-3.5" />;
  }
  if (field === 'status' || field === 'dispatchStatus') {
    return <ArrowRightLeft className="h-3.5 w-3.5" />;
  }
  if (field === 'driverId') {
    return <Truck className="h-3.5 w-3.5" />;
  }
  if (field === 'customerId') {
    return <UserCheck className="h-3.5 w-3.5" />;
  }
  return <FileText className="h-3.5 w-3.5" />;
}

function formatFieldName(field: string): string {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .replace('Id', 'ID')
    .trim();
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return 'None';
  if (typeof value === 'number') return value.toLocaleString();
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string') {
    // Format enum-style strings
    if (value === value.toUpperCase() && value.includes('_')) {
      return value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    }
    return value;
  }
  return JSON.stringify(value);
}

// ----- Component -----

export function LoadChangeLog({ loadId, className }: LoadChangeLogProps) {
  const { data, isLoading, error } = useQuery<ChangeLogEntry[]>({
    queryKey: ['load-changelog', loadId],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/api/loads/${loadId}/changelog?limit=50`));
      if (!res.ok) throw new Error('Failed to fetch changelog');
      const json = await res.json();
      return json.data;
    },
    enabled: !!loadId,
  });

  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-muted-foreground p-4', className)}>
        <AlertCircle className="h-4 w-4" />
        <span>Failed to load change history</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-muted-foreground p-4', className)}>
        <Clock className="h-4 w-4" />
        <span>No changes recorded yet</span>
      </div>
    );
  }

  return (
    <div className={cn('space-y-0', className)}>
      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

        {data.map((entry, idx) => {
          const actionConfig = ACTION_LABELS[entry.action] ?? {
            label: entry.action,
            variant: 'neutral' as const,
          };
          const criticalChanges = entry.changes.filter((c) => CRITICAL_FIELDS.has(c.field));
          const otherChanges = entry.changes.filter((c) => !CRITICAL_FIELDS.has(c.field));
          const isLast = idx === data.length - 1;

          return (
            <div key={entry.id} className={cn('relative pl-10 pb-5', isLast && 'pb-0')}>
              {/* Timeline dot */}
              <div className="absolute left-2.5 top-1 h-3 w-3 rounded-full border-2 border-background bg-muted-foreground/40" />

              <div className="space-y-1.5">
                {/* Header row */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={actionConfig.variant} size="xs">
                    {actionConfig.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {entry.user ? entry.user.name : 'System'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(entry.createdAt)}
                  </span>
                </div>

                {/* Description */}
                {entry.description && criticalChanges.length === 0 && otherChanges.length === 0 && (
                  <p className="text-sm text-foreground">{entry.description}</p>
                )}

                {/* Critical field changes (highlighted) */}
                {criticalChanges.length > 0 && (
                  <div className="space-y-1">
                    {criticalChanges.map((change, ci) => (
                      <FieldChangeRow key={ci} change={change} critical />
                    ))}
                  </div>
                )}

                {/* Other field changes (compact) */}
                {otherChanges.length > 0 && (
                  <div className="space-y-0.5">
                    {otherChanges.slice(0, 5).map((change, ci) => (
                      <FieldChangeRow key={ci} change={change} />
                    ))}
                    {otherChanges.length > 5 && (
                      <span className="text-xs text-muted-foreground">
                        +{otherChanges.length - 5} more field(s)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ----- Sub-component -----

function FieldChangeRow({
  change,
  critical = false,
}: {
  change: ChangeEntry;
  critical?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 text-xs rounded px-1.5 py-0.5',
        critical && 'bg-muted/50 font-medium'
      )}
    >
      <span className="text-muted-foreground shrink-0">
        {getFieldIcon(change.field)}
      </span>
      <span className="text-muted-foreground shrink-0">
        {formatFieldName(change.field)}:
      </span>
      <span className="text-red-500 line-through truncate max-w-[120px]">
        {formatValue(change.oldValue)}
      </span>
      <ArrowRightLeft className="h-3 w-3 text-muted-foreground shrink-0" />
      <span className="text-green-600 truncate max-w-[120px]">
        {formatValue(change.newValue)}
      </span>
    </div>
  );
}

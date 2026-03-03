'use client';

/**
 * BackgroundCheckStatus
 *
 * Visual checklist showing background check progress for a lead.
 * Displays each check type with its current status, allows initiating
 * new checks and updating existing ones.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  CheckCircle2, Circle, Clock, AlertTriangle,
  Loader2, Play, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

const CHECK_TYPES = ['MVR', 'CRIMINAL', 'EMPLOYMENT_HISTORY', 'DRUG_TEST', 'CREDIT'] as const;
type CheckType = typeof CHECK_TYPES[number];
type CheckStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'NOT_STARTED';

interface CheckRecord {
  checkId: string;
  checkType: CheckType;
  status: CheckStatus;
  results?: string | null;
  initiatedAt: string;
  completedAt?: string | null;
}

interface BackgroundCheckStatusProps {
  leadId: string;
}

const CHECK_LABELS: Record<CheckType, string> = {
  MVR: 'Motor Vehicle Record',
  CRIMINAL: 'Criminal Background',
  EMPLOYMENT_HISTORY: 'Employment History',
  DRUG_TEST: 'Drug Test',
  CREDIT: 'Credit Check',
};

const REQUIRED_CHECKS: CheckType[] = ['MVR', 'CRIMINAL', 'DRUG_TEST'];

export default function BackgroundCheckStatus({ leadId }: BackgroundCheckStatusProps) {
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ success: boolean; data: CheckRecord[] }>({
    queryKey: ['background-checks', leadId],
    queryFn: async () => {
      const res = await fetch(`/api/crm/leads/${leadId}/background-checks`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const initiateMutation = useMutation({
    mutationFn: async (checkType: string) => {
      const res = await fetch(`/api/crm/leads/${leadId}/background-checks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkType }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed to initiate check');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['background-checks', leadId] });
      toast.success('Background check initiated');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { checkId: string; status: string }) => {
      const res = await fetch(`/api/crm/leads/${leadId}/background-checks`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['background-checks', leadId] });
      setUpdatingId(null);
      toast.success('Check status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  const checks = data?.data ?? [];
  const checkMap = new Map(checks.map((c) => [c.checkType, c]));

  const completedCount = CHECK_TYPES.filter(
    (t) => checkMap.get(t)?.status === 'COMPLETED'
  ).length;
  const totalCount = CHECK_TYPES.length;
  const pct = Math.round((completedCount / totalCount) * 100);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Background Checks</CardTitle>
          <Badge variant={pct === 100 ? 'default' : 'secondary'}>
            {completedCount}/{totalCount} Complete
          </Badge>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2 mt-2">
          <div
            className="h-2 rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {CHECK_TYPES.map((type) => {
          const record = checkMap.get(type);
          const isRequired = REQUIRED_CHECKS.includes(type);

          return (
            <CheckRow
              key={type}
              type={type}
              label={CHECK_LABELS[type]}
              record={record}
              isRequired={isRequired}
              isUpdating={updatingId === record?.checkId}
              onInitiate={() => initiateMutation.mutate(type)}
              onUpdateStatus={(status) => {
                if (!record) return;
                setUpdatingId(record.checkId);
                updateMutation.mutate({ checkId: record.checkId, status });
              }}
              initiating={initiateMutation.isPending}
            />
          );
        })}
      </CardContent>
    </Card>
  );
}

function CheckRow({
  type, label, record, isRequired, isUpdating,
  onInitiate, onUpdateStatus, initiating,
}: {
  type: CheckType;
  label: string;
  record?: CheckRecord;
  isRequired: boolean;
  isUpdating: boolean;
  onInitiate: () => void;
  onUpdateStatus: (status: string) => void;
  initiating: boolean;
}) {
  const status = record?.status ?? 'NOT_STARTED';

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-md border bg-card">
      <div className="flex items-center gap-3">
        <StatusIcon status={status} />
        <div>
          <p className="text-sm font-medium">{label}</p>
          <div className="flex items-center gap-1.5">
            <StatusBadge status={status} />
            {isRequired && (
              <span className="text-[10px] text-red-500 font-medium">REQUIRED</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {!record ? (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={onInitiate}
            disabled={initiating}
          >
            {initiating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3 mr-1" />}
            Start
          </Button>
        ) : status !== 'COMPLETED' ? (
          <Select
            value=""
            onValueChange={onUpdateStatus}
            disabled={isUpdating}
          >
            <SelectTrigger className="h-7 w-[120px] text-xs">
              <SelectValue placeholder="Update..." />
            </SelectTrigger>
            <SelectContent>
              {status === 'PENDING' && (
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              )}
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        )}
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'COMPLETED': return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    case 'IN_PROGRESS': return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
    case 'PENDING': return <Clock className="h-5 w-5 text-yellow-500" />;
    case 'FAILED': return <AlertTriangle className="h-5 w-5 text-red-500" />;
    default: return <Circle className="h-5 w-5 text-muted-foreground" />;
  }
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
    IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
    PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400',
    FAILED: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
    NOT_STARTED: 'bg-muted text-muted-foreground',
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${variants[status] ?? variants.NOT_STARTED}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

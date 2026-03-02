'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, ShieldAlert, AlertTriangle, FileSearch, Shield } from 'lucide-react';
import { apiUrl } from '@/lib/utils';

interface SafetyEvent {
  id: string;
  type: 'accident' | 'claim' | 'inspection';
  date: string;
  title: string;
  description: string;
  status: string;
  severity?: string;
  truckNumber?: string;
  details: Record<string, unknown>;
}

interface SafetyHistoryResponse {
  data: SafetyEvent[];
  meta: { totalCount: number };
}

interface DriverSafetyHistoryTabProps {
  driverId: string;
}

type EventTypeFilter = 'all' | 'accident' | 'claim' | 'inspection';

const TYPE_FILTERS: { value: EventTypeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'accident', label: 'Accidents' },
  { value: 'claim', label: 'Claims' },
  { value: 'inspection', label: 'Inspections' },
];

const TYPE_BADGE_CONFIG: Record<string, { variant: 'error' | 'warning' | 'info'; icon: typeof ShieldAlert }> = {
  accident: { variant: 'error', icon: AlertTriangle },
  claim: { variant: 'warning', icon: FileSearch },
  inspection: { variant: 'info', icon: Shield },
};

const STATUS_VARIANT_MAP: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  RESOLVED: 'success',
  CLOSED: 'success',
  COMPLETED: 'success',
  REPORTED: 'info',
  OPEN: 'warning',
  PENDING: 'warning',
  IN_PROGRESS: 'info',
  UNDER_INVESTIGATION: 'warning',
  INVESTIGATION_COMPLETE: 'info',
  DENIED: 'error',
};

const SEVERITY_VARIANT_MAP: Record<string, 'neutral' | 'warning' | 'error'> = {
  MINOR: 'neutral',
  MODERATE: 'warning',
  MAJOR: 'error',
  CRITICAL: 'error',
  FATAL: 'error',
};

async function fetchSafetyHistory(
  driverId: string,
  typeFilter: EventTypeFilter
): Promise<SafetyHistoryResponse> {
  const params = new URLSearchParams();
  if (typeFilter !== 'all') params.set('type', typeFilter);

  const url = apiUrl(`/api/drivers/${driverId}/safety-history?${params.toString()}`);
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch safety history');
  return response.json();
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ');
}

export default function DriverSafetyHistoryTab({ driverId }: DriverSafetyHistoryTabProps) {
  const [activeFilter, setActiveFilter] = useState<EventTypeFilter>('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['driver-safety-history', driverId, activeFilter],
    queryFn: () => fetchSafetyHistory(driverId, activeFilter),
    enabled: !!driverId,
  });

  const events = data?.data ?? [];
  const totalCount = data?.meta?.totalCount ?? 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            Safety History
          </CardTitle>
          {totalCount > 0 && (
            <Badge variant="neutral" size="sm">
              {totalCount} {totalCount === 1 ? 'event' : 'events'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Type filter pills */}
        <div className="flex gap-2">
          {TYPE_FILTERS.map((filter) => (
            <Button
              key={filter.value}
              variant={activeFilter === filter.value ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setActiveFilter(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="text-center py-8 text-sm text-destructive">
            Failed to load safety history. Please try again.
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && events.length === 0 && (
          <EmptyState activeFilter={activeFilter} />
        )}

        {/* Table */}
        {!isLoading && !error && events.length > 0 && (
          <SafetyEventsTable events={events} />
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ activeFilter }: { activeFilter: EventTypeFilter }) {
  const filterLabel = activeFilter === 'all'
    ? 'safety events'
    : activeFilter === 'accident'
      ? 'accidents'
      : activeFilter === 'claim'
        ? 'claims'
        : 'inspections';

  return (
    <div className="text-center py-12">
      <ShieldAlert className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
      <p className="text-sm text-muted-foreground">
        No {filterLabel} found for this driver.
      </p>
    </div>
  );
}

function SafetyEventsTable({ events }: { events: SafetyEvent[] }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Date</TableHead>
            <TableHead className="w-[110px]">Type</TableHead>
            <TableHead>Title</TableHead>
            <TableHead className="w-[130px]">Status</TableHead>
            <TableHead className="w-[100px]">Severity</TableHead>
            <TableHead className="w-[90px]">Truck</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <SafetyEventRow key={`${event.type}-${event.id}`} event={event} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function SafetyEventRow({ event }: { event: SafetyEvent }) {
  const typeConfig = TYPE_BADGE_CONFIG[event.type];
  const statusVariant = STATUS_VARIANT_MAP[event.status] ?? 'neutral';
  const severityVariant = event.severity
    ? (SEVERITY_VARIANT_MAP[event.severity] ?? 'neutral')
    : undefined;

  return (
    <TableRow>
      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
        {formatDate(event.date)}
      </TableCell>
      <TableCell>
        <Badge variant={typeConfig.variant} size="xs" className="capitalize">
          {event.type}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{event.title}</p>
          <p className="text-xs text-muted-foreground truncate max-w-[260px]">
            {event.description}
          </p>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={statusVariant} size="xs">
          {formatStatus(event.status)}
        </Badge>
      </TableCell>
      <TableCell>
        {event.severity ? (
          <Badge variant={severityVariant} size="xs">
            {event.severity}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">--</span>
        )}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {event.truckNumber ?? '--'}
      </TableCell>
    </TableRow>
  );
}

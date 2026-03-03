'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  History,
  ChevronDown,
  User,
  ArrowRight,
} from 'lucide-react';

// ============================================
// Types
// ============================================

interface AuditChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

interface AuditEntry {
  id: string;
  area: string | null;
  action: string;
  description: string | null;
  changes: AuditChange[];
  user: { id: string; name: string; email: string } | null;
  createdAt: string;
}

interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// ============================================
// Settings Areas
// ============================================

const SETTINGS_AREAS = [
  { value: 'all', label: 'All Areas' },
  { value: 'general', label: 'General' },
  { value: 'notifications', label: 'Notifications' },
  { value: 'integrations', label: 'Integrations' },
  { value: 'security', label: 'Security' },
  { value: 'appearance', label: 'Appearance' },
  { value: 'billing', label: 'Billing' },
  { value: 'company', label: 'Company' },
  { value: 'settlement-automation', label: 'Settlement Automation' },
  { value: 'role-permissions', label: 'Role Permissions' },
  { value: 'menu-visibility', label: 'Menu Visibility' },
  { value: 'custom-fields', label: 'Custom Fields' },
  { value: 'scheduled-jobs', label: 'Scheduled Jobs' },
];

// ============================================
// Component
// ============================================

export default function SettingsAuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedArea, setSelectedArea] = useState('all');
  const [offset, setOffset] = useState(0);

  const fetchAuditLog = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '20', offset: String(offset) });
      if (selectedArea !== 'all') params.set('area', selectedArea);

      const res = await fetch(`/api/settings/audit-log?${params}`);
      const data = await res.json();

      if (data.success) {
        setEntries((prev) => (offset === 0 ? data.data : [...prev, ...data.data]));
        setPagination(data.pagination);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [selectedArea, offset]);

  useEffect(() => {
    setOffset(0);
    setEntries([]);
  }, [selectedArea]);

  useEffect(() => {
    fetchAuditLog();
  }, [fetchAuditLog]);

  const handleLoadMore = () => {
    if (pagination?.hasMore) {
      setOffset((prev) => prev + 20);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Settings Audit Log</CardTitle>
              <CardDescription>
                History of settings changes
                {pagination && ` (${pagination.total} total)`}
              </CardDescription>
            </div>
          </div>
          <Select value={selectedArea} onValueChange={setSelectedArea}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by area" />
            </SelectTrigger>
            <SelectContent>
              {SETTINGS_AREAS.map((area) => (
                <SelectItem key={area.value} value={area.value}>
                  {area.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading && entries.length === 0 ? (
          <AuditLogSkeleton />
        ) : entries.length === 0 ? (
          <EmptyState area={selectedArea} />
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <AuditEntryCard key={entry.id} entry={entry} />
            ))}

            {pagination?.hasMore && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Load More
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// Audit Entry Card
// ============================================

function AuditEntryCard({ entry }: { entry: AuditEntry }) {
  const [expanded, setExpanded] = useState(false);
  const hasChanges = entry.changes && entry.changes.length > 0;

  return (
    <div className="rounded-lg border p-3 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          {entry.user && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span className="font-medium text-foreground">{entry.user.name}</span>
            </span>
          )}
          {entry.area && (
            <Badge variant="secondary" size="xs">
              {entry.area}
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {formatTimestamp(entry.createdAt)}
        </span>
      </div>

      {/* Description */}
      {entry.description && (
        <p className="text-sm text-muted-foreground">{entry.description}</p>
      )}

      {/* Changes Toggle */}
      {hasChanges && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs px-2"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Hide' : 'Show'} {entry.changes.length} change(s)
          </Button>

          {expanded && (
            <div className="space-y-1 pl-2 border-l-2 border-muted">
              {entry.changes.map((change, idx) => (
                <ChangeRow key={idx} change={change} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================
// Change Row
// ============================================

function ChangeRow({ change }: { change: AuditChange }) {
  return (
    <div className="flex items-center gap-2 text-xs py-0.5">
      <span className="font-medium text-foreground min-w-[120px]">
        {formatFieldName(change.field)}
      </span>
      <span className="text-muted-foreground truncate max-w-[120px]">
        {formatValue(change.oldValue)}
      </span>
      <ArrowRight className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
      <span className="font-medium text-foreground truncate max-w-[120px]">
        {formatValue(change.newValue)}
      </span>
    </div>
  );
}

// ============================================
// Empty State & Skeleton
// ============================================

function EmptyState({ area }: { area: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <History className="h-8 w-8 text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground">
        No settings changes recorded
        {area !== 'all' ? ` for ${area}` : ''}
      </p>
    </div>
  );
}

function AuditLogSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-lg border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-3 w-48" />
        </div>
      ))}
    </div>
  );
}

// ============================================
// Helpers
// ============================================

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function formatFieldName(field: string): string {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '(empty)';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

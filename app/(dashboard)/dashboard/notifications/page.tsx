'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bell, Truck, FileText, DollarSign, AlertTriangle, Users,
  Wrench, Clock, ExternalLink, CheckCircle2, XCircle, Receipt,
  Ban, Search, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { formatDateTime, apiUrl } from '@/lib/utils';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'loads', label: 'Loads' },
  { value: 'accounting', label: 'Accounting' },
  { value: 'fleet', label: 'Fleet' },
  { value: 'safety', label: 'Safety' },
  { value: 'crm', label: 'CRM' },
  { value: 'system', label: 'System' },
];

const PRIORITIES = [
  { value: 'all', label: 'All Priorities' },
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'WARNING', label: 'Warning' },
  { value: 'INFO', label: 'Info' },
];

const READ_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'false', label: 'Unread' },
  { value: 'true', label: 'Read' },
];

function getTypeIcon(type: string) {
  switch (type) {
    case 'LOAD_ASSIGNED': case 'LOAD_UPDATED': case 'DETENTION_DETECTED': case 'BILLING_HOLD':
      return <Truck className="h-4 w-4 text-blue-500" />;
    case 'LOAD_DELIVERED':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'LOAD_CANCELLED':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'RATE_CON_MISSING':
      return <FileText className="h-4 w-4 text-amber-500" />;
    case 'INVOICE_PAID': case 'SETTLEMENT_GENERATED': case 'SETTLEMENT_APPROVED': case 'SETTLEMENT_PAID':
      return <DollarSign className="h-4 w-4 text-green-500" />;
    case 'INVOICE_CREATED':
      return <Receipt className="h-4 w-4 text-blue-500" />;
    case 'INVOICE_OVERDUE':
      return <DollarSign className="h-4 w-4 text-red-500" />;
    case 'MAINTENANCE_DUE': case 'MAINTENANCE_COMPLETED': case 'DORMANT_EQUIPMENT': case 'DRIVER_IDLE_ALERT':
      return <Wrench className="h-4 w-4 text-orange-500" />;
    case 'TRUCK_OUT_OF_SERVICE':
      return <Ban className="h-4 w-4 text-red-500" />;
    case 'HOS_VIOLATION':
      return <Clock className="h-4 w-4 text-red-500" />;
    case 'DOCUMENT_EXPIRING':
      return <FileText className="h-4 w-4 text-yellow-500" />;
    case 'SYSTEM_ALERT':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case 'LEAD_FOLLOW_UP_DUE': case 'LEAD_SLA_ALERT': case 'LEAD_NEW_APPLICATION':
      return <Users className="h-4 w-4 text-purple-500" />;
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
}

function getPriorityBadge(priority: string) {
  if (priority === 'CRITICAL') return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">CRITICAL</span>;
  if (priority === 'WARNING') return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">WARNING</span>;
  return null;
}

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [priority, setPriority] = useState('all');
  const [readFilter, setReadFilter] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 25;

  const queryParams = new URLSearchParams();
  queryParams.set('limit', String(limit));
  queryParams.set('page', String(page));
  if (search) queryParams.set('search', search);
  if (category !== 'all') queryParams.set('category', category);
  if (priority !== 'all') queryParams.set('priority', priority);
  if (readFilter !== 'all') queryParams.set('read', readFilter);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications-history', search, category, priority, readFilter, page],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/api/notifications?${queryParams.toString()}`));
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    staleTime: 15000,
  });

  const markReadMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch(apiUrl('/api/notifications'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: ids }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications-history'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(apiUrl('/api/notifications'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-history'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const notifications = data?.data || [];
  const meta = data?.meta || { total: 0, page: 1, totalPages: 1, unreadCount: 0 };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {meta.unreadCount > 0 ? `${meta.unreadCount} unread` : 'All caught up'} &middot; {meta.total} total
          </p>
        </div>
        {meta.unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            Mark All Read
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notifications..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-8"
          />
        </div>
        <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={(v) => { setPriority(v); setPage(1); }}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={readFilter} onValueChange={(v) => { setReadFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {READ_FILTERS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Notification list */}
      <div className="border rounded-lg divide-y">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No notifications found</div>
        ) : (
          notifications.map((n: any) => (
            <div
              key={n.id}
              className={cn(
                'p-4 cursor-pointer hover:bg-muted/50 transition-colors flex items-start gap-3',
                !n.read && 'bg-blue-50/50 dark:bg-blue-950/20'
              )}
              onClick={() => {
                if (!n.read) markReadMutation.mutate([n.id]);
                if (n.link) router.push(n.link);
              }}
            >
              <div className="mt-0.5 flex-shrink-0">{getTypeIcon(n.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{n.title}</p>
                  {getPriorityBadge(n.priority)}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[11px] text-muted-foreground">{formatDateTime(n.createdAt)}</span>
                  <span className="text-[11px] text-muted-foreground capitalize">{n.type.replace(/_/g, ' ').toLowerCase()}</span>
                  {n.link && (
                    <span className="text-[11px] text-primary flex items-center gap-0.5">
                      View <ExternalLink className="h-3 w-3" />
                    </span>
                  )}
                </div>
              </div>
              {!n.read && (
                <div className={cn(
                  'h-2 w-2 rounded-full mt-1 flex-shrink-0',
                  n.priority === 'CRITICAL' ? 'bg-red-500 animate-pulse' :
                  n.priority === 'WARNING' ? 'bg-amber-500' : 'bg-blue-600'
                )} />
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {meta.page} of {meta.totalPages} ({meta.total} notifications)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

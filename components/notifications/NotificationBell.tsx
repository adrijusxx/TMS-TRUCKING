'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Bell,
  Truck,
  FileText,
  DollarSign,
  AlertTriangle,
  Users,
  Wrench,
  Clock,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Receipt,
  Ban,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDateTime, apiUrl } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

/** Notification type → category mapping for filtering */
const CATEGORY_MAP: Record<string, string> = {
  LOAD_ASSIGNED: 'loads',
  LOAD_UPDATED: 'loads',
  LOAD_DELIVERED: 'loads',
  LOAD_CANCELLED: 'loads',
  DETENTION_DETECTED: 'loads',
  BILLING_HOLD: 'loads',
  RATE_CON_MISSING: 'loads',
  INVOICE_PAID: 'accounting',
  INVOICE_CREATED: 'accounting',
  INVOICE_OVERDUE: 'accounting',
  SETTLEMENT_GENERATED: 'accounting',
  SETTLEMENT_APPROVED: 'accounting',
  SETTLEMENT_PAID: 'accounting',
  MAINTENANCE_DUE: 'fleet',
  MAINTENANCE_COMPLETED: 'fleet',
  DORMANT_EQUIPMENT: 'fleet',
  DRIVER_IDLE_ALERT: 'fleet',
  TRUCK_OUT_OF_SERVICE: 'fleet',
  HOS_VIOLATION: 'safety',
  DOCUMENT_EXPIRING: 'safety',
  SYSTEM_ALERT: 'system',
  LEAD_FOLLOW_UP_DUE: 'crm',
  LEAD_SLA_ALERT: 'crm',
  LEAD_NEW_APPLICATION: 'crm',
};

/** Category filter options */
const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'loads', label: 'Loads' },
  { key: 'accounting', label: 'Accounting' },
  { key: 'fleet', label: 'Fleet' },
  { key: 'safety', label: 'Safety' },
  { key: 'crm', label: 'CRM' },
  { key: 'system', label: 'System' },
] as const;

/** Icon for notification type */
function getTypeIcon(type: string) {
  switch (type) {
    case 'LOAD_ASSIGNED':
    case 'LOAD_UPDATED':
    case 'DETENTION_DETECTED':
    case 'BILLING_HOLD':
      return <Truck className="h-4 w-4 text-blue-500" />;
    case 'LOAD_DELIVERED':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'LOAD_CANCELLED':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'RATE_CON_MISSING':
      return <FileText className="h-4 w-4 text-amber-500" />;
    case 'INVOICE_PAID':
    case 'SETTLEMENT_GENERATED':
    case 'SETTLEMENT_APPROVED':
    case 'SETTLEMENT_PAID':
      return <DollarSign className="h-4 w-4 text-green-500" />;
    case 'INVOICE_CREATED':
      return <Receipt className="h-4 w-4 text-blue-500" />;
    case 'INVOICE_OVERDUE':
      return <DollarSign className="h-4 w-4 text-red-500" />;
    case 'MAINTENANCE_DUE':
    case 'MAINTENANCE_COMPLETED':
    case 'DORMANT_EQUIPMENT':
    case 'DRIVER_IDLE_ALERT':
      return <Wrench className="h-4 w-4 text-orange-500" />;
    case 'TRUCK_OUT_OF_SERVICE':
      return <Ban className="h-4 w-4 text-red-500" />;
    case 'HOS_VIOLATION':
      return <Clock className="h-4 w-4 text-red-500" />;
    case 'DOCUMENT_EXPIRING':
      return <FileText className="h-4 w-4 text-yellow-500" />;
    case 'SYSTEM_ALERT':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case 'LEAD_FOLLOW_UP_DUE':
    case 'LEAD_SLA_ALERT':
    case 'LEAD_NEW_APPLICATION':
      return <Users className="h-4 w-4 text-purple-500" />;
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
}

async function fetchNotifications() {
  const response = await fetch(apiUrl('/api/notifications?unreadOnly=false&limit=30'));
  if (!response.ok) throw new Error('Failed to fetch notifications');
  return response.json();
}

async function markAsRead(notificationIds: string[]) {
  const response = await fetch(apiUrl('/api/notifications'), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notificationIds }),
  });
  if (!response.ok) throw new Error('Failed to mark as read');
  return response.json();
}

async function markAllAsRead() {
  const response = await fetch(apiUrl('/api/notifications'), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ markAllAsRead: true }),
  });
  if (!response.ok) throw new Error('Failed to mark all as read');
  return response.json();
}

export default function NotificationBell() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [category, setCategory] = useState('all');

  useEffect(() => { setMounted(true); }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    refetchInterval: 30000, // 30 seconds
    staleTime: 15000,
  });

  const markReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const allNotifications: any[] = data?.data || [];
  const unreadCount: number = data?.meta?.unreadCount || 0;

  // Filter by category
  const notifications = category === 'all'
    ? allNotifications
    : allNotifications.filter((n: any) => CATEGORY_MAP[n.type] === category);

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markReadMutation.mutate([notification.id]);
    }
    // Use the link field from the notification (set by triggers)
    if (notification.link) {
      router.push(notification.link);
      setIsOpen(false);
    }
  };

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="relative" aria-label="Notifications" disabled>
        <Bell className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
            >
              Mark all read
            </Button>
          )}
        </div>

        {/* Category filter tabs */}
        <div className="flex gap-1 px-3 py-2 border-b overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={cn(
                'px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors',
                category === cat.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <ScrollArea className="h-[380px]">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {category === 'all' ? 'No notifications' : `No ${category} notifications`}
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification: any) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-3 cursor-pointer hover:bg-muted/50 transition-colors',
                    !notification.read && 'bg-blue-50/50 dark:bg-blue-950/30'
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex-shrink-0">
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight">{notification.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[11px] text-muted-foreground">
                          {formatDateTime(notification.createdAt)}
                        </span>
                        {notification.link && (
                          <span className="text-[11px] text-primary flex items-center gap-0.5">
                            View <ExternalLink className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </div>
                    {notification.priority === 'CRITICAL' && !notification.read && (
                      <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse mt-1 flex-shrink-0" />
                    )}
                    {notification.priority === 'WARNING' && !notification.read && (
                      <div className="h-2 w-2 rounded-full bg-amber-500 mt-1 flex-shrink-0" />
                    )}
                    {(!notification.priority || notification.priority === 'INFO') && !notification.read && (
                      <div className="h-2 w-2 rounded-full bg-blue-600 mt-1 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-8 text-xs text-muted-foreground"
            onClick={() => {
              router.push('/dashboard/notifications');
              setIsOpen(false);
            }}
          >
            View All Notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

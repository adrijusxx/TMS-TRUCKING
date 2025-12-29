'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDateTime, apiUrl } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

async function fetchNotifications() {
  const response = await fetch(apiUrl('/api/notifications?unreadOnly=false&limit=10'));
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
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Only render after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    refetchInterval: 120000, // Refetch every 2 minutes (reduced from 30 seconds)
    staleTime: 60000, // Data is fresh for 1 minute
  });

  const markReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const notifications = data?.data || [];
  const unreadCount = data?.meta?.unreadCount || 0;

  const handleNotificationClick = (notification: any) => {
    if (!notification.readAt) {
      markReadMutation.mutate([notification.id]);
    }
    // Navigate to relevant page based on notification type
    if (notification.relatedLoadId) {
      window.location.href = `/dashboard/loads/${notification.relatedLoadId}`;
    }
  };

  if (!mounted) {
    // Return a placeholder with the same dimensions to prevent layout shift
    return (
      <Button variant="ghost" size="icon" className="relative" disabled>
        <Bell className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
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
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
            >
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification: any) => (
                <div
                  key={notification.id}
                  className={`p-4 cursor-pointer hover:bg-muted transition-colors ${
                    !notification.readAt ? 'bg-blue-50 dark:bg-blue-950' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDateTime(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.readAt && (
                      <div className="h-2 w-2 rounded-full bg-blue-600 mt-1" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}


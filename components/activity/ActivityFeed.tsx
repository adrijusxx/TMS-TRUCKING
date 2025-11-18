'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

async function fetchActivityLogs(filters?: {
  userId?: string;
  entityType?: string;
  entityId?: string;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (filters?.userId) params.set('userId', filters.userId);
  if (filters?.entityType) params.set('entityType', filters.entityType);
  if (filters?.entityId) params.set('entityId', filters.entityId);
  if (filters?.limit) params.set('limit', filters.limit.toString());

  const response = await fetch(`/api/activity?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch activity logs');
  return response.json();
}

interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string | null;
  metadata: any;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  createdAt: string;
}

interface ActivityFeedProps {
  filters?: {
    userId?: string;
    entityType?: string;
    entityId?: string;
    limit?: number;
  };
}

export default function ActivityFeed({ filters }: ActivityFeedProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['activity-logs', filters],
    queryFn: () => fetchActivityLogs(filters),
    refetchInterval: 300000, // Refresh every 5 minutes (reduced from 30 seconds)
    staleTime: 2 * 60 * 1000, // Data is fresh for 2 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Failed to load activity feed</p>
        </CardContent>
      </Card>
    );
  }

  const logs: ActivityLog[] = data?.data || [];

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      case 'ASSIGN':
        return 'bg-purple-100 text-purple-800';
      case 'STATUS_CHANGE':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity Feed
        </CardTitle>
        <CardDescription>Recent system activities</CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No activity to display
          </p>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 pb-4 border-b last:border-0">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    {log.user ? (
                      <span className="text-xs font-medium">
                        {log.user.firstName[0]}
                        {log.user.lastName[0]}
                      </span>
                    ) : (
                      <span className="text-xs">S</span>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className={getActionColor(log.action)}>
                      {log.action}
                    </Badge>
                    <span className="text-sm font-medium">{log.entityType}</span>
                    {log.user && (
                      <span className="text-sm text-muted-foreground">
                        by {log.user.firstName} {log.user.lastName}
                      </span>
                    )}
                  </div>
                  {log.description && (
                    <p className="text-sm text-muted-foreground mb-1">{log.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


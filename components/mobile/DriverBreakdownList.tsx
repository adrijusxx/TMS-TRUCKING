'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, MessageSquare, Clock, MapPin } from 'lucide-react';
import { formatDate, formatDateTime, apiUrl } from '@/lib/utils';
import Link from 'next/link';

interface Breakdown {
  id: string;
  breakdownNumber: string;
  status: string;
  priority: string;
  breakdownType: string;
  description: string;
  location: string;
  city?: string;
  state?: string;
  truck: {
    number: string;
  };
  reportedAt: string;
  dispatchedAt?: string;
  repairCompletedAt?: string;
}

async function fetchBreakdowns() {
  const response = await fetch(apiUrl('/api/mobile/breakdowns'));
  if (!response.ok) throw new Error('Failed to fetch breakdowns');
  return response.json();
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    REPORTED: 'bg-yellow-500 text-white',
    DISPATCHED: 'bg-blue-500 text-white',
    IN_PROGRESS: 'bg-orange-500 text-white',
    WAITING_PARTS: 'bg-purple-500 text-white',
    COMPLETED: 'bg-green-500 text-white',
    RESOLVED: 'bg-green-500 text-white',
  };
  return colors[status] || 'bg-gray-500 text-white';
}

function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    LOW: 'bg-gray-100 text-gray-800',
    MEDIUM: 'bg-blue-100 text-blue-800',
    HIGH: 'bg-orange-100 text-orange-800',
    CRITICAL: 'bg-red-100 text-red-800',
  };
  return colors[priority] || 'bg-gray-100 text-gray-800';
}

export default function DriverBreakdownList() {
  const { data, isLoading } = useQuery({
    queryKey: ['driver-breakdowns'],
    queryFn: fetchBreakdowns,
  });

  const breakdowns: Breakdown[] = data?.data?.breakdowns || [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading breakdowns...</div>
        </CardContent>
      </Card>
    );
  }

  if (breakdowns.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Breakdown Cases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No breakdown cases yet</p>
            <p className="text-sm mt-1">Report a breakdown above to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Breakdown Cases ({breakdowns.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {breakdowns.map((breakdown) => (
          <Link
            key={breakdown.id}
            href={`/mobile/driver/breakdowns/${breakdown.id}`}
            className="block"
          >
            <Card className="hover:bg-muted transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold">Case #{breakdown.breakdownNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      Truck #{breakdown.truck.number}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <Badge className={getStatusColor(breakdown.status)}>
                      {breakdown.status.replace(/_/g, ' ')}
                    </Badge>
                    <Badge variant="outline" className={getPriorityColor(breakdown.priority)}>
                      {breakdown.priority}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 mt-3">
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">{breakdown.breakdownType.replace(/_/g, ' ')}</span>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {breakdown.description}
                  </p>

                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {breakdown.location}
                      {breakdown.city && breakdown.state && `, ${breakdown.city}, ${breakdown.state}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Reported {formatDateTime(breakdown.reportedAt)}</span>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">View messages</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}


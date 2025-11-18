'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, AlertTriangle, FileText, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { formatDate, apiUrl } from '@/lib/utils';

interface Deadline {
  id: string;
  type: 'LOAD_PICKUP' | 'LOAD_DELIVERY' | 'INVOICE_DUE' | 'DOCUMENT_EXPIRY';
  title: string;
  date: string;
  entityId: string;
  entityType: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

async function fetchUpcomingDeadlines() {
  const response = await fetch(apiUrl('/api/dashboard/deadlines'));
  if (!response.ok) throw new Error('Failed to fetch deadlines');
  return response.json();
}

function getDeadlineIcon(type: string) {
  switch (type) {
    case 'LOAD_PICKUP':
    case 'LOAD_DELIVERY':
      return Calendar;
    case 'INVOICE_DUE':
      return DollarSign;
    case 'DOCUMENT_EXPIRY':
      return FileText;
    default:
      return AlertTriangle;
  }
}

function getDeadlineUrl(type: string, entityId: string) {
  switch (type) {
    case 'LOAD_PICKUP':
    case 'LOAD_DELIVERY':
      return `/dashboard/loads/${entityId}`;
    case 'INVOICE_DUE':
      return `/dashboard/invoices/${entityId}`;
    case 'DOCUMENT_EXPIRY':
      return type.includes('DRIVER') ? `/dashboard/drivers/${entityId}` : `/dashboard/trucks/${entityId}`;
    default:
      return '#';
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'HIGH':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'LOW':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export default function UpcomingDeadlines() {
  const { data, isLoading } = useQuery({
    queryKey: ['upcoming-deadlines'],
    queryFn: fetchUpcomingDeadlines,
  });

  const deadlines: Deadline[] = data?.data || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Upcoming Deadlines
            </CardTitle>
            <CardDescription>Important dates and deadlines</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            Loading deadlines...
          </div>
        ) : deadlines.length === 0 ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No upcoming deadlines
          </div>
        ) : (
          <div className="space-y-3">
            {deadlines.map((deadline) => {
              const Icon = getDeadlineIcon(deadline.type);
              const url = getDeadlineUrl(deadline.type, deadline.entityId);
              const daysUntil = Math.ceil(
                (new Date(deadline.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );

              return (
                <Link
                  key={deadline.id}
                  href={url}
                  className="block p-3 border rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{deadline.title}</span>
                          <Badge
                            variant="outline"
                            className={`text-xs ${getPriorityColor(deadline.priority)}`}
                          >
                            {deadline.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(deadline.date)}
                          {daysUntil >= 0 && (
                            <span className="ml-2">
                              ({daysUntil === 0 ? 'Today' : `${daysUntil} day${daysUntil !== 1 ? 's' : ''} away`})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


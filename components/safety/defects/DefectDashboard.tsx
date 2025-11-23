'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Wrench, CheckCircle2, Clock } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

interface Defect {
  id: string;
  description: string;
  severity: string;
  status: string;
  reportedDate: string;
  resolvedAt: string | null;
  timeToRepair: number | null;
  workOrderId?: string | null;
  truck: {
    id: string;
    truckNumber: string;
  } | null;
}

async function fetchDefects(status?: string, severity?: string) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (severity) params.set('severity', severity);

  const response = await fetch(apiUrl(`/api/safety/defects?${params}`));
  if (!response.ok) throw new Error('Failed to fetch defects');
  return response.json() as Promise<{ defects: Defect[] }>;
}

export default function DefectDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['defects', 'OPEN'],
    queryFn: () => fetchDefects('OPEN')
  });

  const criticalDefects = data?.defects.filter(d => d.severity === 'CRITICAL') || [];
  const openDefects = data?.defects || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading defects...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading defects</p>
        </div>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    return severity === 'CRITICAL'
      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-red-100 text-red-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Defects</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openDefects.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Defects</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalDefects.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time to Repair</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {openDefects.length > 0
                ? Math.round(
                    openDefects
                      .filter(d => d.timeToRepair)
                      .reduce((sum, d) => sum + (d.timeToRepair || 0), 0) /
                      openDefects.filter(d => d.timeToRepair).length
                  )
                : 0}{' '}
              hrs
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Defects */}
      {criticalDefects.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Critical Defects</CardTitle>
            <CardDescription>Defects requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalDefects.map((defect) => (
                <div
                  key={defect.id}
                  className="flex items-start justify-between p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950/20"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getSeverityColor(defect.severity)}>
                        {defect.severity}
                      </Badge>
                      <Badge className={getStatusColor(defect.status)}>{defect.status}</Badge>
                    </div>
                    <p className="font-medium mb-1">{defect.description}</p>
                    {defect.truck && (
                      <Link
                        href={`/dashboard/trucks/${defect.truck.id}`}
                        className="text-sm text-muted-foreground hover:underline"
                      >
                        Vehicle: {defect.truck.truckNumber}
                      </Link>
                    )}
                    <div className="text-sm text-muted-foreground mt-1">
                      Reported: {formatDate(defect.reportedDate)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Open Defects */}
      <Card>
        <CardHeader>
          <CardTitle>All Open Defects</CardTitle>
          <CardDescription>Defects requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          {openDefects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No open defects</p>
            </div>
          ) : (
            <div className="space-y-3">
              {openDefects.map((defect) => (
                <div
                  key={defect.id}
                  className="flex items-start justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getSeverityColor(defect.severity)}>
                        {defect.severity}
                      </Badge>
                      <Badge className={getStatusColor(defect.status)}>{defect.status}</Badge>
                    </div>
                    <p className="font-medium mb-1">{defect.description}</p>
                    {defect.truck && (
                      <Link
                        href={`/dashboard/trucks/${defect.truck.id}`}
                        className="text-sm text-muted-foreground hover:underline"
                      >
                        Vehicle: {defect.truck.truckNumber}
                      </Link>
                    )}
                    <div className="text-sm text-muted-foreground mt-1">
                      Reported: {formatDate(defect.reportedDate)}
                      {defect.timeToRepair && (
                        <span className="ml-4">Time to repair: {defect.timeToRepair} hours</span>
                      )}
                    </div>
                  </div>
                  {defect.workOrderId && (
                    <Link href={`/dashboard/maintenance/work-orders/${defect.workOrderId}`}>
                      <Button variant="outline" size="sm">
                        <Wrench className="h-4 w-4 mr-2" />
                        View Work Order
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


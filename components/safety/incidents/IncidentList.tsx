'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingUp, FileText, Eye } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

interface Incident {
  id: string;
  incidentNumber: string;
  incidentType: string;
  severity: string;
  date: string;
  location: string;
  status: string;
  injuriesInvolved: boolean;
  fatalitiesInvolved: boolean;
  estimatedCost: number | null;
  driver: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  } | null;
  truck: {
    id: string;
    truckNumber: string;
  } | null;
  investigation: {
    id: string;
    status: string;
  } | null;
}

async function fetchIncidents(params?: {
  page?: number;
  incidentType?: string;
  severity?: string;
  status?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.incidentType) searchParams.set('incidentType', params.incidentType);
  if (params?.severity) searchParams.set('severity', params.severity);
  if (params?.status) searchParams.set('status', params.status);

  const response = await fetch(apiUrl(`/api/safety/incidents?${searchParams}`));
  if (!response.ok) throw new Error('Failed to fetch incidents');
  return response.json() as Promise<{ incidents: Incident[]; pagination: any }>;
}

export default function IncidentList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => fetchIncidents()
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading incidents...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading incidents</p>
        </div>
      </div>
    );
  }

  const incidents = data?.incidents || [];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-red-100 text-red-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'CLOSED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
        </div>
        <Link href="/dashboard/safety/incidents/new">
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Report Incident
          </Button>
        </Link>
      </div>

      {incidents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">No incidents reported</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {incidents.map((incident) => (
            <Card key={incident.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{incident.incidentNumber}</h3>
                      <Badge className={getSeverityColor(incident.severity)}>
                        {incident.severity}
                      </Badge>
                      <Badge className={getStatusColor(incident.status)}>
                        {incident.status}
                      </Badge>
                      {incident.injuriesInvolved && (
                        <Badge variant="outline" className="text-orange-600">
                          Injuries
                        </Badge>
                      )}
                      {incident.fatalitiesInvolved && (
                        <Badge variant="outline" className="text-red-600">
                          Fatalities
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span>
                          <strong>Type:</strong> {incident.incidentType.replace('_', ' ')}
                        </span>
                        <span>
                          <strong>Date:</strong> {formatDate(incident.date)}
                        </span>
                        <span>
                          <strong>Location:</strong> {incident.location}
                        </span>
                      </div>
                      {incident.driver && (
                        <div>
                          <strong>Driver:</strong> {incident.driver.user.firstName}{' '}
                          {incident.driver.user.lastName}
                        </div>
                      )}
                      {incident.truck && (
                        <div>
                          <strong>Vehicle:</strong> {incident.truck.truckNumber}
                        </div>
                      )}
                      {incident.estimatedCost && (
                        <div>
                          <strong>Estimated Cost:</strong> ${incident.estimatedCost.toLocaleString()}
                        </div>
                      )}
                    </div>

                    {incident.investigation && (
                      <div className="mt-3">
                        <Badge variant="outline">
                          Investigation: {incident.investigation.status}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Link href={`/dashboard/safety/incidents/${incident.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


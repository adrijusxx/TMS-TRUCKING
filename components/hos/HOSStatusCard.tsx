'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, Car, Bed, Coffee } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { apiUrl } from '@/lib/utils';

interface HOSStatusCardProps {
  driverId: string;
}

async function fetchHOSStatus(driverId: string) {
  const response = await fetch(apiUrl(`/api/hos/status/${driverId}`));
  if (!response.ok) throw new Error('Failed to fetch HOS status');
  return response.json();
}

export default function HOSStatusCard({ driverId }: HOSStatusCardProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['hos-status', driverId],
    queryFn: () => fetchHOSStatus(driverId),
    refetchInterval: 300000, // Refetch every 5 minutes (reduced from 1 minute)
    staleTime: 2 * 60 * 1000, // Data is fresh for 2 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hours of Service</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            Loading HOS status...
          </div>
        </CardContent>
      </Card>
    );
  }

  const status = data?.data;
  if (!status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hours of Service</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            No HOS data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const { totals, available, violations, warnings } = status;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Hours of Service (Last 8 Days)
        </CardTitle>
        <CardDescription>
          DOT compliance status and available hours
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Violations */}
        {violations.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="font-semibold text-red-600">Violations</span>
            </div>
            <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
              {violations.map((violation: string, idx: number) => (
                <li key={idx}>{violation}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="font-semibold text-yellow-600">Warnings</span>
            </div>
            <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
              {warnings.map((warning: string, idx: number) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Status: All Clear */}
        {violations.length === 0 && warnings.length === 0 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-semibold text-green-600">
                All Clear - No Violations
              </span>
            </div>
          </div>
        )}

        {/* Time Totals */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Car className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Driving</span>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">
                {totals.driving.hours.toFixed(1)}h
              </p>
              <Progress
                value={(totals.driving.hours / 11) * 100}
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                {available.driving.toFixed(1)}h available
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">On Duty</span>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">
                {totals.onDuty.hours.toFixed(1)}h
              </p>
              <Progress
                value={(totals.onDuty.hours / 14) * 100}
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                {available.onDuty.toFixed(1)}h available
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <Bed className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Sleeper Berth</span>
            </div>
            <p className="text-2xl font-bold">
              {totals.sleeperBerth.hours.toFixed(1)}h
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <Coffee className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Off Duty</span>
            </div>
            <p className="text-2xl font-bold">
              {totals.offDuty.hours.toFixed(1)}h
            </p>
          </div>
        </div>

        {/* 70-Hour Rule */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">70-Hour/8-Day Rule</span>
            <Badge
              variant={
                totals.onDuty.hours > 70
                  ? 'destructive'
                  : totals.onDuty.hours > 65
                  ? 'secondary'
                  : 'default'
              }
            >
              {totals.onDuty.hours.toFixed(1)} / 70 hours
            </Badge>
          </div>
          <Progress value={(totals.onDuty.hours / 70) * 100} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {available['70Hour'].toFixed(1)}h available
          </p>
        </div>
      </CardContent>
    </Card>
  );
}


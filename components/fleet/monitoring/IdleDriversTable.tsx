'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, MapPin, Home, UserX } from 'lucide-react';
import Link from 'next/link';
import type { IdleDriver } from '@/lib/managers/fleet-monitoring/types';

interface Props {
  drivers: IdleDriver[];
  loading: boolean;
}

function getIdleBadge(hours: number) {
  if (hours >= 72) return { label: `${Math.round(hours)}h`, variant: 'destructive' as const };
  if (hours >= 48) return { label: `${Math.round(hours)}h`, variant: 'destructive' as const };
  if (hours >= 24) return { label: `${Math.round(hours)}h`, variant: 'warning' as const };
  return { label: `${Math.round(hours)}h`, variant: 'secondary' as const };
}

function formatDate(date: Date | null) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function IdleDriversTable({ drivers, loading }: Props) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserX className="h-4 w-4" />
            Idle Drivers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserX className="h-4 w-4" />
          Idle Drivers
          {drivers.length > 0 && (
            <Badge variant="secondary" className="ml-2">{drivers.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {drivers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            All drivers have active loads assigned.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Driver</th>
                  <th className="pb-2 pr-3 font-medium">Home Terminal</th>
                  <th className="pb-2 pr-3 font-medium">Last Load</th>
                  <th className="pb-2 pr-3 font-medium">Idle Time</th>
                  <th className="pb-2 pr-3 font-medium">Location</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((driver) => {
                  const badge = getIdleBadge(driver.idleHours);
                  return (
                    <tr key={driver.driverId} className="border-b last:border-0">
                      <td className="py-2.5 pr-3">
                        <div>
                          <p className="font-medium">{driver.driverName}</p>
                          <p className="text-xs text-muted-foreground">#{driver.driverNumber}</p>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 text-muted-foreground">
                        {driver.homeTerminal || '—'}
                      </td>
                      <td className="py-2.5 pr-3">
                        <div>
                          {driver.lastLoadNumber && (
                            <p className="text-xs">{driver.lastLoadNumber}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {formatDate(driver.lastDeliveredAt)}
                          </p>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </td>
                      <td className="py-2.5 pr-3">
                        {driver.currentLocation ? (
                          <div className="flex items-center gap-1 text-xs">
                            {driver.isAtHomeTerminal ? (
                              <Home className="h-3 w-3 text-green-600" />
                            ) : (
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                            )}
                            <span className="max-w-[150px] truncate">
                              {driver.currentLocation}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No GPS</span>
                        )}
                      </td>
                      <td className="py-2.5">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/drivers/${driver.driverId}`}>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

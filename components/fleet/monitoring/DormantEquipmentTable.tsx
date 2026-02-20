'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Truck, Container, ExternalLink, Satellite, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import type { DormantEquipment } from '@/lib/managers/fleet-monitoring/types';
import MarkOOSDialog from './MarkOOSDialog';

interface Props {
  trucks: DormantEquipment[];
  trailers: DormantEquipment[];
  loading: boolean;
  onMarkOOS: () => void;
}

function getDormantBadge(days: number) {
  if (days >= 7) return { label: `${days}d`, variant: 'destructive' as const };
  if (days >= 5) return { label: `${days}d`, variant: 'warning' as const };
  return { label: `${days}d`, variant: 'secondary' as const };
}

function formatDate(date: Date | null) {
  if (!date) return 'Never';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function DormantEquipmentTable({ trucks, trailers, loading, onMarkOOS }: Props) {
  const [oosTarget, setOosTarget] = useState<DormantEquipment | null>(null);
  const combined = [...trucks, ...trailers];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4" />
            Dormant Equipment
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
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4" />
            Dormant Equipment
            {combined.length > 0 && (
              <Badge variant="secondary" className="ml-2">{combined.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {combined.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No dormant equipment detected.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-3 font-medium">Unit</th>
                    <th className="pb-2 pr-3 font-medium">Type</th>
                    <th className="pb-2 pr-3 font-medium">Last Load</th>
                    <th className="pb-2 pr-3 font-medium">Dormant</th>
                    <th className="pb-2 pr-3 font-medium">GPS</th>
                    <th className="pb-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {combined.map((eq) => {
                    const badge = getDormantBadge(eq.daysSinceLastLoad);
                    const href = eq.type === 'TRUCK'
                      ? `/dashboard/trucks/${eq.id}`
                      : `/dashboard/trailers/${eq.id}`;
                    return (
                      <tr key={eq.id} className="border-b last:border-0">
                        <td className="py-2.5 pr-3">
                          <div className="flex items-center gap-2">
                            {eq.type === 'TRUCK' ? (
                              <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                            ) : (
                              <Container className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            <span className="font-medium">{eq.number}</span>
                          </div>
                        </td>
                        <td className="py-2.5 pr-3">
                          <Badge variant="outline" className="text-xs">{eq.type}</Badge>
                        </td>
                        <td className="py-2.5 pr-3">
                          <div>
                            {eq.lastActiveLoadNumber && (
                              <p className="text-xs">{eq.lastActiveLoadNumber}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {formatDate(eq.lastActiveLoadDate)}
                            </p>
                          </div>
                        </td>
                        <td className="py-2.5 pr-3">
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </td>
                        <td className="py-2.5 pr-3">
                          {eq.hasSamsaraMovement === null ? (
                            <span className="text-xs text-muted-foreground">No GPS</span>
                          ) : eq.hasSamsaraMovement ? (
                            <div className="flex items-center gap-1 text-xs text-green-600">
                              <Satellite className="h-3 w-3" />
                              Moving
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-xs text-red-600">
                              <Satellite className="h-3 w-3" />
                              Stationary
                            </div>
                          )}
                        </td>
                        <td className="py-2.5">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-7"
                              onClick={() => setOosTarget(eq)}
                            >
                              Mark OOS
                            </Button>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={href}>
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          </div>
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

      {oosTarget && (
        <MarkOOSDialog
          equipment={oosTarget}
          open={!!oosTarget}
          onOpenChange={(open) => !open && setOosTarget(null)}
          onSuccess={() => {
            setOosTarget(null);
            onMarkOOS();
          }}
        />
      )}
    </>
  );
}

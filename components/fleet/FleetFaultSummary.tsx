'use client';

/**
 * Fleet Fault Summary Component
 * 
 * Displays active fault codes summary for Fleet department dashboard.
 * Compact card with critical/warning counts and affected trucks list.
 */

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle, AlertCircle, Info, Truck, RefreshCw,
  CheckCircle2, ExternalLink
} from 'lucide-react';
import { apiUrl, cn } from '@/lib/utils';
import Link from 'next/link';

// ============================================
// TYPES
// ============================================

interface FaultSummary {
  truckId: string;
  truckNumber: string;
  activeFaults: number;
  criticalFaults: number;
  checkEngineLightOn: boolean;
  lastFaultDate?: string;
}

interface SyncData {
  faultSummary: {
    totalActiveFaults: number;
    criticalFaults: number;
    warningFaults: number;
    infoFaults: number;
    trucksAffected: number;
  };
  trucksWithFaults: FaultSummary[];
}

// ============================================
// DATA FETCHING
// ============================================

async function fetchFaultSummary(): Promise<SyncData> {
  const res = await fetch(apiUrl('/api/fleet/samsara-sync'));
  if (!res.ok) throw new Error('Failed to fetch fault summary');
  const data = await res.json();
  return data.data;
}

// ============================================
// COMPONENT
// ============================================

export default function FleetFaultSummary() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['fleet-fault-summary'],
    queryFn: fetchFaultSummary,
    refetchInterval: 60000, // Refresh every minute
  });

  const summary = data?.faultSummary;
  const trucksWithFaults = data?.trucksWithFaults || [];

  return (
    <Card className="border">
      <CardHeader className="py-3 px-4 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Active Faults
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={cn('h-3 w-3', isFetching && 'animate-spin')} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : error ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            <AlertTriangle className="h-6 w-6 mx-auto mb-2 opacity-50" />
            Failed to load faults
          </div>
        ) : !summary || summary.totalActiveFaults === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="font-medium text-green-700">All Clear</p>
            <p className="text-xs">No active fault codes</p>
          </div>
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded bg-red-50 text-center">
                <AlertTriangle className="h-4 w-4 mx-auto mb-1 text-red-600" />
                <p className="text-lg font-bold text-red-700">{summary.criticalFaults}</p>
                <p className="text-[10px] text-red-600">Critical</p>
              </div>
              <div className="p-2 rounded bg-amber-50 text-center">
                <AlertCircle className="h-4 w-4 mx-auto mb-1 text-amber-600" />
                <p className="text-lg font-bold text-amber-700">{summary.warningFaults}</p>
                <p className="text-[10px] text-amber-600">Warning</p>
              </div>
              <div className="p-2 rounded bg-blue-50 text-center">
                <Info className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                <p className="text-lg font-bold text-blue-700">{summary.infoFaults}</p>
                <p className="text-[10px] text-blue-600">Info</p>
              </div>
            </div>

            {/* Trucks affected */}
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-2">
                {summary.trucksAffected} trucks affected
              </p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {trucksWithFaults.slice(0, 10).map(truck => (
                  <Link
                    key={truck.truckId}
                    href={`/dashboard/trucks/${truck.truckId}`}
                    className="flex items-center justify-between p-2 rounded bg-muted/50 hover:bg-muted transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <Truck className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs font-medium">{truck.truckNumber}</span>
                      {truck.checkEngineLightOn && (
                        <Badge variant="destructive" className="text-[9px] h-4 px-1">
                          CEL
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-[10px] h-5',
                          truck.criticalFaults > 0
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        )}
                      >
                        {truck.activeFaults} fault{truck.activeFaults !== 1 && 's'}
                      </Badge>
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))}
              </div>
              {trucksWithFaults.length > 10 && (
                <p className="text-[10px] text-muted-foreground text-center mt-2">
                  +{trucksWithFaults.length - 10} more trucks
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}





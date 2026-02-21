'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Container, ExternalLink, MapPin, ChevronLeft, ChevronRight, Wrench } from 'lucide-react';
import Link from 'next/link';
import SortableColumnHeader from './SortableColumnHeader';
import InventoryTableToolbar from './InventoryTableToolbar';
import MarkOOSDialog from './MarkOOSDialog';
import type { TrailerInventoryItem, InventoryResponse, OOSEquipmentRef } from '@/lib/managers/fleet-monitoring/types';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'IN_USE', label: 'In Use' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'OUT_OF_SERVICE', label: 'Out of Service' },
  { value: 'NEEDS_REPAIR', label: 'Needs Repair' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'DORMANT', label: 'Dormant' },
];

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-800',
  IN_USE: 'bg-blue-100 text-blue-800',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800',
  MAINTENANCE_DUE: 'bg-amber-100 text-amber-800',
  OUT_OF_SERVICE: 'bg-red-100 text-red-800',
  NEEDS_REPAIR: 'bg-orange-100 text-orange-800',
  INACTIVE: 'bg-slate-100 text-slate-800',
};

function idleBadge(days: number | null) {
  if (days === null) return null;
  if (days >= 7) return { label: `${days}d`, variant: 'destructive' as const };
  if (days >= 3) return { label: `${days}d`, variant: 'warning' as const };
  return { label: `${days}d`, variant: 'secondary' as const };
}

function formatDate(date: Date | null) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function TrailerInventoryTable() {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ column: string; order: 'asc' | 'desc' }>({ column: 'trailerNumber', order: 'asc' });
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [oosTarget, setOosTarget] = useState<OOSEquipmentRef | null>(null);
  const limit = 20;

  const { data, isLoading, refetch } = useQuery<{ success: boolean; data: InventoryResponse<TrailerInventoryItem> }>({
    queryKey: ['trailer-inventory', page, sort, status, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        type: 'trailer', page: String(page), limit: String(limit),
        sortBy: sort.column, sortOrder: sort.order,
      });
      if (status !== 'ALL') params.set('status', status);
      if (search) params.set('search', search);
      const res = await fetch(`/api/fleet/monitoring/inventory?${params}`);
      return res.json();
    },
  });

  const inventory = data?.data;
  const items = inventory?.items ?? [];
  const meta = inventory?.meta ?? { total: 0, page: 1, limit, totalPages: 0 };

  const handleSort = useCallback((col: string) => {
    setSort((prev) =>
      prev.column === col
        ? { column: col, order: prev.order === 'asc' ? 'desc' : 'asc' }
        : { column: col, order: 'asc' }
    );
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((s: string) => { setStatus(s); setPage(1); }, []);
  const handleSearchChange = useCallback((s: string) => { setSearch(s); setPage(1); }, []);

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Container className="h-4 w-4" /> Trailers
            </CardTitle>
          </div>
          <InventoryTableToolbar
            statusOptions={STATUS_OPTIONS}
            selectedStatus={status}
            onStatusChange={handleStatusChange}
            searchValue={search}
            onSearchChange={handleSearchChange}
            totalCount={meta.total}
          />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse bg-muted rounded" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No trailers found.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <SortableColumnHeader label="Unit #" column="trailerNumber" currentSort={sort} onSort={handleSort} />
                      <SortableColumnHeader label="Type" column="type" currentSort={sort} onSort={handleSort} />
                      <th className="pb-2 pr-3 font-medium">Vehicle</th>
                      <SortableColumnHeader label="Status" column="status" currentSort={sort} onSort={handleSort} />
                      <th className="pb-2 pr-3 font-medium">Assigned Truck</th>
                      <th className="pb-2 pr-3 font-medium">Active Load</th>
                      <th className="pb-2 pr-3 font-medium">Last Load</th>
                      <th className="pb-2 pr-3 font-medium">Days Idle</th>
                      <th className="pb-2 pr-3 font-medium">Location</th>
                      <th className="pb-2 pr-3 font-medium">OOS</th>
                      <th className="pb-2 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((trailer) => {
                      const idle = idleBadge(trailer.daysSinceLastLoad);
                      return (
                        <tr key={trailer.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="py-2 pr-3 font-medium">{trailer.trailerNumber}</td>
                          <td className="py-2 pr-3 text-xs text-muted-foreground">
                            {trailer.type || '—'}
                          </td>
                          <td className="py-2 pr-3 text-muted-foreground text-xs">
                            {trailer.year} {trailer.make} {trailer.model}
                          </td>
                          <td className="py-2 pr-3">
                            <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[trailer.status] || ''}`}>
                              {trailer.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-2 pr-3 text-xs">
                            {trailer.assignedTruck ? (
                              <Link href={`/dashboard/trucks/${trailer.assignedTruck.id}`} className="text-primary hover:underline">
                                {trailer.assignedTruck.truckNumber}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">Unassigned</span>
                            )}
                          </td>
                          <td className="py-2 pr-3 text-xs">
                            {trailer.activeLoad ? (
                              <div>
                                <div className="font-medium">{trailer.activeLoad.lane}</div>
                                <div className="text-muted-foreground">
                                  {formatDate(trailer.activeLoad.pickupDate)} – {formatDate(trailer.activeLoad.deliveryDate)}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">No active load</span>
                            )}
                          </td>
                          <td className="py-2 pr-3 text-xs">
                            {trailer.lastLoad ? (
                              <div>
                                <span>{trailer.lastLoad.loadNumber}</span>
                                <span className="text-muted-foreground ml-1">{formatDate(trailer.lastLoad.date)}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Never</span>
                            )}
                          </td>
                          <td className="py-2 pr-3">
                            {idle ? <Badge variant={idle.variant}>{idle.label}</Badge> : <span className="text-xs text-muted-foreground">—</span>}
                          </td>
                          <td className="py-2 pr-3 text-xs max-w-[140px]">
                            {trailer.samsaraLocation ? (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="truncate">{trailer.samsaraLocation.address}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">No GPS</span>
                            )}
                          </td>
                          <td className="py-2 pr-3 text-xs">
                            {trailer.oosInfo.longTermOutOfService ? (
                              <div className="flex items-center gap-1 text-red-600">
                                <Wrench className="h-3 w-3" />
                                <span className="truncate max-w-[80px]">{trailer.oosInfo.reason || 'OOS'}</span>
                              </div>
                            ) : null}
                          </td>
                          <td className="py-2">
                            <div className="flex items-center gap-1">
                              {!trailer.oosInfo.longTermOutOfService && (
                                <Button variant="ghost" size="sm" className="text-xs h-7"
                                  onClick={() => setOosTarget({ id: trailer.id, number: trailer.trailerNumber, type: 'TRAILER' })}>
                                  Mark OOS
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/dashboard/trailers/${trailer.id}`}>
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
              {/* Pagination */}
              <div className="flex items-center justify-between pt-3 border-t mt-2">
                <p className="text-xs text-muted-foreground">
                  Page {meta.page} of {meta.totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {oosTarget && (
        <MarkOOSDialog
          equipment={oosTarget}
          open={!!oosTarget}
          onOpenChange={(open) => !open && setOosTarget(null)}
          onSuccess={() => { setOosTarget(null); refetch(); }}
        />
      )}
    </>
  );
}

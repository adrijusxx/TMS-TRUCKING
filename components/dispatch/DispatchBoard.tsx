'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, formatCurrency, apiUrl } from '@/lib/utils';
import { Package, Users, Truck, Calendar, CheckSquare, Wifi, WifiOff, AlertCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import LoadAssignmentDialog from './LoadAssignmentDialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import RouteOptimizer from '@/components/routes/RouteOptimizer';
import { useRealtimeDispatch } from '@/hooks/useRealtime';
import { LoadingState } from '@/components/ui/loading-state';
import { SelfFetchingTrackingBadge } from '@/components/loads/LoadTrackingBadge';

async function fetchDispatchBoard(date: string) {
  const response = await fetch(apiUrl(`/api/dispatch/board?date=${date}`));
  if (!response.ok) throw new Error('Failed to fetch dispatch board');
  return response.json();
}

async function bulkAssignLoads(data: { loadIds: string[]; driverId?: string; truckId?: string }) {
  const response = await fetch(apiUrl('/api/dispatch/bulk-assign'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to assign loads');
  }
  return response.json();
}

export default function DispatchBoard() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedLoads, setSelectedLoads] = useState<Set<string>>(new Set());

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dispatch-board', selectedDate],
    queryFn: () => fetchDispatchBoard(selectedDate),
  });

  const { isConnected } = useRealtimeDispatch((event) => {
    const eventType = event.type || (event.data as any)?.type;
    if (eventType === 'load:assigned' || eventType === 'load:status:changed' || eventType === 'dispatch:updated') {
      queryClient.invalidateQueries({ queryKey: ['dispatch-board'] });
    }
  });

  const bulkAssignMutation = useMutation({
    mutationFn: bulkAssignLoads,
    onSuccess: () => {
      toast.success('Loads assigned');
      queryClient.invalidateQueries({ queryKey: ['dispatch-board', selectedDate] });
      setSelectedLoads(new Set());
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const boardData = data?.data;

  const handleSelectLoad = (loadId: string) => {
    const newSelected = new Set(selectedLoads);
    newSelected.has(loadId) ? newSelected.delete(loadId) : newSelected.add(loadId);
    setSelectedLoads(newSelected);
  };

  const handleSelectAll = () => {
    setSelectedLoads(selectedLoads.size === boardData?.unassignedLoads?.length
      ? new Set()
      : new Set(boardData?.unassignedLoads?.map((l: any) => l.id)));
  };

  const handleBulkAssign = (driverId?: string, truckId?: string) => {
    if (selectedLoads.size === 0) return toast.error('Select at least one load');
    bulkAssignMutation.mutate({ loadIds: Array.from(selectedLoads), driverId, truckId });
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Badge variant="outline" className={isConnected ? 'bg-green-50 text-green-700' : 'bg-gray-50'}>
          {isConnected ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
          {isConnected ? 'Live' : 'Offline'}
        </Badge>
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-6 text-xs px-2 border rounded"
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Loading dispatch board..." size="sm" className="py-8" />
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="rounded-xl bg-destructive/10 p-3 mb-3">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <p className="text-sm font-medium mb-1">Error loading board</p>
          <p className="text-xs text-muted-foreground mb-3">{(error as Error).message}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="h-3 w-3" />
            Retry
          </Button>
        </div>
      ) : (
        <>
          {selectedLoads.size >= 2 && (
            <RouteOptimizer
              selectedLoadIds={Array.from(selectedLoads)}
              onOptimized={() => toast.success('Route optimized!')}
            />
          )}

          <div className="grid gap-2 lg:grid-cols-2">
            {/* Unassigned Loads */}
            <Card>
              <CardHeader className="py-2 px-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    Unassigned ({boardData?.unassignedLoads?.length || 0})
                  </CardTitle>
                  {boardData?.unassignedLoads?.length > 0 && (
                    <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={handleSelectAll}>
                      <CheckSquare className="h-3 w-3 mr-1" />
                      {selectedLoads.size === boardData?.unassignedLoads?.length ? 'None' : 'All'}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="py-2 px-3">
                {boardData?.unassignedLoads?.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-4">No unassigned loads</p>
                ) : (
                  <>
                    {selectedLoads.size > 0 && (
                      <div className="mb-2 p-2 bg-blue-50 rounded text-xs">
                        <span className="font-medium">{selectedLoads.size} selected</span>
                        <LoadAssignmentDialog
                          load={null}
                          availableDrivers={boardData?.availableDrivers || []}
                          availableTrucks={boardData?.availableTrucks || []}
                          onAssign={handleBulkAssign}
                          selectedLoadIds={Array.from(selectedLoads)}
                          isBulk={true}
                        />
                      </div>
                    )}
                    <div className="space-y-1">
                      {boardData?.unassignedLoads?.map((load: any) => (
                        <div key={load.id} className="p-2 border rounded hover:bg-muted/30 text-xs">
                          <div className="flex items-start gap-2">
                            <Checkbox
                              checked={selectedLoads.has(load.id)}
                              onCheckedChange={() => handleSelectLoad(load.id)}
                              className="mt-0.5 h-3 w-3"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{load.loadNumber}</p>
                                  <p className="text-muted-foreground truncate">{load.customer.name}</p>
                                  <p>{load.pickupCity}, {load.pickupState} → {load.deliveryCity}, {load.deliveryState}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="font-medium text-green-600">{formatCurrency(load.revenue)}</p>
                                  <LoadAssignmentDialog
                                    load={load}
                                    availableDrivers={boardData?.availableDrivers || []}
                                    availableTrucks={boardData?.availableTrucks || []}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Assigned Loads */}
            <Card>
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-sm flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  Assigned ({boardData?.assignedLoads?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-3">
                {boardData?.assignedLoads?.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-4">No assigned loads</p>
                ) : (
                  <div className="space-y-1">
                    {boardData?.assignedLoads?.map((load: any) => (
                      <div key={load.id} className="p-2 border rounded text-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{load.loadNumber}</p>
                            {load.driver && (
                              <p className="text-muted-foreground">
                                {load.driver.user.firstName} {load.driver.user.lastName}
                              </p>
                            )}
                            <Badge variant="outline" className="text-[10px] h-4 mt-1">{load.status}</Badge>
                            <SelfFetchingTrackingBadge loadId={load.id} loadStatus={load.status} compact />
                          </div>
                          <p className="font-medium text-green-600">{formatCurrency(load.revenue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Available Drivers */}
            <Card>
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-sm flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Drivers ({boardData?.availableDrivers?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-3">
                {boardData?.availableDrivers?.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-4">No available drivers</p>
                ) : (
                  <div className="space-y-1">
                    {boardData?.availableDrivers?.map((driver: any) => (
                      <div key={driver.id} className="p-2 border rounded flex justify-between items-center text-xs">
                        <div>
                          <p className="font-medium">{driver.user.firstName} {driver.user.lastName}</p>
                          {driver.currentTruck && <p className="text-muted-foreground">Truck: {driver.currentTruck.truckNumber}</p>}
                        </div>
                        <Badge variant="outline" className="text-[10px] h-4 bg-green-50 text-green-700">Available</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Available Trucks */}
            <Card>
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-sm flex items-center gap-1">
                  <Truck className="h-4 w-4" />
                  Trucks ({boardData?.availableTrucks?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-3">
                {boardData?.availableTrucks?.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-4">No available trucks</p>
                ) : (
                  <div className="space-y-1">
                    {boardData?.availableTrucks?.map((truck: any) => (
                      <div key={truck.id} className="p-2 border rounded flex justify-between items-center text-xs">
                        <div>
                          <p className="font-medium">{truck.truckNumber}</p>
                          <p className="text-muted-foreground">{truck.equipmentType.replace(/_/g, ' ')}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px] h-4 bg-green-50 text-green-700">Available</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

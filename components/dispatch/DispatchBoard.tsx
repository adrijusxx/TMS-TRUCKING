'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, formatCurrency, apiUrl } from '@/lib/utils';
import { Package, Users, Truck, Calendar, CheckSquare } from 'lucide-react';
import { format } from 'date-fns';
import LoadAssignmentDialog from './LoadAssignmentDialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import RouteOptimizer from '@/components/routes/RouteOptimizer';

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
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [selectedLoads, setSelectedLoads] = useState<Set<string>>(new Set());

  const { data, isLoading, error } = useQuery({
    queryKey: ['dispatch-board', selectedDate],
    queryFn: () => fetchDispatchBoard(selectedDate),
  });

  const bulkAssignMutation = useMutation({
    mutationFn: bulkAssignLoads,
    onSuccess: () => {
      toast.success('Loads assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['dispatch-board', selectedDate] });
      setSelectedLoads(new Set());
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to assign loads');
    },
  });

  const boardData = data?.data;

  const handleSelectLoad = (loadId: string) => {
    const newSelected = new Set(selectedLoads);
    if (newSelected.has(loadId)) {
      newSelected.delete(loadId);
    } else {
      newSelected.add(loadId);
    }
    setSelectedLoads(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedLoads.size === boardData?.unassignedLoads?.length) {
      setSelectedLoads(new Set());
    } else {
      setSelectedLoads(new Set(boardData?.unassignedLoads?.map((l: any) => l.id)));
    }
  };

  const handleBulkAssign = (driverId?: string, truckId?: string) => {
    if (selectedLoads.size === 0) {
      toast.error('Please select at least one load');
      return;
    }
    bulkAssignMutation.mutate({
      loadIds: Array.from(selectedLoads),
      driverId,
      truckId,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dispatch Board</h1>
          <p className="text-muted-foreground">
            Manage load assignments and driver availability
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading dispatch board...</div>
      ) : error ? (
        <div className="text-center py-8 text-destructive">
          Error loading dispatch board. Please try again.
        </div>
      ) : (
        <>
          {/* Route Optimizer */}
          {selectedLoads.size >= 2 && (
            <RouteOptimizer
              selectedLoadIds={Array.from(selectedLoads)}
              onOptimized={(sequence) => {
                toast.success('Route optimized! Consider assigning loads in this order.');
              }}
            />
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Unassigned Loads */}
            <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Unassigned Loads ({boardData?.unassignedLoads?.length || 0})
                  </CardTitle>
                  <CardDescription>
                    Loads waiting for driver and truck assignment
                  </CardDescription>
                </div>
                {boardData?.unassignedLoads?.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    <CheckSquare className="h-4 w-4 mr-2" />
                    {selectedLoads.size === boardData?.unassignedLoads?.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {boardData?.unassignedLoads?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No unassigned loads for this date
                </p>
              ) : (
                <>
                  {selectedLoads.size > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium mb-2">
                        {selectedLoads.size} load(s) selected
                      </p>
                      <div className="flex gap-2">
                        <LoadAssignmentDialog
                          load={null}
                          availableDrivers={boardData?.availableDrivers || []}
                          availableTrucks={boardData?.availableTrucks || []}
                          onAssign={handleBulkAssign}
                          selectedLoadIds={Array.from(selectedLoads)}
                          isBulk={true}
                        />
                      </div>
                    </div>
                  )}
                  <div className="space-y-3">
                    {boardData?.unassignedLoads?.map((load: any) => (
                      <div
                        key={load.id}
                        className="p-4 border rounded-lg hover:bg-slate-50"
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedLoads.has(load.id)}
                            onCheckedChange={() => handleSelectLoad(load.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                          <p className="font-medium">{load.loadNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {load.customer.name}
                          </p>
                          <p className="text-sm mt-1">
                            {load.pickupCity}, {load.pickupState} →{' '}
                            {load.deliveryCity}, {load.deliveryState}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Pickup: {formatDate(load.pickupDate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-600">
                            {formatCurrency(load.revenue)}
                          </p>
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Assigned Loads ({boardData?.assignedLoads?.length || 0})
              </CardTitle>
              <CardDescription>
                Loads currently assigned to drivers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {boardData?.assignedLoads?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No assigned loads for this date
                </p>
              ) : (
                <div className="space-y-3">
                  {boardData?.assignedLoads?.map((load: any) => (
                    <div
                      key={load.id}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{load.loadNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {load.customer.name}
                          </p>
                          <div className="mt-2 space-y-1">
                            {load.driver && (
                              <p className="text-sm">
                                <span className="font-medium">Driver:</span>{' '}
                                {load.driver.user.firstName}{' '}
                                {load.driver.user.lastName} (
                                {load.driver.driverNumber})
                              </p>
                            )}
                            {load.truck && (
                              <p className="text-sm">
                                <span className="font-medium">Truck:</span>{' '}
                                {load.truck.truckNumber}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className="mt-2">
                            {load.status}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-600">
                            {formatCurrency(load.revenue)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Drivers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Available Drivers ({boardData?.availableDrivers?.length || 0})
              </CardTitle>
              <CardDescription>
                Drivers ready for assignment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {boardData?.availableDrivers?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No available drivers
                </p>
              ) : (
                <div className="space-y-2">
                  {boardData?.availableDrivers?.map((driver: any) => (
                    <div
                      key={driver.id}
                      className="p-3 border rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">
                          {driver.user.firstName} {driver.user.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {driver.driverNumber}
                        </p>
                        {driver.currentTruck && (
                          <p className="text-sm">
                            Truck: {driver.currentTruck.truckNumber}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                        Available
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Trucks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Available Trucks ({boardData?.availableTrucks?.length || 0})
              </CardTitle>
              <CardDescription>
                Trucks ready for assignment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {boardData?.availableTrucks?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No available trucks
                </p>
              ) : (
                <div className="space-y-2">
                  {boardData?.availableTrucks?.map((truck: any) => (
                    <div
                      key={truck.id}
                      className="p-3 border rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">{truck.truckNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {truck.equipmentType.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                        Available
                      </Badge>
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


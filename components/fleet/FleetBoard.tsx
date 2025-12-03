'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, Package, User, Wrench, AlertTriangle } from 'lucide-react';
import { formatDate, apiUrl } from '@/lib/utils';
import Link from 'next/link';

interface FleetBoardData {
  trucks: Array<{
    id: string;
    truckNumber: string;
    make: string;
    model: string;
    year: number;
    status: string;
    currentLocation?: string | null;
    currentDrivers: Array<{
      id: string;
      driverNumber: string;
      user: {
        firstName: string;
        lastName: string;
      };
    }>;
    loads: Array<{
      id: string;
      loadNumber: string;
      status: string;
      pickupCity?: string | null;
      pickupState?: string | null;
      deliveryCity?: string | null;
      deliveryState?: string | null;
      pickupDate?: Date | null;
      deliveryDate?: Date | null;
    }>;
    maintenanceRecords: Array<{
      id: string;
      type: string;
      nextServiceDate?: Date | null;
    }>;
  }>;
  stats: {
    total: number;
    available: number;
    inUse: number;
    maintenance: number;
    outOfService: number;
    withLoads: number;
    withDrivers: number;
  };
}

async function fetchFleetBoard() {
  const response = await fetch(apiUrl('/api/fleet-board'));
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Failed to fetch fleet board: ${response.statusText}`);
  }
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error?.message || 'Failed to fetch fleet board');
  }
  return data;
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    AVAILABLE: 'bg-green-100 text-green-800',
    IN_USE: 'bg-blue-100 text-blue-800',
    MAINTENANCE: 'bg-yellow-100 text-yellow-800',
    OUT_OF_SERVICE: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function FleetBoard() {
  const { data, isLoading, error } = useQuery<{ data: FleetBoardData }>({
    queryKey: ['fleet-board'],
    queryFn: fetchFleetBoard,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading fleet board...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <p className="text-destructive mb-2 font-semibold">Error loading fleet board</p>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
        </div>
      </div>
    );
  }

  const { trucks, stats } = data?.data || { trucks: [], stats: { total: 0, available: 0, inUse: 0, maintenance: 0, outOfService: 0, withLoads: 0, withDrivers: 0 } };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Trucks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold">{stats.available}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Use</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-600" />
              <span className="text-2xl font-bold">{stats.inUse}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-yellow-600" />
              <span className="text-2xl font-bold">{stats.maintenance}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fleet Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trucks.map((truck) => (
          <Card key={truck.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Link href={`/dashboard/trucks/${truck.id}`}>
                  <CardTitle className="hover:underline">
                    {truck.truckNumber}
                  </CardTitle>
                </Link>
                <Badge className={getStatusColor(truck.status)}>
                  {formatStatus(truck.status)}
                </Badge>
              </div>
              <CardDescription>
                {truck.year} {truck.make} {truck.model}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Driver */}
              {truck.currentDrivers.length > 0 ? (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {truck.currentDrivers[0].user.firstName}{' '}
                    {truck.currentDrivers[0].user.lastName}
                  </span>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No driver assigned</div>
              )}

              {/* Active Loads */}
              {truck.loads.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Package className="h-4 w-4" />
                    Active Loads ({truck.loads.length})
                  </div>
                  {truck.loads.map((load) => (
                    <Link
                      key={load.id}
                      href={`/dashboard/loads/${load.id}`}
                      className="block p-2 border rounded hover:bg-muted"
                    >
                      <div className="text-sm font-medium">{load.loadNumber}</div>
                      <div className="text-xs text-muted-foreground">
                        {load.pickupCity}, {load.pickupState} → {load.deliveryCity},{' '}
                        {load.deliveryState}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No active loads</div>
              )}

              {/* Maintenance Due */}
              {truck.maintenanceRecords.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-yellow-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Maintenance due</span>
                </div>
              )}

              {/* Location */}
              {truck.currentLocation && (
                <div className="text-xs text-muted-foreground">
                  Location: {truck.currentLocation}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {trucks.length === 0 && (
        <div className="flex items-center justify-center h-96 border rounded-lg">
          <div className="text-center">
            <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No trucks in fleet</p>
          </div>
        </div>
      )}
    </div>
  );
}


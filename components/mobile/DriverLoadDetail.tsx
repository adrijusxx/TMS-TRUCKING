'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Building2, DollarSign, ArrowLeft } from 'lucide-react';
import { formatCurrency, apiUrl } from '@/lib/utils';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import LoadStatusUpdate from '@/components/mobile/LoadStatusUpdate';
import LoadFuelStops from '@/components/mobile/LoadFuelStops';
import PODCaptureFlow from '@/components/mobile/PODCaptureFlow';
import LoadDocumentList from '@/components/mobile/LoadDocumentList';
import RouteStopsView from '@/components/mobile/RouteStopsView';
import LoadNotesSection from '@/components/mobile/LoadNotesSection';

interface Load {
  id: string;
  loadNumber: string;
  status: string;
  customer: {
    name: string;
    customerNumber?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  pickup: {
    city: string;
    state: string;
    address?: string;
    date: Date | string;
    timeWindow?: string;
    contact?: string;
    phone?: string;
  };
  delivery: {
    city: string;
    state: string;
    address?: string;
    date: Date | string;
    timeWindow?: string;
    contact?: string;
    phone?: string;
  };
  revenue: number;
  commodity?: string;
  weight?: number;
  totalMiles?: number;
  notes?: string;
}

async function fetchLoad(id: string) {
  const response = await fetch(apiUrl(`/api/mobile/loads/${id}`));
  if (!response.ok) throw new Error('Failed to fetch load');
  return response.json();
}

interface DriverLoadDetailProps {
  loadId: string;
}

export default function DriverLoadDetail({ loadId }: DriverLoadDetailProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['driver-load', loadId],
    queryFn: () => fetchLoad(loadId),
  });

  const load: Load | undefined = data?.data;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 dark:border-b shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4 p-4">
          <Link href="/mobile/driver/loads">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Load Details</h1>
            {load && (
              <p className="text-sm text-muted-foreground">
                Load #{load.loadNumber}
              </p>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="p-4">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-destructive">Error loading load details</p>
            </CardContent>
          </Card>
        </div>
      ) : !load ? (
        <div className="p-4">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Load not found</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {/* Status */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="outline">{load.status}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Customer */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{load.customer.name}</p>
              <p className="text-sm text-muted-foreground">
                Customer #{load.customer.customerNumber}
              </p>
            </CardContent>
          </Card>

          {/* Route with Navigation */}
          <RouteStopsView
            pickup={load.pickup}
            delivery={load.delivery}
            currentStatus={load.status}
            totalMiles={load.totalMiles}
          />

          {/* Load Details */}
          {(load.commodity || load.weight || load.totalMiles) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Load Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {load.commodity && (
                  <div>
                    <p className="text-sm text-muted-foreground">Commodity</p>
                    <p className="font-medium">{load.commodity}</p>
                  </div>
                )}
                {load.weight && (
                  <div>
                    <p className="text-sm text-muted-foreground">Weight</p>
                    <p className="font-medium">{load.weight.toLocaleString()} lbs</p>
                  </div>
                )}
                {load.totalMiles && (
                  <div>
                    <p className="text-sm text-muted-foreground">Distance</p>
                    <p className="font-medium">{load.totalMiles.toLocaleString()} miles</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Fuel Stops & Tolls */}
          <LoadFuelStops loadId={loadId} totalMiles={load.totalMiles} />

          {/* Revenue */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(load.revenue)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {load.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{load.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Load Notes / Communication */}
          <LoadNotesSection loadId={loadId} />

          {/* Documents */}
          <LoadDocumentList loadId={loadId} />

          {/* Actions */}
          <div className="space-y-2">
            <PODCaptureFlow
              loadId={loadId}
              loadNumber={load.loadNumber}
              currentStatus={load.status}
            />
            <LoadStatusUpdate loadId={loadId} currentStatus={load.status} />
          </div>
        </div>
      )}
    </div>
  );
}


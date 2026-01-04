'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, MapPin, Calendar, Building2, DollarSign, ArrowLeft } from 'lucide-react';
import { formatCurrency, formatDate, apiUrl } from '@/lib/utils';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import LoadStatusUpdate from '@/components/mobile/LoadStatusUpdate';
import { LoadStatus } from '@prisma/client';

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
  distance?: number;
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

          {/* Route */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Route
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pickup</p>
                <p className="font-semibold">
                  {load.pickup.city}, {load.pickup.state}
                </p>
                {load.pickup.address && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {load.pickup.address}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {formatDate(load.pickup.date)}
                  </span>
                </div>
                {load.pickup.contact && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Contact: {load.pickup.contact} {load.pickup.phone && `(${load.pickup.phone})`}
                  </p>
                )}
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Delivery</p>
                <p className="font-semibold">
                  {load.delivery.city}, {load.delivery.state}
                </p>
                {load.delivery.address && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {load.delivery.address}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {formatDate(load.delivery.date)}
                  </span>
                </div>
                {load.delivery.contact && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Contact: {load.delivery.contact} {load.delivery.phone && `(${load.delivery.phone})`}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Load Details */}
          {(load.commodity || load.weight || load.distance) && (
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
                {load.distance && (
                  <div>
                    <p className="text-sm text-muted-foreground">Distance</p>
                    <p className="font-medium">{load.distance.toLocaleString()} miles</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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

          {/* Actions */}
          <div className="space-y-2">
            <LoadStatusUpdate loadId={loadId} currentStatus={load.status} />
          </div>
        </div>
      )}
    </div>
  );
}


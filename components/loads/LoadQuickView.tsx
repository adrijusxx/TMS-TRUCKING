'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatDate, apiUrl } from '@/lib/utils';
import { LoadStatus } from '@prisma/client';
import { Package, MapPin, Calendar, User, Truck, DollarSign, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

interface Load {
  id: string;
  loadNumber: string;
  status: LoadStatus;
  customer: {
    id: string;
    name: string;
    customerNumber: string;
  };
  driver?: {
    id: string;
    driverNumber: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  truck?: {
    id: string;
    truckNumber: string;
  };
  pickupCity: string;
  pickupState: string;
  pickupDate: Date;
  deliveryCity: string;
  deliveryState: string;
  deliveryDate: Date;
  revenue: number;
  commodity?: string;
  weight?: number;
  distance?: number;
}

const statusColors: Record<LoadStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ASSIGNED: 'bg-blue-100 text-blue-800 border-blue-200',
  EN_ROUTE_PICKUP: 'bg-purple-100 text-purple-800 border-purple-200',
  AT_PICKUP: 'bg-orange-100 text-orange-800 border-orange-200',
  LOADED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  EN_ROUTE_DELIVERY: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  AT_DELIVERY: 'bg-pink-100 text-pink-800 border-pink-200',
  DELIVERED: 'bg-green-100 text-green-800 border-green-200',
  INVOICED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  PAID: 'bg-teal-100 text-teal-800 border-teal-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
};

function formatStatus(status: LoadStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

async function fetchLoad(id: string) {
  const response = await fetch(apiUrl(`/api/loads/${id}`));
  if (!response.ok) throw new Error('Failed to fetch load');
  return response.json();
}

interface LoadQuickViewProps {
  loadId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LoadQuickView({ loadId, open, onOpenChange }: LoadQuickViewProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['load', loadId],
    queryFn: () => fetchLoad(loadId!),
    enabled: !!loadId && open,
  });

  const load: Load | undefined = data?.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Load Details
          </DialogTitle>
          <DialogDescription>Quick view of load information</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">
            Error loading load details
          </div>
        ) : !load ? (
          <div className="text-center py-8 text-muted-foreground">
            Load not found
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold">{load.loadNumber}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {load.customer.name} ({load.customer.customerNumber})
                </p>
              </div>
              <Badge
                variant="outline"
                className={`${statusColors[load.status as LoadStatus]}`}
              >
                {formatStatus(load.status)}
              </Badge>
            </div>

            <Separator />

            {/* Route Information */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Route
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Pickup</p>
                  <p className="font-medium">
                    {load.pickupCity}, {load.pickupState}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(load.pickupDate)}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Delivery</p>
                  <p className="font-medium">
                    {load.deliveryCity}, {load.deliveryState}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(load.deliveryDate)}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Assignment Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Driver
                </h4>
                {load.driver ? (
                  <div>
                    <p className="font-medium">
                      {load.driver.user.firstName} {load.driver.user.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {load.driver.driverNumber}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Unassigned</p>
                )}
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Truck
                </h4>
                {load.truck ? (
                  <p className="font-medium">{load.truck.truckNumber}</p>
                ) : (
                  <p className="text-muted-foreground">Unassigned</p>
                )}
              </div>
            </div>

            {/* Additional Details */}
            {(load.commodity || load.weight || load.distance) && (
              <>
                <Separator />
                <div className="grid grid-cols-3 gap-4">
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
                </div>
              </>
            )}

            <Separator />

            {/* Revenue */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(load.revenue)}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {loadId && (
                <Link href={`/dashboard/loads/${loadId}`}>
                  <Button>
                    View Full Details
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


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
import { TruckStatus } from '@prisma/client';
import { Truck, User, MapPin, Gauge, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

interface TruckData {
  id: string;
  truckNumber: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  state: string;
  equipmentType: string;
  status: TruckStatus;
  currentDrivers: Array<{
    id: string;
    driverNumber: string;
    user: {
      firstName: string;
      lastName: string;
    };
  }>;
  odometerReading: number;
}

const statusColors: Record<TruckStatus, string> = {
  AVAILABLE: 'bg-green-100 text-green-800 border-green-200',
  IN_USE: 'bg-blue-100 text-blue-800 border-blue-200',
  MAINTENANCE: 'bg-orange-100 text-orange-800 border-orange-200',
  OUT_OF_SERVICE: 'bg-red-100 text-red-800 border-red-200',
  INACTIVE: 'bg-gray-100 text-gray-800 border-gray-200',
};

function formatStatus(status: TruckStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatEquipmentType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

async function fetchTruck(id: string) {
  const response = await fetch(`/api/trucks/${id}`);
  if (!response.ok) throw new Error('Failed to fetch truck');
  return response.json();
}

interface TruckQuickViewProps {
  truckId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TruckQuickView({ truckId, open, onOpenChange }: TruckQuickViewProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['truck', truckId],
    queryFn: () => fetchTruck(truckId!),
    enabled: !!truckId && open,
  });

  const truck: TruckData | undefined = data?.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Truck Details
          </DialogTitle>
          <DialogDescription>Quick view of truck information</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">
            Error loading truck details
          </div>
        ) : !truck ? (
          <div className="text-center py-8 text-muted-foreground">
            Truck not found
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold">Truck #{truck.truckNumber}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {truck.year} {truck.make} {truck.model}
                </p>
              </div>
              <Badge
                variant="outline"
                className={`${statusColors[truck.status]}`}
              >
                {formatStatus(truck.status)}
              </Badge>
            </div>

            <Separator />

            {/* Vehicle Information */}
            <div className="space-y-4">
              <h4 className="font-semibold">Vehicle Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">VIN</p>
                  <p className="font-medium">{truck.vin}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Equipment Type</p>
                  <p className="font-medium">{formatEquipmentType(truck.equipmentType)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    License Plate
                  </p>
                  <p className="font-medium">{truck.licensePlate} ({truck.state})</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Gauge className="h-3 w-3" />
                    Odometer
                  </p>
                  <p className="font-medium">{truck.odometerReading.toLocaleString()} miles</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Current Drivers */}
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Current Drivers
              </h4>
              {truck.currentDrivers && truck.currentDrivers.length > 0 ? (
                <div className="space-y-2">
                  {truck.currentDrivers.map((driver) => (
                    <div key={driver.id} className="p-2 bg-muted rounded">
                      <p className="font-medium">
                        {driver.user.firstName} {driver.user.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Driver #{driver.driverNumber}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No drivers assigned</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {truckId && (
                <Link href={`/dashboard/trucks/${truckId}`}>
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


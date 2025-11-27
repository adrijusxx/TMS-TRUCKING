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
import { formatDate, apiUrl } from '@/lib/utils';
import { DriverStatus } from '@prisma/client';
import { User, Phone, Mail, MapPin, Truck, Star, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

interface Driver {
  id: string;
  driverNumber: string;
  status: DriverStatus;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
  currentTruck?: {
    id: string;
    truckNumber: string;
  };
  licenseNumber?: string;
  licenseState?: string;
  homeTerminal?: string;
  totalLoads: number;
  totalMiles: number;
  rating: number | null;
  hireDate?: Date;
}

const statusColors: Record<DriverStatus, string> = {
  AVAILABLE: 'bg-green-100 text-green-800 border-green-200',
  ON_DUTY: 'bg-blue-100 text-blue-800 border-blue-200',
  DRIVING: 'bg-purple-100 text-purple-800 border-purple-200',
  OFF_DUTY: 'bg-gray-100 text-gray-800 border-gray-200',
  SLEEPER_BERTH: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  ON_LEAVE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  INACTIVE: 'bg-red-100 text-red-800 border-red-200',
  IN_TRANSIT: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  DISPATCHED: 'bg-cyan-100 text-cyan-800 border-cyan-200',
};

function formatStatus(status: DriverStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

async function fetchDriver(id: string) {
  const response = await fetch(apiUrl(`/api/drivers/${id}`));
  if (!response.ok) throw new Error('Failed to fetch driver');
  return response.json();
}

interface DriverQuickViewProps {
  driverId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DriverQuickView({ driverId, open, onOpenChange }: DriverQuickViewProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['driver', driverId],
    queryFn: () => fetchDriver(driverId!),
    enabled: !!driverId && open,
  });

  const driver: Driver | undefined = data?.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Driver Details
          </DialogTitle>
          <DialogDescription>Quick view of driver information</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">
            Error loading driver details
          </div>
        ) : !driver ? (
          <div className="text-center py-8 text-muted-foreground">
            Driver not found
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold">
                  {driver.user.firstName} {driver.user.lastName}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Driver #{driver.driverNumber}
                </p>
              </div>
              <Badge
                variant="outline"
                className={`${statusColors[driver.status as DriverStatus]}`}
              >
                {formatStatus(driver.status)}
              </Badge>
            </div>

            <Separator />

            {/* Contact Information */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contact Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    {driver.user.email}
                  </p>
                </div>
                {driver.user.phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      {driver.user.phone}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Driver Information */}
            <div className="grid grid-cols-2 gap-4">
              {driver.licenseNumber && (
                <div>
                  <p className="text-sm text-muted-foreground">License Number</p>
                  <p className="font-medium">
                    {driver.licenseNumber} {driver.licenseState && `(${driver.licenseState})`}
                  </p>
                </div>
              )}
              {driver.homeTerminal && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Home Terminal
                  </p>
                  <p className="font-medium">{driver.homeTerminal}</p>
                </div>
              )}
              {driver.hireDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Hire Date</p>
                  <p className="font-medium">{formatDate(driver.hireDate)}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Assignment */}
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Current Assignment
              </h4>
              {driver.currentTruck ? (
                <p className="font-medium">
                  Truck #{driver.currentTruck.truckNumber}
                </p>
              ) : (
                <p className="text-muted-foreground">No truck assigned</p>
              )}
            </div>

            <Separator />

            {/* Performance Metrics */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Total Loads</p>
                <p className="text-2xl font-bold">{driver.totalLoads}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Miles</p>
                <p className="text-2xl font-bold">{driver.totalMiles.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Rating
                </p>
                <p className="text-2xl font-bold">
                  {driver.rating ? driver.rating.toFixed(1) : 'N/A'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {driverId && (
                <Link href={`/dashboard/drivers/${driverId}`}>
                  <Button>
                    Edit Driver
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


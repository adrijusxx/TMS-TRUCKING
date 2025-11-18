'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { TruckStatus } from '@prisma/client';
import {
  ArrowLeft,
  Truck,
  Calendar,
  Wrench,
  User,
  Package,
  FileText,
} from 'lucide-react';

interface TruckDetailProps {
  truck: any;
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

export default function TruckDetail({ truck }: TruckDetailProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/trucks">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{truck.truckNumber}</h1>
            <p className="text-muted-foreground">
              {truck.year} {truck.make} {truck.model}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={statusColors[truck.status as TruckStatus]}>
          {formatStatus(truck.status)}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Vehicle Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Vehicle Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">VIN</p>
              <p className="font-medium font-mono">{truck.vin}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">License Plate</p>
              <p className="font-medium">
                {truck.licensePlate} ({truck.state})
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Equipment Type</p>
              <p className="font-medium">
                {formatEquipmentType(truck.equipmentType)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Capacity</p>
              <p className="font-medium">
                {truck.capacity.toLocaleString()} lbs
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Odometer</p>
              <p className="font-medium">
                {truck.odometerReading.toLocaleString()} miles
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Compliance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Registration</p>
              <p className="font-medium">
                Expires: {formatDate(truck.registrationExpiry)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Insurance</p>
              <p className="font-medium">
                Expires: {formatDate(truck.insuranceExpiry)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Inspection</p>
              <p className="font-medium">
                Expires: {formatDate(truck.inspectionExpiry)}
              </p>
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">ELD:</p>
                <Badge variant={truck.eldInstalled ? 'default' : 'outline'}>
                  {truck.eldInstalled ? 'Installed' : 'Not Installed'}
                </Badge>
              </div>
              {truck.eldProvider && (
                <p className="text-sm text-muted-foreground mt-1">
                  Provider: {truck.eldProvider}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Current Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Current Assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {truck.currentDrivers && truck.currentDrivers.length > 0 ? (
              <div className="space-y-3">
                {truck.currentDrivers.map((driver: any) => (
                  <div key={driver.id}>
                    <Link
                      href={`/dashboard/drivers/${driver.id}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {driver.user.firstName} {driver.user.lastName}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {driver.driverNumber}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No driver assigned</p>
            )}
          </CardContent>
        </Card>

        {/* Active Loads */}
        {truck.loads && truck.loads.length > 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Active Loads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {truck.loads.map((load: any) => (
                  <div
                    key={load.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <Link
                        href={`/dashboard/loads/${load.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {load.loadNumber}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {load.pickupCity}, {load.pickupState} → {load.deliveryCity},{' '}
                        {load.deliveryState}
                      </p>
                    </div>
                    <Badge variant="outline">{load.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Maintenance History */}
        {truck.maintenanceRecords && truck.maintenanceRecords.length > 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Recent Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {truck.maintenanceRecords.map((record: any) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{record.type.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-muted-foreground">
                        {record.description}
                      </p>
                      {record.scheduledDate && (
                        <p className="text-sm text-muted-foreground">
                          Scheduled: {formatDate(record.scheduledDate)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${record.cost.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        {record.mileage.toLocaleString()} mi
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}


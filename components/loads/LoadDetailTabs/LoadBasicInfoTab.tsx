'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadStatus, LoadType, EquipmentType, LoadDispatchStatus } from '@prisma/client';
import DriverCombobox from '@/components/drivers/DriverCombobox';
import TruckCombobox from '@/components/trucks/TruckCombobox';
import TrailerCombobox from '@/components/trailers/TrailerCombobox';
import CustomerCombobox from '@/components/customers/CustomerCombobox';
import { Package, User, Truck } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';

interface LoadBasicInfoTabProps {
  load: any;
  formData: any;
  onFormDataChange: (data: any) => void;
  availableDrivers?: any[];
  availableTrucks?: any[];
  customers?: any[];
}

export default function LoadBasicInfoTab({
  load,
  formData,
  onFormDataChange,
  availableDrivers = [],
  availableTrucks = [],
  customers = [],
}: LoadBasicInfoTabProps) {
  const { can } = usePermissions();
  const canEdit = can('loads.edit');

  const updateField = (field: string, value: any) => {
    onFormDataChange({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-4">
      {/* Assignment Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Assignment</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {canEdit ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="truckId" className="text-sm">Truck</Label>
                  <TruckCombobox
                    value={formData.truckId || ''}
                    onValueChange={(value) => updateField('truckId', value)}
                    placeholder="Search truck..."
                    trucks={availableTrucks}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trailerId" className="text-sm">Trailer</Label>
                  <TrailerCombobox
                    value={formData.trailerId || formData.trailerNumber || ''}
                    onValueChange={(value) => updateField('trailerId', value)}
                    placeholder="Search trailer..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driverId" className="text-sm">Driver</Label>
                  <DriverCombobox
                    value={formData.driverId || ''}
                    onValueChange={(value) => updateField('driverId', value)}
                    placeholder="Search driver..."
                    drivers={availableDrivers}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coDriverId" className="text-sm">Co-Driver (Optional)</Label>
                  <DriverCombobox
                    value={formData.coDriverId || ''}
                    onValueChange={(value) => updateField('coDriverId', value)}
                    placeholder="Search co-driver..."
                    drivers={availableDrivers}
                  />
                </div>
              </>
            ) : (
              <>
                {load.truck && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Truck</Label>
                    <p className="font-medium text-sm mt-1">#{load.truck.truckNumber}</p>
                  </div>
                )}
                {(load.trailer || load.trailerNumber) && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Trailer</Label>
                    <p className="font-medium text-sm mt-1">
                      {load.trailer?.trailerNumber || load.trailerNumber}
                    </p>
                  </div>
                )}
                {load.driver && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Driver</Label>
                    <p className="font-medium text-sm mt-1">
                      {load.driver.user.firstName} {load.driver.user.lastName} (#{load.driver.driverNumber})
                    </p>
                  </div>
                )}
                {load.coDriver && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Co-Driver</Label>
                    <p className="font-medium text-sm mt-1">
                      {load.coDriver.user.firstName} {load.coDriver.user.lastName} (#{load.coDriver.driverNumber})
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Load Details Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Load Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm">Status</Label>
              {canEdit ? (
                <Select
                  value={formData.status || load.status}
                  onValueChange={(value) => updateField('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(LoadStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="font-medium text-sm mt-1">{String(load.status).replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dispatchStatus" className="text-sm">Dispatch Status</Label>
              <p className="font-medium text-sm mt-1 text-muted-foreground">
                {load.dispatchStatus ? load.dispatchStatus.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Not Set'}
              </p>
              <p className="text-xs text-muted-foreground">
                Use the dispatch status selector in the header to change this value.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="loadType" className="text-sm">Load Type</Label>
              {canEdit ? (
                <Select
                  value={formData.loadType || load.loadType}
                  onValueChange={(value) => updateField('loadType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(LoadType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="font-medium text-sm mt-1">{load.loadType}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="equipmentType" className="text-sm">Equipment Type</Label>
              {canEdit ? (
                <Select
                  value={formData.equipmentType || load.equipmentType}
                  onValueChange={(value) => updateField('equipmentType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(EquipmentType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="font-medium text-sm mt-1">{load.equipmentType.replace(/_/g, ' ')}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Customer</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {canEdit ? (
            <div className="space-y-2">
              <Label htmlFor="customerId" className="text-sm">Customer</Label>
              <CustomerCombobox
                value={formData.customerId || load.customerId}
                onValueChange={(value) => updateField('customerId', value)}
                placeholder="Search customer..."
                customers={customers}
              />
            </div>
          ) : (
            <div>
              <Label className="text-sm text-muted-foreground">Customer</Label>
              <p className="font-medium text-sm mt-1">{load.customer?.name}</p>
              {load.customer?.customerNumber && (
                <p className="text-xs text-muted-foreground mt-1">#{load.customer.customerNumber}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadata Section */}
      {(load.dispatcher || load.createdBy || load.mcNumber) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {load.dispatcher && (
                <div>
                  <Label className="text-sm text-muted-foreground">Dispatcher</Label>
                  <p className="font-medium text-sm mt-1">
                    {load.dispatcher.firstName} {load.dispatcher.lastName}
                  </p>
                </div>
              )}
              {load.createdBy && (
                <div>
                  <Label className="text-sm text-muted-foreground">Created By</Label>
                  <p className="font-medium text-sm mt-1">
                    {load.createdBy.firstName} {load.createdBy.lastName}
                  </p>
                </div>
              )}
              {load.mcNumber && (
                <div>
                  <Label className="text-sm text-muted-foreground">MC Number</Label>
                  <p className="font-medium text-sm mt-1">{load.mcNumber.mcNumber}</p>
                </div>
              )}
              {load.tripId && (
                <div>
                  <Label className="text-sm text-muted-foreground">Trip ID</Label>
                  <p className="font-medium text-sm mt-1">{load.tripId}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


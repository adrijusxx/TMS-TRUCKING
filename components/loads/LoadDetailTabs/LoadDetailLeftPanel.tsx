'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { usePermissions } from '@/hooks/usePermissions';
import { Truck } from 'lucide-react';
import DriverCombobox from '@/components/drivers/DriverCombobox';
import TruckCombobox from '@/components/trucks/TruckCombobox';
import TrailerCombobox from '@/components/trailers/TrailerCombobox';
import CustomerCombobox from '@/components/customers/CustomerCombobox';
import DispatcherCombobox from '@/components/users/DispatcherCombobox';
import LoadSegments from '../LoadSegments';
import LoadRouteTab from './LoadRouteTab';

interface LoadDetailLeftPanelProps {
  load: any;
  formData: any;
  onFormDataChange: (data: any) => void;
  availableDrivers: any[];
  availableTrucks: any[];
  availableTrailers: any[];
  customers: any[];
  onLoadRefetch: () => void;
}

export default function LoadDetailLeftPanel({
  load,
  formData,
  onFormDataChange,
  availableDrivers,
  availableTrucks,
  availableTrailers,
  customers,
  onLoadRefetch,
}: LoadDetailLeftPanelProps) {
  const { can } = usePermissions();
  const canEdit = can('loads.edit');

  const updateField = (field: string, value: any) => {
    onFormDataChange({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-3">
      {/* Compact Assignment Grid */}
      <AssignmentSection
        load={load}
        formData={formData}
        canEdit={canEdit}
        updateField={updateField}
        availableDrivers={availableDrivers}
        availableTrucks={availableTrucks}
        availableTrailers={availableTrailers}
        customers={customers}
      />

      {/* Route & Map */}
      <LoadRouteTab
        load={load}
        formData={formData}
        onFormDataChange={onFormDataChange}
      />

      {/* Load Segments (if any) */}
      {load.segments && load.segments.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="py-2 px-3">
            <div className="flex items-center gap-2">
              <Truck className="h-3.5 w-3.5 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Segments ({load.segments.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="py-2 px-3">
            <LoadSegments
              loadId={load.id}
              segments={load.segments || []}
              availableDrivers={availableDrivers}
              availableTrucks={availableTrucks}
              canEdit={canEdit}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ─── Compact Assignment ─── */
function AssignmentSection({
  load, formData, canEdit, updateField, availableDrivers, availableTrucks, availableTrailers, customers,
}: {
  load: any; formData: any; canEdit: boolean; updateField: (f: string, v: any) => void;
  availableDrivers: any[]; availableTrucks: any[]; availableTrailers: any[]; customers: any[];
}) {
  if (!canEdit) {
    return (
      <div className="rounded-lg border bg-card p-3 space-y-2">
        <div className="grid gap-x-4 gap-y-1 grid-cols-3">
          {load.truck && (
            <div>
              <span className="text-[10px] text-muted-foreground">Truck</span>
              <p className="text-xs font-medium">#{load.truck.truckNumber}</p>
            </div>
          )}
          {(load.trailer || load.trailerNumber) && (
            <div>
              <span className="text-[10px] text-muted-foreground">Trailer</span>
              <p className="text-xs font-medium">{load.trailer?.trailerNumber || load.trailerNumber}</p>
            </div>
          )}
          {load.driver && (
            <div>
              <span className="text-[10px] text-muted-foreground">Driver</span>
              <p className="text-xs font-medium">{load.driver.user?.firstName} {load.driver.user?.lastName}</p>
            </div>
          )}
        </div>
        <div className="grid gap-x-4 gap-y-1 grid-cols-3">
          {load.dispatcher && (
            <div>
              <span className="text-[10px] text-muted-foreground">Dispatcher</span>
              <p className="text-xs font-medium">{load.dispatcher.firstName} {load.dispatcher.lastName}</p>
            </div>
          )}
          {load.customer && (
            <div>
              <span className="text-[10px] text-muted-foreground">Customer</span>
              <p className="text-xs font-medium">{load.customer.name}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-3 space-y-3">
      {/* Row 1: Truck, Trailer, Driver */}
      <div className="grid gap-3 grid-cols-3">
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Truck</Label>
          <TruckCombobox
            value={formData.truckId || ''}
            onValueChange={(value) => updateField('truckId', value)}
            placeholder="Select truck..."
            trucks={availableTrucks}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Trailer</Label>
          <TrailerCombobox
            value={formData.trailerId || formData.trailerNumber || ''}
            onValueChange={(value) => updateField('trailerId', value)}
            placeholder="Select trailer..."
            className="h-8 text-xs"
            trailers={availableTrailers}
            selectedTrailer={load.trailer}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Driver</Label>
          <DriverCombobox
            value={formData.driverId || ''}
            onValueChange={(value) => updateField('driverId', value)}
            placeholder="Select driver..."
            drivers={availableDrivers}
            className="h-8 text-xs"
          />
        </div>
      </div>
      {/* Row 2: Co-Driver, Dispatcher, Customer */}
      <div className="grid gap-3 grid-cols-3">
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Co-Driver</Label>
          <DriverCombobox
            value={formData.coDriverId || ''}
            onValueChange={(value) => updateField('coDriverId', value)}
            placeholder="Optional"
            drivers={availableDrivers}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Dispatcher</Label>
          <DispatcherCombobox
            value={formData.dispatcherId || ''}
            onValueChange={(value) => updateField('dispatcherId', value)}
            placeholder="Select dispatcher..."
            className="h-8 text-xs"
            defaultDispatcher={load.dispatcher}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Customer</Label>
          <CustomerCombobox
            value={formData.customerId || load.customerId}
            onValueChange={(value) => updateField('customerId', value)}
            placeholder="Select customer..."
            customers={customers}
            className="h-8 text-xs"
          />
        </div>
      </div>
    </div>
  );
}

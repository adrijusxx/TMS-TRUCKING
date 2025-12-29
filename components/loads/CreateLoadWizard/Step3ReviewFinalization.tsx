'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CheckCircle, MapPin, Package, User, Truck, Plus } from 'lucide-react';
import type { CreateLoadInput } from '@/lib/validations/load';
import { format } from 'date-fns';
import CustomerCombobox from '@/components/customers/CustomerCombobox';
import { useQuery } from '@tanstack/react-query';
import { apiUrl } from '@/lib/utils';
import CustomerSheet from '@/components/customers/CustomerSheet';
import { useState } from 'react';
import {
  PickupSection,
  DeliverySection,
  LoadSpecsSection,
  FinancialSection,
  AdditionalFieldsSection,
} from './sections';

interface Step3ReviewFinalizationProps {
  loadData: Partial<CreateLoadInput>;
  onFieldChange: (field: keyof CreateLoadInput, value: any) => void;
  errors?: Record<string, string>;
}

async function fetchCustomers() {
  const response = await fetch(apiUrl('/api/customers?limit=100'));
  if (!response.ok) throw new Error('Failed to fetch customers');
  return response.json();
}

async function fetchDriver(driverId: string) {
  const response = await fetch(apiUrl(`/api/drivers/${driverId}`));
  if (!response.ok) throw new Error('Failed to fetch driver');
  return response.json();
}

async function fetchTruck(truckId: string) {
  const response = await fetch(apiUrl(`/api/trucks/${truckId}`));
  if (!response.ok) throw new Error('Failed to fetch truck');
  return response.json();
}

export default function Step3ReviewFinalization({
  loadData,
  onFieldChange,
  errors = {},
}: Step3ReviewFinalizationProps) {
  const [isCustomerSheetOpen, setIsCustomerSheetOpen] = useState(false);
  const hasMultipleStops = loadData.stops && Array.isArray(loadData.stops) && loadData.stops.length > 0;

  const { data: customersData, refetch: refetchCustomers } = useQuery({
    queryKey: ['customers', 'wizard'],
    queryFn: fetchCustomers,
  });

  const { data: driverData } = useQuery({
    queryKey: ['driver', loadData.driverId, 'wizard'],
    queryFn: () => fetchDriver(loadData.driverId!),
    enabled: !!loadData.driverId,
  });

  const { data: truckData } = useQuery({
    queryKey: ['truck', loadData.truckId, 'wizard'],
    queryFn: () => fetchTruck(loadData.truckId!),
    enabled: !!loadData.truckId,
  });

  const customers = customersData?.data || [];
  const driver = driverData?.data;
  const truck = truckData?.data;

  const handleCustomerCreated = async (customerId?: string) => {
    await refetchCustomers();
    if (customerId) onFieldChange('customerId', customerId);
    setIsCustomerSheetOpen(false);
  };

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return '';
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      return format(d, 'MMM dd, yyyy HH:mm');
    } catch {
      return String(date);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Review & Finalization
          </CardTitle>
          <CardDescription>
            Review all load details. You can edit any field to correct errors or add missing information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Package className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Basic Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="loadNumber" className="text-sm">
                  Load Number {!loadData.loadNumber && <span className="text-muted-foreground text-xs">(auto-generated if empty)</span>}
                </Label>
                <Input
                  id="loadNumber"
                  value={loadData.loadNumber || ''}
                  onChange={(e) => onFieldChange('loadNumber', e.target.value)}
                  placeholder="Leave empty to auto-generate"
                  className={errors.loadNumber ? 'border-destructive' : ''}
                />
                {errors.loadNumber && (
                  <p className="text-xs text-destructive">{errors.loadNumber}</p>
                )}
                {!loadData.loadNumber && (
                  <p className="text-xs text-muted-foreground">A unique load number will be generated automatically</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="loadType" className="text-sm">
                  Load Type *
                </Label>
                <Select
                  value={loadData.loadType || 'FTL'}
                  onValueChange={(value) => onFieldChange('loadType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FTL">Full Truckload</SelectItem>
                    <SelectItem value="LTL">Less Than Truckload</SelectItem>
                    <SelectItem value="PARTIAL">Partial</SelectItem>
                    <SelectItem value="INTERMODAL">Intermodal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="customerId" className="text-sm">
                    Customer (Broker) *
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCustomerSheetOpen(true)}
                    className="h-7 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    New Customer
                  </Button>
                </div>
                <CustomerCombobox
                  value={loadData.customerId || ''}
                  onValueChange={(value) => onFieldChange('customerId', value)}
                  onNewCustomer={() => setIsCustomerSheetOpen(true)}
                  placeholder="Search customer by name, number, or email..."
                  customers={customers}
                  className="flex-1"
                />
                {errors.customerId && (
                  <p className="text-xs text-destructive">{errors.customerId}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="equipmentType" className="text-sm">
                  Equipment Type *
                </Label>
                <Select
                  value={loadData.equipmentType || 'DRY_VAN'}
                  onValueChange={(value) => onFieldChange('equipmentType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRY_VAN">Dry Van</SelectItem>
                    <SelectItem value="REEFER">Reefer</SelectItem>
                    <SelectItem value="FLATBED">Flatbed</SelectItem>
                    <SelectItem value="STEP_DECK">Step Deck</SelectItem>
                    <SelectItem value="LOWBOY">Lowboy</SelectItem>
                    <SelectItem value="TANKER">Tanker</SelectItem>
                    <SelectItem value="CONESTOGA">Conestoga</SelectItem>
                    <SelectItem value="POWER_ONLY">Power Only</SelectItem>
                    <SelectItem value="HOTSHOT">Hotshot</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Resource Assignment (if driver/truck/trailer selected in step 2) */}
          {(loadData.driverId || loadData.truckId || loadData.trailerNumber) && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <User className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">Resource Assignment</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {loadData.driverId && driver && (
                  <div className="space-y-2">
                    <Label className="text-sm flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      Driver
                    </Label>
                    <div className="p-2 bg-muted rounded-md text-sm">
                      <div className="font-medium">
                        {driver.user?.firstName} {driver.user?.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        #{driver.driverNumber}
                      </div>
                    </div>
                  </div>
                )}
                {loadData.truckId && truck && (
                  <div className="space-y-2">
                    <Label className="text-sm flex items-center gap-2">
                      <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                      Truck
                    </Label>
                    <div className="p-2 bg-muted rounded-md text-sm">
                      <div className="font-medium">#{truck.truckNumber}</div>
                      {truck.make && truck.model && (
                        <div className="text-xs text-muted-foreground">
                          {truck.make} {truck.model}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {loadData.trailerNumber && (
                  <div className="space-y-2">
                    <Label className="text-sm flex items-center gap-2">
                      <Package className="h-3.5 w-3.5 text-muted-foreground" />
                      Trailer
                    </Label>
                    <div className="p-2 bg-muted rounded-md text-sm">
                      <div className="font-medium">#{loadData.trailerNumber}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location Information */}
      {hasMultipleStops ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Multi-Stop Route ({loadData.stops!.length} stops)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loadData.stops!.map((stop: any, index: number) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${stop.stopType === 'PICKUP'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                      }`}>
                      Stop {stop.sequence} - {stop.stopType}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Company:</span>{' '}
                      <span className="font-medium">{stop.company || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Address:</span>{' '}
                      <span className="font-medium">{stop.address}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">City, State:</span>{' '}
                      <span className="font-medium">
                        {stop.city}, {stop.state} {stop.zip}
                      </span>
                    </div>
                    {stop.earliestArrival && (
                      <div>
                        <span className="text-muted-foreground">Earliest:</span>{' '}
                        <span className="font-medium">{formatDate(stop.earliestArrival)}</span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PickupSection
            loadData={loadData}
            onFieldChange={onFieldChange}
            errors={errors}
          />
          <DeliverySection
            loadData={loadData}
            onFieldChange={onFieldChange}
            errors={errors}
          />
        </div>
      )}

      {/* Load Specifications */}
      <LoadSpecsSection
        loadData={loadData}
        onFieldChange={onFieldChange}
        errors={errors}
      />

      {/* Financial Information */}
      <FinancialSection
        loadData={loadData}
        onFieldChange={onFieldChange}
        errors={errors}
      />

      {/* Additional Information */}
      <AdditionalFieldsSection
        loadData={loadData}
        onFieldChange={onFieldChange}
        errors={errors}
      />

      {/* Customer Creation Sheet */}
      <CustomerSheet
        open={isCustomerSheetOpen}
        onOpenChange={setIsCustomerSheetOpen}
        onSuccess={handleCustomerCreated}
        mode="create"
      />
    </div>
  );
}

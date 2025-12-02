'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Edit, MapPin, Package, DollarSign, User, Truck, Building2 } from 'lucide-react';
import type { CreateLoadInput } from '@/lib/validations/load';
import { LoadType, EquipmentType } from '@prisma/client';
import { format } from 'date-fns';
import CustomerCombobox from '@/components/customers/CustomerCombobox';
import { useQuery } from '@tanstack/react-query';
import { apiUrl } from '@/lib/utils';
import CreateCustomerDialog from '@/components/customers/CreateCustomerDialog';
import { useState } from 'react';

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
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);

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

  const handleCustomerCreated = async (customerId: string) => {
    await refetchCustomers();
    onFieldChange('customerId', customerId);
    setIsCustomerDialogOpen(false);
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
                  Load Number *
                </Label>
                <Input
                  id="loadNumber"
                  value={loadData.loadNumber || ''}
                  onChange={(e) => onFieldChange('loadNumber', e.target.value)}
                  className={errors.loadNumber ? 'border-destructive' : ''}
                />
                {errors.loadNumber && (
                  <p className="text-xs text-destructive">{errors.loadNumber}</p>
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
                <Label htmlFor="customerId" className="text-sm">
                  Customer (Broker) *
                </Label>
                <CustomerCombobox
                  value={loadData.customerId || ''}
                  onValueChange={(value) => onFieldChange('customerId', value)}
                  onNewCustomer={() => setIsCustomerDialogOpen(true)}
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

          {/* Location Information */}
          {loadData.stops && Array.isArray(loadData.stops) && loadData.stops.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">Multi-Stop Route ({loadData.stops.length} stops)</h3>
              </div>
              <div className="space-y-3">
                {loadData.stops.map((stop: any, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded">
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
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">Location Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pickup */}
                <div className="space-y-3 p-4 border rounded-md">
                  <h4 className="font-medium text-sm">Pickup</h4>
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="pickupLocation" className="text-xs">
                        Location Name
                      </Label>
                      <Input
                        id="pickupLocation"
                        value={loadData.pickupLocation || ''}
                        onChange={(e) => onFieldChange('pickupLocation', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pickupAddress" className="text-xs">
                        Address
                      </Label>
                      <Input
                        id="pickupAddress"
                        value={loadData.pickupAddress || ''}
                        onChange={(e) => onFieldChange('pickupAddress', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label htmlFor="pickupCity" className="text-xs">City</Label>
                        <Input
                          id="pickupCity"
                          value={loadData.pickupCity || ''}
                          onChange={(e) => onFieldChange('pickupCity', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="pickupState" className="text-xs">State</Label>
                        <Input
                          id="pickupState"
                          value={loadData.pickupState || ''}
                          onChange={(e) => onFieldChange('pickupState', e.target.value.toUpperCase().slice(0, 2))}
                          maxLength={2}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="pickupZip" className="text-xs">ZIP</Label>
                        <Input
                          id="pickupZip"
                          value={loadData.pickupZip || ''}
                          onChange={(e) => onFieldChange('pickupZip', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="pickupDate" className="text-xs">
                        Pickup Date
                      </Label>
                      <Input
                        id="pickupDate"
                        type="datetime-local"
                        value={
                          loadData.pickupDate
                            ? typeof loadData.pickupDate === 'string'
                              ? loadData.pickupDate.includes('T')
                                ? loadData.pickupDate.slice(0, 16)
                                : new Date(loadData.pickupDate).toISOString().slice(0, 16)
                              : new Date(loadData.pickupDate).toISOString().slice(0, 16)
                            : ''
                        }
                        onChange={(e) => onFieldChange('pickupDate', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery */}
                <div className="space-y-3 p-4 border rounded-md">
                  <h4 className="font-medium text-sm">Delivery</h4>
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="deliveryLocation" className="text-xs">
                        Location Name
                      </Label>
                      <Input
                        id="deliveryLocation"
                        value={loadData.deliveryLocation || ''}
                        onChange={(e) => onFieldChange('deliveryLocation', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="deliveryAddress" className="text-xs">
                        Address
                      </Label>
                      <Input
                        id="deliveryAddress"
                        value={loadData.deliveryAddress || ''}
                        onChange={(e) => onFieldChange('deliveryAddress', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label htmlFor="deliveryCity" className="text-xs">City</Label>
                        <Input
                          id="deliveryCity"
                          value={loadData.deliveryCity || ''}
                          onChange={(e) => onFieldChange('deliveryCity', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="deliveryState" className="text-xs">State</Label>
                        <Input
                          id="deliveryState"
                          value={loadData.deliveryState || ''}
                          onChange={(e) => onFieldChange('deliveryState', e.target.value.toUpperCase().slice(0, 2))}
                          maxLength={2}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="deliveryZip" className="text-xs">ZIP</Label>
                        <Input
                          id="deliveryZip"
                          value={loadData.deliveryZip || ''}
                          onChange={(e) => onFieldChange('deliveryZip', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="deliveryDate" className="text-xs">
                        Delivery Date
                      </Label>
                      <Input
                        id="deliveryDate"
                        type="datetime-local"
                        value={
                          loadData.deliveryDate
                            ? typeof loadData.deliveryDate === 'string'
                              ? loadData.deliveryDate.includes('T')
                                ? loadData.deliveryDate.slice(0, 16)
                                : new Date(loadData.deliveryDate).toISOString().slice(0, 16)
                              : new Date(loadData.deliveryDate).toISOString().slice(0, 16)
                            : ''
                        }
                        onChange={(e) => onFieldChange('deliveryDate', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Load Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Package className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Load Details</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight" className="text-sm">
                  Weight (lbs) *
                </Label>
                <Input
                  id="weight"
                  type="number"
                  value={loadData.weight ?? ''}
                  onChange={(e) => onFieldChange('weight', e.target.value ? Number(e.target.value) : undefined)}
                  className={errors.weight ? 'border-destructive' : ''}
                  placeholder="Enter weight"
                />
                {errors.weight && (
                  <p className="text-xs text-destructive">{errors.weight}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="pieces" className="text-sm">
                  Pieces
                </Label>
                <Input
                  id="pieces"
                  type="number"
                  value={loadData.pieces ?? ''}
                  onChange={(e) => onFieldChange('pieces', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Enter pieces"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commodity" className="text-sm">
                  Commodity
                </Label>
                <Input
                  id="commodity"
                  value={loadData.commodity ?? ''}
                  onChange={(e) => onFieldChange('commodity', e.target.value)}
                  placeholder="Enter commodity"
                />
              </div>
            </div>
          </div>

          {/* Resource Assignment */}
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

          {/* Financial Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Financial Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="revenue" className="text-sm">
                  Revenue ($) *
                </Label>
                <Input
                  id="revenue"
                  type="number"
                  step="0.01"
                  value={loadData.revenue ?? ''}
                  onChange={(e) => onFieldChange('revenue', e.target.value ? Number(e.target.value) : 0)}
                  className={errors.revenue ? 'border-destructive' : ''}
                  placeholder="Enter revenue"
                />
                {errors.revenue && (
                  <p className="text-xs text-destructive">{errors.revenue}</p>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="dispatchNotes" className="text-sm">
              Dispatch Notes
            </Label>
            <Textarea
              id="dispatchNotes"
              value={loadData.dispatchNotes || ''}
              onChange={(e) => onFieldChange('dispatchNotes', e.target.value)}
              rows={3}
              placeholder="Any special instructions for dispatch..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Customer Creation Dialog */}
      <CreateCustomerDialog
        open={isCustomerDialogOpen}
        onOpenChange={setIsCustomerDialogOpen}
        onCustomerCreated={handleCustomerCreated}
        quickCreate={true}
      />
    </div>
  );
}


'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadType, EquipmentType } from '@prisma/client';
import { Plus, Truck, Package } from 'lucide-react';
import CustomerCombobox from '@/components/customers/CustomerCombobox';
import DriverCombobox from '@/components/drivers/DriverCombobox';
import DispatcherCombobox from '@/components/users/DispatcherCombobox';
import McNumberSelector from '@/components/mc-numbers/McNumberSelector';
import type { LoadFormStepBaseProps } from './types';

interface LoadFormBasicStepProps extends LoadFormStepBaseProps {
  customers: any[];
  drivers: any[];
  selectedDriver: any;
  canReassignDriver: boolean;
  isAdmin: boolean;
  hasMultipleMcAccess: boolean;
  selectedMcNumberId?: string;
  setSelectedMcNumberId: (id: string) => void;
  currentMcNumber: string | null;
  handleDriverChange: (driverId: string) => void;
  onNewCustomer: () => void;
}

export function LoadFormBasicStep({
  form: { register, errors, watch, setValue },
  isCreateMode,
  customers,
  drivers,
  selectedDriver,
  canReassignDriver,
  isAdmin,
  hasMultipleMcAccess,
  selectedMcNumberId,
  setSelectedMcNumberId,
  currentMcNumber,
  handleDriverChange,
  onNewCustomer,
}: LoadFormBasicStepProps) {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="loadNumber" className="text-xs">Load Number *</Label>
        <Input
          id="loadNumber"
          placeholder="LOAD-2024-001"
          className={isCreateMode ? 'h-8 text-sm' : ''}
          {...register('loadNumber')}
        />
        {errors.loadNumber && (
          <p className="text-xs text-destructive">
            {errors.loadNumber.message as string}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="customerId" className="text-xs">Customer *</Label>
          {isCreateMode && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">Type to search</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onNewCustomer}
                className="h-6 text-xs px-2"
              >
                <Plus className="h-3 w-3 mr-1" />
                New
              </Button>
            </div>
          )}
        </div>
        {isCreateMode ? (
          <CustomerCombobox
            key={`customer-${customers.length}-${watch('customerId')}`}
            value={watch('customerId') || ''}
            onValueChange={(value) => {
              if (value && value.trim() !== '') {
                setValue('customerId', value, { shouldValidate: true });
              } else {
                setValue('customerId', '', { shouldValidate: true });
              }
            }}
            onNewCustomer={onNewCustomer}
            placeholder="Search customer by name, number, or email..."
            className="h-8 text-sm"
            customers={customers}
          />
        ) : (
          <Select
            value={watch('customerId') || ''}
            onValueChange={(value) => setValue('customerId', value, { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer: any) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name} ({customer.customerNumber})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {errors.customerId && (
          <p className="text-xs text-destructive">
            {errors.customerId.message as string}
          </p>
        )}
      </div>

      {isCreateMode && hasMultipleMcAccess ? (
        <div className="space-y-1.5">
          <McNumberSelector
            value={selectedMcNumberId || ''}
            onValueChange={(mcNumberId) => setSelectedMcNumberId(mcNumberId)}
            label="MC Number"
            required={false}
            className="text-xs"
          />
        </div>
      ) : isCreateMode && currentMcNumber ? (
        <div className="space-y-1">
          <Label className="text-xs">MC Number</Label>
          <div className="p-1.5 bg-muted rounded text-xs">
            {currentMcNumber}
          </div>
        </div>
      ) : null}

      {isCreateMode && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="driverId" className="text-xs">
              Driver {canReassignDriver && !isAdmin && '(MC only)'}
            </Label>
            {canReassignDriver && (
              <span className="text-[10px] text-muted-foreground">Type to search</span>
            )}
          </div>
          {canReassignDriver ? (
            <DriverCombobox
              value={watch('driverId') || ''}
              onValueChange={handleDriverChange}
              placeholder="Search driver by name or number..."
              className="h-8 text-sm"
              drivers={drivers}
            />
          ) : (
            <div className="p-1.5 bg-muted rounded text-xs text-muted-foreground">
              Contact dispatcher to assign
            </div>
          )}
          {selectedDriver && (
            <div className="p-1.5 bg-muted rounded text-xs space-y-0.5">
              {selectedDriver.currentTruck && (
                <div className="flex items-center gap-1.5">
                  <Truck className="h-3 w-3" />
                  <span>Truck: {selectedDriver.currentTruck.truckNumber}</span>
                </div>
              )}
              {selectedDriver.currentTrailer && (
                <div className="flex items-center gap-1.5">
                  <Package className="h-3 w-3" />
                  <span>Trailer: {selectedDriver.currentTrailer.trailerNumber}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="space-y-1.5 mb-2">
        <Label htmlFor="dispatcherId" className={isCreateMode ? 'text-xs' : ''}>Dispatcher</Label>
        <DispatcherCombobox
          value={watch('dispatcherId') || ''}
          onValueChange={(value) => setValue('dispatcherId', value, { shouldValidate: true })}
          className={isCreateMode ? 'h-8 text-sm' : ''}
        />
      </div>

      <div className={isCreateMode ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-2 gap-4'}>
        <div className="space-y-1.5">
          <Label htmlFor="loadType" className={isCreateMode ? 'text-xs' : ''}>Load Type *</Label>
          <Select
            onValueChange={(value) => setValue('loadType', value as LoadType)}
            defaultValue="FTL"
            value={watch('loadType') || 'FTL'}
          >
            <SelectTrigger className={isCreateMode ? 'h-8 text-sm' : ''}>
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

        <div className="space-y-1.5">
          <Label htmlFor="equipmentType" className={isCreateMode ? 'text-xs' : ''}>Equipment Type *</Label>
          <Select
            onValueChange={(value) => setValue('equipmentType', value as EquipmentType)}
            defaultValue="DRY_VAN"
            value={watch('equipmentType') || 'DRY_VAN'}
          >
            <SelectTrigger className={isCreateMode ? 'h-8 text-sm' : ''}>
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
    </>
  );
}

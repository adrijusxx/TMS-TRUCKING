'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { LoadFormStepBaseProps } from './types';

type LoadFormRouteStepProps = LoadFormStepBaseProps;

export function LoadFormRouteStep({
  form: { register, errors, watch },
  isCreateMode,
  isMultiStop,
}: LoadFormRouteStepProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {/* Pickup */}
      <div className="space-y-2.5">
        <h4 className="text-sm font-semibold text-foreground">Pickup</h4>
        <PickupFields register={register} errors={errors} isCreateMode={isCreateMode} isMultiStop={isMultiStop} />
      </div>
      {/* Delivery */}
      <div className="space-y-2.5">
        <h4 className="text-sm font-semibold text-foreground">Delivery</h4>
        <DeliveryFields register={register} errors={errors} isCreateMode={isCreateMode} isMultiStop={isMultiStop} />
      </div>
    </div>
  );
}

/** Pickup fields — extracted from renderPickupFields */
function PickupFields({
  register,
  errors,
  isCreateMode,
  isMultiStop,
}: {
  register: any;
  errors: any;
  isCreateMode: boolean;
  isMultiStop: boolean;
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="pickupLocation" className={isCreateMode ? 'text-xs' : ''}>
          Location Name {!isMultiStop && '*'}
        </Label>
        <Input
          id="pickupLocation"
          placeholder="ABC Warehouse"
          className={isCreateMode ? 'h-8 text-sm' : ''}
          {...register('pickupLocation')}
        />
        {errors.pickupLocation && (
          <p className="text-xs text-destructive">{errors.pickupLocation.message as string}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pickupAddress" className={isCreateMode ? 'text-xs' : ''}>
          Address {!isMultiStop && '*'}
        </Label>
        <Input
          id="pickupAddress"
          placeholder="123 Main St"
          className={isCreateMode ? 'h-8 text-sm' : ''}
          {...register('pickupAddress')}
        />
      </div>

      <div className={isCreateMode ? 'grid grid-cols-3 gap-2' : 'grid grid-cols-2 gap-4'}>
        <div className="space-y-1.5">
          <Label htmlFor="pickupCity" className={isCreateMode ? 'text-xs' : ''}>
            City {!isMultiStop && '*'}
          </Label>
          <Input
            id="pickupCity"
            placeholder="Dallas"
            className={isCreateMode ? 'h-8 text-sm' : ''}
            {...register('pickupCity')}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pickupState" className={isCreateMode ? 'text-xs' : ''}>
            State {!isMultiStop && '*'}
          </Label>
          <Input
            id="pickupState"
            placeholder="TX"
            maxLength={2}
            className={isCreateMode ? 'h-8 text-sm' : ''}
            {...register('pickupState')}
          />
          {errors.pickupState && (
            <p className="text-xs text-destructive">{errors.pickupState.message as string}</p>
          )}
        </div>
        {isCreateMode && (
          <div className="space-y-1.5">
            <Label htmlFor="pickupZip" className="text-xs">ZIP {!isMultiStop && '*'}</Label>
            <Input
              id="pickupZip"
              placeholder="75001"
              className="h-8 text-sm"
              {...register('pickupZip')}
            />
            {errors.pickupZip && (
              <p className="text-xs text-destructive">{errors.pickupZip.message as string}</p>
            )}
          </div>
        )}
      </div>

      {!isCreateMode && (
        <div className="space-y-2">
          <Label htmlFor="pickupZip">ZIP</Label>
          <Input id="pickupZip" placeholder="75001" {...register('pickupZip')} />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="pickupDate" className={isCreateMode ? 'text-xs' : ''}>
          Pickup Date {!isMultiStop && '*'}
        </Label>
        <Input
          id="pickupDate"
          type="datetime-local"
          className={isCreateMode ? 'h-8 text-sm' : ''}
          {...register('pickupDate')}
        />
      </div>
    </>
  );
}

/** Delivery fields — extracted from renderDeliveryFields */
function DeliveryFields({
  register,
  errors,
  isCreateMode,
  isMultiStop,
}: {
  register: any;
  errors: any;
  isCreateMode: boolean;
  isMultiStop: boolean;
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="deliveryLocation" className={isCreateMode ? 'text-xs' : ''}>
          Location Name {!isMultiStop && '*'}
        </Label>
        <Input
          id="deliveryLocation"
          placeholder="XYZ Distribution"
          className={isCreateMode ? 'h-8 text-sm' : ''}
          {...register('deliveryLocation')}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="deliveryAddress" className={isCreateMode ? 'text-xs' : ''}>
          Address {!isMultiStop && '*'}
        </Label>
        <Input
          id="deliveryAddress"
          placeholder="456 Delivery Ave"
          className={isCreateMode ? 'h-8 text-sm' : ''}
          {...register('deliveryAddress')}
        />
      </div>

      <div className={isCreateMode ? 'grid grid-cols-3 gap-2' : 'grid grid-cols-2 gap-4'}>
        <div className="space-y-1.5">
          <Label htmlFor="deliveryCity" className={isCreateMode ? 'text-xs' : ''}>
            City {!isMultiStop && '*'}
          </Label>
          <Input
            id="deliveryCity"
            placeholder="Houston"
            className={isCreateMode ? 'h-8 text-sm' : ''}
            {...register('deliveryCity')}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="deliveryState" className={isCreateMode ? 'text-xs' : ''}>
            State {!isMultiStop && '*'}
          </Label>
          <Input
            id="deliveryState"
            placeholder="TX"
            maxLength={2}
            className={isCreateMode ? 'h-8 text-sm' : ''}
            {...register('deliveryState')}
          />
          {errors.deliveryState && (
            <p className="text-xs text-destructive">{errors.deliveryState.message as string}</p>
          )}
        </div>
        {isCreateMode && (
          <div className="space-y-1.5">
            <Label htmlFor="deliveryZip" className="text-xs">ZIP {!isMultiStop && '*'}</Label>
            <Input
              id="deliveryZip"
              placeholder="77001"
              className="h-8 text-sm"
              {...register('deliveryZip')}
            />
            {errors.deliveryZip && (
              <p className="text-xs text-destructive">{errors.deliveryZip.message as string}</p>
            )}
          </div>
        )}
      </div>

      {!isCreateMode && (
        <div className="space-y-2">
          <Label htmlFor="deliveryZip">ZIP</Label>
          <Input id="deliveryZip" placeholder="77001" {...register('deliveryZip')} />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="deliveryDate" className={isCreateMode ? 'text-xs' : ''}>
          Delivery Date {!isMultiStop && '*'}
        </Label>
        <Input
          id="deliveryDate"
          type="datetime-local"
          className={isCreateMode ? 'h-8 text-sm' : ''}
          {...register('deliveryDate')}
        />
      </div>
    </>
  );
}

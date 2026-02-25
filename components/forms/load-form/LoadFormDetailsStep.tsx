'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sparkles, MapPin } from 'lucide-react';
import TrailerCombobox from '@/components/trailers/TrailerCombobox';
import type { LoadFormStepBaseProps } from './types';

interface LoadFormDetailsStepProps extends LoadFormStepBaseProps {
  loadedMiles: number | undefined;
  emptyMiles: number | undefined;
  totalMiles: number | undefined;
  isCalculatingMiles: boolean;
  calculateMileage: () => void;
}

export function LoadFormDetailsStep({
  form: { register, errors, watch, setValue },
  isCreateMode,
  loadedMiles,
  emptyMiles,
  totalMiles,
  isCalculatingMiles,
  calculateMileage,
}: LoadFormDetailsStepProps) {
  return (
    <>
      <div className={isCreateMode ? 'grid grid-cols-1 md:grid-cols-3 gap-3' : 'grid grid-cols-2 gap-4'}>
        <div className="space-y-1.5">
          <Label htmlFor="weight" className={isCreateMode ? 'text-xs' : ''}>Weight (lbs) *</Label>
          <Input
            id="weight"
            type="number"
            placeholder="45000"
            className={isCreateMode ? 'h-8 text-sm' : ''}
            {...register('weight', { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pieces" className={isCreateMode ? 'text-xs' : ''}>Pieces</Label>
          <Input
            id="pieces"
            type="number"
            placeholder="20"
            className={isCreateMode ? 'h-8 text-sm' : ''}
            {...register('pieces', { valueAsNumber: true })}
          />
        </div>
        {isCreateMode && (
          <div className="space-y-1.5">
            <Label htmlFor="commodity" className="text-xs">Commodity</Label>
            <Input
              id="commodity"
              placeholder="Electronics"
              className="h-8 text-sm"
              {...register('commodity')}
            />
          </div>
        )}
      </div>

      {!isCreateMode && (
        <div className="space-y-2">
          <Label htmlFor="commodity">Commodity</Label>
          <Input id="commodity" placeholder="Electronics" {...register('commodity')} />
        </div>
      )}

      <div className={isCreateMode ? 'grid grid-cols-1 md:grid-cols-2 gap-3' : 'grid grid-cols-2 gap-4'}>
        <div className="space-y-1.5">
          <Label htmlFor="revenue" className={isCreateMode ? 'text-xs' : ''}>Revenue ($) *</Label>
          <Input
            id="revenue"
            type="number"
            step="0.01"
            placeholder={isCreateMode ? '2500.00' : '1500.00'}
            className={isCreateMode ? 'h-8 text-sm' : ''}
            {...register('revenue', { valueAsNumber: true })}
          />
        </div>
        {isCreateMode ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="trailerNumber" className="text-xs">Trailer Number</Label>
              <span className="text-[10px] text-muted-foreground">Type to search</span>
            </div>
            <TrailerCombobox
              value={watch('trailerNumber') || ''}
              onValueChange={(value) => setValue('trailerNumber', value, { shouldValidate: true })}
              placeholder="Search trailer by number..."
              className="h-8 text-sm"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="driverPay">Driver Pay ($)</Label>
            <Input
              id="driverPay"
              type="number"
              step="0.01"
              placeholder="500.00"
              {...register('driverPay', { valueAsNumber: true })}
            />
          </div>
        )}
      </div>

      {isCreateMode ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <MileageField
            id="loadedMiles"
            label="Loaded Miles"
            value={loadedMiles}
            register={register}
          />
          <MileageField
            id="emptyMiles"
            label="Empty Miles"
            value={emptyMiles}
            register={register}
          />
          <div className="space-y-1.5">
            <Label htmlFor="totalMiles" className="text-xs">
              Total Miles
              {totalMiles !== undefined && totalMiles !== null && !isNaN(totalMiles) && (
                <span className="text-xs text-muted-foreground ml-1 font-normal">
                  ({Math.round(totalMiles)} mi)
                </span>
              )}
            </Label>
            <div className="flex gap-1.5">
              <Input
                id="totalMiles"
                type="number"
                step="0.1"
                value={totalMiles !== undefined && totalMiles !== null && !isNaN(totalMiles) ? totalMiles : ''}
                placeholder="Auto-calculated"
                className="h-8 text-sm"
                {...register('totalMiles', {
                  valueAsNumber: true,
                  setValueAs: (v: any) => {
                    if (v === '' || v === null || v === undefined) return undefined;
                    const num = parseFloat(v);
                    return isNaN(num) ? undefined : num;
                  },
                })}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={calculateMileage}
                disabled={isCalculatingMiles}
                title="Calculate mileage"
                className="h-8 px-2"
              >
                {isCalculatingMiles ? (
                  <Sparkles className="h-3 w-3 animate-spin" />
                ) : (
                  <MapPin className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fuelAdvance">Fuel Advance ($)</Label>
              <Input
                id="fuelAdvance"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('fuelAdvance', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalMiles">Total Miles</Label>
              <Input
                id="totalMiles"
                type="number"
                step="0.1"
                placeholder="1200.5"
                {...register('totalMiles', { valueAsNumber: true })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="loadedMiles">Loaded Miles</Label>
              <Input
                id="loadedMiles"
                type="number"
                step="0.1"
                placeholder="1000.0"
                {...register('loadedMiles', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trailerNumber">Trailer Number</Label>
              <Input
                id="trailerNumber"
                placeholder="TRL-001"
                {...register('trailerNumber')}
              />
            </div>
          </div>
        </>
      )}

      <div className={isCreateMode ? 'flex items-center space-x-2 pt-1' : 'flex items-center space-x-2'}>
        <input
          type="checkbox"
          id="hazmat"
          {...register('hazmat')}
          className={isCreateMode ? 'rounded border-gray-300' : 'h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded'}
        />
        <Label htmlFor="hazmat" className={isCreateMode ? 'cursor-pointer text-xs' : 'cursor-pointer'}>
          Hazmat Load
        </Label>
      </div>

      {!isCreateMode && (
        <div className="space-y-2">
          <Label htmlFor="dispatchNotes">Dispatch Notes</Label>
          <textarea
            id="dispatchNotes"
            rows={3}
            placeholder="Any special instructions for dispatch..."
            {...register('dispatchNotes')}
            className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      )}
    </>
  );
}

/** Reusable mileage input field (loaded/empty) */
function MileageField({
  id,
  label,
  value,
  register,
}: {
  id: string;
  label: string;
  value: number | undefined;
  register: any;
}) {
  const hasValue = value !== undefined && value !== null && !isNaN(value);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">
        {label}
        {hasValue && (
          <span className="text-xs text-muted-foreground ml-1 font-normal">
            ({Math.round(value!)} mi)
          </span>
        )}
      </Label>
      <Input
        id={id}
        type="number"
        step="0.1"
        value={hasValue ? value : ''}
        placeholder="Auto-calculated"
        className="h-8 text-sm"
        {...register(id, {
          valueAsNumber: true,
          setValueAs: (v: any) => {
            if (v === '' || v === null || v === undefined) return undefined;
            const num = parseFloat(v);
            return isNaN(num) ? undefined : num;
          },
        })}
      />
    </div>
  );
}

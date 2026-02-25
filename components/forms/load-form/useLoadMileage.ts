'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';

interface UseLoadMileageOptions {
  setValue: (name: any, value: any, options?: any) => void;
  watch: (name?: any) => any;
  isCreateMode: boolean;
  setError: (error: string | null) => void;
}

/**
 * Handles mileage calculation for loads — both manual and auto-calculation.
 * Calculates distance between pickup/delivery or multi-stop waypoints.
 */
export function useLoadMileage({ setValue, watch, isCreateMode, setError }: UseLoadMileageOptions) {
  const [isCalculatingMiles, setIsCalculatingMiles] = useState(false);

  const stops = watch('stops');
  const isMultiStop = stops && Array.isArray(stops) && stops.length > 0;
  const pickupCity = watch('pickupCity');
  const pickupState = watch('pickupState');
  const deliveryCity = watch('deliveryCity');
  const deliveryState = watch('deliveryState');
  const loadedMiles = watch('loadedMiles');
  const emptyMiles = watch('emptyMiles');
  const totalMiles = watch('totalMiles');

  const calculateDistance = async (
    origin: { city: string; state: string },
    destination: { city: string; state: string }
  ): Promise<number> => {
    const response = await fetch(apiUrl('/api/routes/distance'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origins: [origin],
        destinations: [destination],
        mode: 'driving',
        units: 'imperial',
      }),
    });

    if (!response.ok) throw new Error('Failed to calculate distance');

    const result = await response.json();
    if (!result.success || !result.data || result.data.length === 0) {
      throw new Error('Invalid distance calculation result');
    }

    const distanceInMiles = result.data[0][0]?.distance?.miles;
    if (!distanceInMiles && distanceInMiles !== 0) {
      throw new Error('Distance calculation returned invalid data');
    }

    return distanceInMiles;
  };

  const calculateMileage = async () => {
    if (!isCreateMode) return;

    try {
      setIsCalculatingMiles(true);
      setError(null);

      if (isMultiStop && stops && stops.length > 0) {
        const sortedStops = [...stops].sort((a: any, b: any) => a.sequence - b.sequence);
        const invalidStops = sortedStops.filter((stop: any) => !stop.city || !stop.state);

        if (invalidStops.length > 0) {
          throw new Error('All stops must have city and state for mileage calculation');
        }

        let loaded = 0;
        let empty = 0;

        for (let i = 0; i < sortedStops.length - 1; i++) {
          const currentStop = sortedStops[i];
          const nextStop = sortedStops[i + 1];
          const distance = await calculateDistance(
            { city: currentStop.city, state: currentStop.state },
            { city: nextStop.city, state: nextStop.state }
          );

          if (currentStop.stopType === 'DELIVERY' && nextStop.stopType === 'PICKUP') {
            empty += distance;
          } else {
            loaded += distance;
          }
        }

        const total = loaded + empty;
        setValue('loadedMiles', Math.round(loaded * 10) / 10, { shouldValidate: false });
        setValue('emptyMiles', Math.round(empty * 10) / 10, { shouldValidate: false });
        setValue('totalMiles', Math.round(total * 10) / 10, { shouldValidate: false });
        toast.success(
          `Calculated: ${Math.round(loaded)} loaded mi, ${Math.round(empty)} deadhead mi, ${Math.round(total)} total mi`
        );
      } else {
        if (!pickupCity || !pickupState || !deliveryCity || !deliveryState) {
          throw new Error('Pickup and delivery city/state are required for mileage calculation');
        }

        const distance = await calculateDistance(
          { city: pickupCity, state: pickupState },
          { city: deliveryCity, state: deliveryState }
        );

        const total = Math.round(distance * 10) / 10;
        setValue('loadedMiles', total, { shouldValidate: false });
        setValue('emptyMiles', 0, { shouldValidate: false });
        setValue('totalMiles', total, { shouldValidate: false });
        toast.success(`Calculated: ${total} miles`);
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to calculate mileage';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsCalculatingMiles(false);
    }
  };

  // Auto-calculate mileage when stops or location fields are populated (create mode only)
  useEffect(() => {
    if (!isCreateMode || isCalculatingMiles) return;

    const hasMiles =
      (loadedMiles !== undefined && loadedMiles !== null && !isNaN(loadedMiles)) ||
      (emptyMiles !== undefined && emptyMiles !== null && !isNaN(emptyMiles)) ||
      (totalMiles !== undefined && totalMiles !== null && !isNaN(totalMiles));

    if (hasMiles) return;

    if (stops && stops.length > 1) {
      const allValid = stops.every((s: any) => s.city && s.state);
      if (allValid) {
        const timer = setTimeout(() => {
          calculateMileage().catch((err) => console.error('Auto-calculation failed:', err));
        }, 1500);
        return () => clearTimeout(timer);
      }
    } else if (pickupCity && pickupState && deliveryCity && deliveryState && (!stops || stops.length === 0)) {
      const timer = setTimeout(() => {
        calculateMileage().catch((err) => console.error('Auto-calculation failed:', err));
      }, 1500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops, pickupCity, pickupState, deliveryCity, deliveryState, loadedMiles, emptyMiles, totalMiles, isCalculatingMiles, isCreateMode]);

  return {
    calculateMileage,
    isCalculatingMiles,
    loadedMiles,
    emptyMiles,
    totalMiles,
    isMultiStop,
  };
}

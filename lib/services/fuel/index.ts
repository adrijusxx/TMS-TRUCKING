/**
 * Fuel Services — Barrel Exports + Provider Factory
 */

export { GooglePlacesFuelProvider } from './GooglePlacesFuelProvider';
export { TollCalculationService } from './TollCalculationService';
export type {
  FuelStation,
  FuelStationProvider,
  FuelStationSearchParams,
  FuelSuggestion,
  TollEstimate,
  RouteFuelPlan,
} from './FuelStationProvider';

import type { FuelStationProvider } from './FuelStationProvider';
import { GooglePlacesFuelProvider } from './GooglePlacesFuelProvider';

/**
 * Factory to create the active fuel station provider.
 * Extensible for Pilot/Flying J and composite providers.
 */
export function createFuelStationProvider(
  providerName?: string
): FuelStationProvider {
  switch (providerName) {
    case 'GOOGLE_PLACES':
    default:
      return new GooglePlacesFuelProvider();
  }
}

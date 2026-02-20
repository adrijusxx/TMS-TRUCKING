/**
 * Fuel Station Provider Interface & Types
 *
 * Abstract interface for fuel station data sources.
 * Supports Google Places API (New) now, with Pilot/Flying J pluggable later.
 */

export interface FuelStation {
  id: string;
  name: string;
  brand?: string;
  address: string;
  lat: number;
  lng: number;
  dieselPrice?: number;
  defPrice?: number;
  priceUpdatedAt?: string;
  distanceFromRoute?: number;
  milesAlongRoute?: number;
  rating?: number;
  isOpen?: boolean;
  amenities?: string[];
  providerSource: 'GOOGLE_PLACES' | 'PILOT_FLYINGJ' | 'MANUAL';
}

export interface FuelStationSearchParams {
  lat: number;
  lng: number;
  radiusMiles: number;
  fuelType?: 'DIESEL' | 'REGULAR_UNLEADED' | 'MIDGRADE' | 'PREMIUM' | 'DEF';
}

export interface FuelSuggestion {
  station: FuelStation;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  reason: string;
  estimatedSavings?: number;
  estimatedFuelNeeded?: number;
}

export interface TollEstimate {
  totalTollCost: number;
  currency: string;
  tollSegments: Array<{
    name?: string;
    estimatedPrice: number;
  }>;
  routeDistanceMeters: number;
  routeDurationSeconds: number;
}

export interface RouteFuelPlan {
  loadId: string;
  stations: FuelStation[];
  suggestions: FuelSuggestion[];
  averageDieselPrice: number;
  cheapestDieselPrice: number;
  estimatedTotalFuelCost: number;
  tollEstimate: TollEstimate | null;
}

export interface FuelStationProvider {
  name: string;
  searchNearby(params: FuelStationSearchParams): Promise<FuelStation[]>;
}

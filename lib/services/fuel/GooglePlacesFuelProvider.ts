/**
 * Google Places API (New) Fuel Station Provider
 *
 * Searches for gas stations using the Places API (New) and extracts
 * diesel fuel prices from the fuelOptions field.
 *
 * API: POST https://places.googleapis.com/v1/places:searchNearby
 * Docs: https://developers.google.com/maps/documentation/places/web-service/nearby-search
 */

import {
  GeocodingCacheManager,
  ApiCacheType,
} from '@/lib/managers/GeocodingCacheManager';
import type {
  FuelStation,
  FuelStationProvider,
  FuelStationSearchParams,
} from './FuelStationProvider';

const MILES_TO_METERS = 1609.344;
const FUEL_CACHE_TTL_DAYS = 0.167; // ~4 hours

interface GooglePlacesFuelPrice {
  type: string;
  price: { units: string; nanos: number; currencyCode: string };
  updateTime: string;
}

interface GooglePlacesResult {
  id: string;
  displayName?: { text: string; languageCode?: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  fuelOptions?: { fuelPrices?: GooglePlacesFuelPrice[] };
  rating?: number;
  currentOpeningHours?: { openNow?: boolean };
}

export class GooglePlacesFuelProvider implements FuelStationProvider {
  name = 'GOOGLE_PLACES';

  async searchNearby(params: FuelStationSearchParams): Promise<FuelStation[]> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('Google Maps API key not configured, fuel station search unavailable');
      return [];
    }

    const radiusMeters = Math.round(params.radiusMiles * MILES_TO_METERS);
    const cacheKey = GeocodingCacheManager.normalizeFuelKey(
      params.lat,
      params.lng,
      radiusMeters
    );

    const cached = await GeocodingCacheManager.get<FuelStation[]>(
      cacheKey,
      ApiCacheType.GEOCODE
    );
    if (cached) return cached;

    try {
      const response = await fetch(
        'https://places.googleapis.com/v1/places:searchNearby',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': [
              'places.id',
              'places.displayName',
              'places.formattedAddress',
              'places.location',
              'places.fuelOptions',
              'places.rating',
              'places.currentOpeningHours',
            ].join(','),
          },
          body: JSON.stringify({
            includedTypes: ['gas_station'],
            maxResultCount: 20,
            locationRestriction: {
              circle: {
                center: { latitude: params.lat, longitude: params.lng },
                radius: Math.min(radiusMeters, 50000), // Max 50km
              },
            },
          }),
        }
      );

      if (!response.ok) {
        console.error('Google Places API error:', response.status, await response.text());
        return [];
      }

      const data = await response.json();
      const places: GooglePlacesResult[] = data.places || [];

      const stations = places
        .map((place) => this.mapToFuelStation(place, params.fuelType))
        .filter((s): s is FuelStation => s !== null);

      await GeocodingCacheManager.set(cacheKey, ApiCacheType.GEOCODE, stations, {
        ttlDays: FUEL_CACHE_TTL_DAYS,
      });

      return stations;
    } catch (error) {
      console.error('Fuel station search error:', error);
      return [];
    }
  }

  private mapToFuelStation(
    place: GooglePlacesResult,
    fuelType?: string
  ): FuelStation | null {
    if (!place.location) return null;

    const targetType = fuelType || 'DIESEL';
    const dieselPrice = this.extractFuelPrice(place.fuelOptions, targetType);
    const defPrice = this.extractFuelPrice(place.fuelOptions, 'DEF');

    const priceEntry = place.fuelOptions?.fuelPrices?.find(
      (fp) => fp.type === targetType
    );

    return {
      id: place.id,
      name: place.displayName?.text || 'Unknown Station',
      brand: this.detectBrand(place.displayName?.text || ''),
      address: place.formattedAddress || '',
      lat: place.location.latitude,
      lng: place.location.longitude,
      dieselPrice: dieselPrice ?? undefined,
      defPrice: defPrice ?? undefined,
      priceUpdatedAt: priceEntry?.updateTime,
      rating: place.rating,
      isOpen: place.currentOpeningHours?.openNow,
      providerSource: 'GOOGLE_PLACES',
    };
  }

  private extractFuelPrice(
    fuelOptions: GooglePlacesResult['fuelOptions'],
    type: string
  ): number | null {
    if (!fuelOptions?.fuelPrices) return null;
    const entry = fuelOptions.fuelPrices.find((fp) => fp.type === type);
    if (!entry?.price) return null;
    return parseFloat(entry.price.units) + entry.price.nanos / 1_000_000_000;
  }

  private detectBrand(name: string): string | undefined {
    const normalized = name.toUpperCase();
    const brands: Array<[string, string[]]> = [
      ['PILOT', ['PILOT', 'FLYING J']],
      ['LOVES', ["LOVE'S", 'LOVES']],
      ['TA', ['TA ', 'TRAVELAMERICA', 'TRAVEL AMERICA']],
      ['PETRO', ['PETRO']],
      ['SHELL', ['SHELL']],
      ['BP', [' BP ', 'BP ']],
      ['CHEVRON', ['CHEVRON']],
      ['MARATHON', ['MARATHON']],
      ['SPEEDWAY', ['SPEEDWAY']],
      ['CASEY', ["CASEY'S", 'CASEYS']],
      ['SHEETZ', ['SHEETZ']],
      ['WAWA', ['WAWA']],
      ['BUCKY', ["BUCKY'S", 'BUCKYS', "BUCKY'S", 'BUCKEES']],
    ];
    for (const [brand, patterns] of brands) {
      if (patterns.some((p) => normalized.includes(p))) return brand;
    }
    return undefined;
  }
}

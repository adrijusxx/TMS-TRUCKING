/**
 * Routing Service
 * 
 * Advanced routing with state-crossing detection for IFTA calculations.
 * Uses Google Directions API for accurate route planning.
 * 
 * @see docs/specs/OPERATIONAL_OVERHAUL.MD Section 4
 */

import { calculateRoute, geocodeAddress } from '@/lib/maps/google-maps';

// US State boundaries (approximate center lat/lng and abbreviations)
// Used for reverse geocoding to determine state from coordinates
const US_STATE_DATA: Record<string, { name: string; abbr: string }> = {
  AL: { name: 'Alabama', abbr: 'AL' },
  AK: { name: 'Alaska', abbr: 'AK' },
  AZ: { name: 'Arizona', abbr: 'AZ' },
  AR: { name: 'Arkansas', abbr: 'AR' },
  CA: { name: 'California', abbr: 'CA' },
  CO: { name: 'Colorado', abbr: 'CO' },
  CT: { name: 'Connecticut', abbr: 'CT' },
  DE: { name: 'Delaware', abbr: 'DE' },
  FL: { name: 'Florida', abbr: 'FL' },
  GA: { name: 'Georgia', abbr: 'GA' },
  HI: { name: 'Hawaii', abbr: 'HI' },
  ID: { name: 'Idaho', abbr: 'ID' },
  IL: { name: 'Illinois', abbr: 'IL' },
  IN: { name: 'Indiana', abbr: 'IN' },
  IA: { name: 'Iowa', abbr: 'IA' },
  KS: { name: 'Kansas', abbr: 'KS' },
  KY: { name: 'Kentucky', abbr: 'KY' },
  LA: { name: 'Louisiana', abbr: 'LA' },
  ME: { name: 'Maine', abbr: 'ME' },
  MD: { name: 'Maryland', abbr: 'MD' },
  MA: { name: 'Massachusetts', abbr: 'MA' },
  MI: { name: 'Michigan', abbr: 'MI' },
  MN: { name: 'Minnesota', abbr: 'MN' },
  MS: { name: 'Mississippi', abbr: 'MS' },
  MO: { name: 'Missouri', abbr: 'MO' },
  MT: { name: 'Montana', abbr: 'MT' },
  NE: { name: 'Nebraska', abbr: 'NE' },
  NV: { name: 'Nevada', abbr: 'NV' },
  NH: { name: 'New Hampshire', abbr: 'NH' },
  NJ: { name: 'New Jersey', abbr: 'NJ' },
  NM: { name: 'New Mexico', abbr: 'NM' },
  NY: { name: 'New York', abbr: 'NY' },
  NC: { name: 'North Carolina', abbr: 'NC' },
  ND: { name: 'North Dakota', abbr: 'ND' },
  OH: { name: 'Ohio', abbr: 'OH' },
  OK: { name: 'Oklahoma', abbr: 'OK' },
  OR: { name: 'Oregon', abbr: 'OR' },
  PA: { name: 'Pennsylvania', abbr: 'PA' },
  RI: { name: 'Rhode Island', abbr: 'RI' },
  SC: { name: 'South Carolina', abbr: 'SC' },
  SD: { name: 'South Dakota', abbr: 'SD' },
  TN: { name: 'Tennessee', abbr: 'TN' },
  TX: { name: 'Texas', abbr: 'TX' },
  UT: { name: 'Utah', abbr: 'UT' },
  VT: { name: 'Vermont', abbr: 'VT' },
  VA: { name: 'Virginia', abbr: 'VA' },
  WA: { name: 'Washington', abbr: 'WA' },
  WV: { name: 'West Virginia', abbr: 'WV' },
  WI: { name: 'Wisconsin', abbr: 'WI' },
  WY: { name: 'Wyoming', abbr: 'WY' },
  DC: { name: 'District of Columbia', abbr: 'DC' },
};

export interface RouteWaypoint {
  address?: string;
  city: string;
  state: string;
  zipCode?: string;
  lat?: number;
  lng?: number;
}

export interface StateMileage {
  state: string;
  stateName: string;
  miles: number;
  kilometers: number;
}

export interface RouteResult {
  totalMiles: number;
  totalKilometers: number;
  durationMinutes: number;
  durationFormatted: string;
  stateMileages: StateMileage[];
  polyline: string | null;
  statesCrossed: string[];
  waypoints: RouteWaypoint[];
}

export class RoutingService {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
  }

  /**
   * Calculate route with state-by-state mileage breakdown
   */
  async calculateRouteWithStateMileage(
    waypoints: RouteWaypoint[]
  ): Promise<RouteResult> {
    if (waypoints.length < 2) {
      throw new Error('At least 2 waypoints required');
    }

    // Format waypoints for Google Maps
    const formattedWaypoints = waypoints.map((wp) => {
      if (wp.lat && wp.lng) {
        return { lat: wp.lat, lng: wp.lng };
      }
      const address = wp.address
        ? `${wp.address}, ${wp.city}, ${wp.state}`
        : `${wp.city}, ${wp.state}`;
      return { city: wp.city, state: wp.state, address: wp.address };
    });

    // Get route from Google Maps
    const route = await calculateRoute(formattedWaypoints);

    if (!route) {
      // Fallback to estimation
      return this.estimateRoute(waypoints);
    }

    // Parse state mileages from route steps
    const stateMileages = await this.parseStateMileagesFromRoute(route);

    const totalMiles = route.distance / 1609.34; // meters to miles
    const durationMinutes = route.duration / 60;

    return {
      totalMiles: Math.round(totalMiles * 10) / 10,
      totalKilometers: Math.round(route.distance / 100) / 10,
      durationMinutes: Math.round(durationMinutes),
      durationFormatted: this.formatDuration(durationMinutes),
      stateMileages,
      polyline: route.polyline || null,
      statesCrossed: stateMileages.map((sm) => sm.state),
      waypoints,
    };
  }

  /**
   * Parse state mileages from route steps
   */
  private async parseStateMileagesFromRoute(route: {
    steps: unknown[];
    distance: number;
  }): Promise<StateMileage[]> {
    const stateMileages: Record<string, number> = {};
    const steps = route.steps as Array<{
      html_instructions?: string;
      distance?: { value: number };
      start_location?: { lat: number; lng: number };
      end_location?: { lat: number; lng: number };
    }>;

    for (const step of steps) {
      if (!step.distance?.value) continue;

      const distanceMeters = step.distance.value;
      const distanceMiles = distanceMeters / 1609.34;

      // Try to extract state from step instructions
      let state = this.extractStateFromInstructions(step.html_instructions || '');

      // If no state found in instructions, try geocoding the step location
      if (!state && step.end_location) {
        state = await this.getStateFromCoordinates(
          step.end_location.lat,
          step.end_location.lng
        );
      }

      if (state) {
        stateMileages[state] = (stateMileages[state] || 0) + distanceMiles;
      }
    }

    // If no states found, fall back to waypoint states
    if (Object.keys(stateMileages).length === 0) {
      return [];
    }

    return Object.entries(stateMileages).map(([state, miles]) => ({
      state,
      stateName: US_STATE_DATA[state]?.name || state,
      miles: Math.round(miles * 10) / 10,
      kilometers: Math.round(miles * 1.60934 * 10) / 10,
    }));
  }

  /**
   * Extract state from Google Maps step instructions
   */
  private extractStateFromInstructions(instructions: string): string | null {
    // Remove HTML tags
    const text = instructions.replace(/<[^>]*>/g, '');

    // Look for state abbreviations in common patterns
    // e.g., "I-95 N entering Maryland", "Continue to GA", "Exit to Texas"
    for (const [abbr, data] of Object.entries(US_STATE_DATA)) {
      const patterns = [
        new RegExp(`\\b${abbr}\\b`, 'i'),
        new RegExp(`\\b${data.name}\\b`, 'i'),
        new RegExp(`entering ${data.name}`, 'i'),
        new RegExp(`entering ${abbr}`, 'i'),
      ];

      for (const pattern of patterns) {
        if (pattern.test(text)) {
          return abbr;
        }
      }
    }

    return null;
  }

  /**
   * Get state from coordinates using reverse geocoding
   */
  private async getStateFromCoordinates(
    lat: number,
    lng: number
  ): Promise<string | null> {
    if (!this.apiKey) return null;

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${this.apiKey}&result_type=administrative_area_level_1`
      );

      if (!response.ok) return null;

      const data = await response.json();
      if (data.status !== 'OK' || !data.results?.[0]) return null;

      // Extract state from address components
      for (const component of data.results[0].address_components) {
        if (component.types?.includes('administrative_area_level_1')) {
          return component.short_name;
        }
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }

    return null;
  }

  /**
   * Estimate route when API is unavailable
   */
  private estimateRoute(waypoints: RouteWaypoint[]): RouteResult {
    const stateMileages: Record<string, number> = {};
    let totalMiles = 0;

    // Simple estimation: 300 miles between different states, 150 within same state
    for (let i = 0; i < waypoints.length - 1; i++) {
      const from = waypoints[i];
      const to = waypoints[i + 1];

      if (from.state === to.state) {
        const miles = 150;
        stateMileages[from.state] = (stateMileages[from.state] || 0) + miles;
        totalMiles += miles;
      } else {
        const miles = 300;
        // Split between states
        stateMileages[from.state] = (stateMileages[from.state] || 0) + miles / 2;
        stateMileages[to.state] = (stateMileages[to.state] || 0) + miles / 2;
        totalMiles += miles;
      }
    }

    const stateMileagesArray = Object.entries(stateMileages).map(([state, miles]) => ({
      state,
      stateName: US_STATE_DATA[state]?.name || state,
      miles: Math.round(miles * 10) / 10,
      kilometers: Math.round(miles * 1.60934 * 10) / 10,
    }));

    return {
      totalMiles: Math.round(totalMiles * 10) / 10,
      totalKilometers: Math.round(totalMiles * 1.60934 * 10) / 10,
      durationMinutes: Math.round((totalMiles / 50) * 60), // Assume 50 mph average
      durationFormatted: this.formatDuration((totalMiles / 50) * 60),
      stateMileages: stateMileagesArray,
      polyline: null,
      statesCrossed: Object.keys(stateMileages),
      waypoints,
    };
  }

  /**
   * Format duration in human-readable format
   */
  private formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);

    if (hours === 0) {
      return `${mins} min`;
    }
    if (mins === 0) {
      return `${hours} hr`;
    }
    return `${hours} hr ${mins} min`;
  }

  /**
   * Calculate deadhead miles (empty miles to pickup)
   */
  async calculateDeadheadMiles(
    currentLocation: RouteWaypoint,
    pickupLocation: RouteWaypoint
  ): Promise<{ miles: number; durationMinutes: number }> {
    const result = await this.calculateRouteWithStateMileage([
      currentLocation,
      pickupLocation,
    ]);

    return {
      miles: result.totalMiles,
      durationMinutes: result.durationMinutes,
    };
  }

  /**
   * Geocode an address to get coordinates
   */
  async geocode(
    address: string
  ): Promise<{ lat: number; lng: number; formattedAddress: string } | null> {
    return geocodeAddress(address);
  }
}

// Singleton export
export const routingService = new RoutingService();






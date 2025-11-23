/**
 * ETA Calculator for estimating arrival times
 */

import { geocodeAddress } from './google-maps';

export interface ETAResult {
  eta: Date;
  distanceMiles: number;
  durationMinutes: number;
  confidence: 'high' | 'medium' | 'low';
}

export class ETACalculator {
  private directionsService: any = null;

  constructor() {
    if (typeof window !== 'undefined' && (window as any).google?.maps) {
      this.directionsService = new (window as any).google.maps.DirectionsService();
    }
  }

  /**
   * Calculate ETA from current location to destination
   */
  async calculateETA(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number; address?: string },
    currentSpeed?: number
  ): Promise<ETAResult | null> {
    if (!this.directionsService) {
      return null;
    }

    try {
      const result = await new Promise<any>((resolve, reject) => {
        this.directionsService!.route(
          {
            origin: new (window as any).google.maps.LatLng(origin.lat, origin.lng),
            destination: new (window as any).google.maps.LatLng(destination.lat, destination.lng),
            travelMode: (window as any).google.maps.TravelMode.DRIVING,
          },
          (result: any, status: any) => {
            if (status === (window as any).google.maps.DirectionsStatus.OK && result) {
              resolve(result);
            } else {
              reject(new Error(`Directions request failed: ${status}`));
            }
          }
        );
      });

      const route = result.routes[0];
      if (!route || !route.legs || route.legs.length === 0) {
        return null;
      }

      const leg = route.legs[0];
      const distanceMiles = leg.distance?.value ? leg.distance.value / 1609.34 : 0;
      const durationSeconds = leg.duration?.value || 0;
      const durationMinutes = durationSeconds / 60;

      // Adjust ETA based on current speed if provided
      let adjustedDurationMinutes = durationMinutes;
      if (currentSpeed && currentSpeed > 0) {
        // Use current speed to refine estimate
        const speedBasedDuration = (distanceMiles / currentSpeed) * 60;
        adjustedDurationMinutes = (durationMinutes + speedBasedDuration) / 2;
      }

      const eta = new Date(Date.now() + adjustedDurationMinutes * 60 * 1000);

      // Determine confidence based on data quality
      let confidence: 'high' | 'medium' | 'low' = 'medium';
      if (currentSpeed && currentSpeed > 0 && leg.duration) {
        confidence = 'high';
      } else if (leg.duration) {
        confidence = 'medium';
      } else {
        confidence = 'low';
      }

      return {
        eta,
        distanceMiles,
        durationMinutes: adjustedDurationMinutes,
        confidence,
      };
    } catch (error) {
      console.error('Error calculating ETA:', error);
      return null;
    }
  }

  /**
   * Calculate ETA from address strings
   */
  async calculateETAFromAddresses(
    originAddress: string,
    destinationAddress: string,
    currentSpeed?: number
  ): Promise<ETAResult | null> {
    if (!this.directionsService) {
      return null;
    }

    try {
      const result = await new Promise<any>((resolve, reject) => {
        this.directionsService!.route(
          {
            origin: originAddress,
            destination: destinationAddress,
            travelMode: (window as any).google.maps.TravelMode.DRIVING,
          },
          (result: any, status: any) => {
            if (status === (window as any).google.maps.DirectionsStatus.OK && result) {
              resolve(result);
            } else {
              reject(new Error(`Directions request failed: ${status}`));
            }
          }
        );
      });

      const route = result.routes[0];
      if (!route || !route.legs || route.legs.length === 0) {
        return null;
      }

      const leg = route.legs[0];
      const distanceMiles = leg.distance?.value ? leg.distance.value / 1609.34 : 0;
      const durationSeconds = leg.duration?.value || 0;
      const durationMinutes = durationSeconds / 60;

      let adjustedDurationMinutes = durationMinutes;
      if (currentSpeed && currentSpeed > 0) {
        const speedBasedDuration = (distanceMiles / currentSpeed) * 60;
        adjustedDurationMinutes = (durationMinutes + speedBasedDuration) / 2;
      }

      const eta = new Date(Date.now() + adjustedDurationMinutes * 60 * 1000);

      let confidence: 'high' | 'medium' | 'low' = 'medium';
      if (currentSpeed && currentSpeed > 0 && leg.duration) {
        confidence = 'high';
      } else if (leg.duration) {
        confidence = 'medium';
      } else {
        confidence = 'low';
      }

      return {
        eta,
        distanceMiles,
        durationMinutes: adjustedDurationMinutes,
        confidence,
      };
    } catch (error) {
      console.error('Error calculating ETA from addresses:', error);
      return null;
    }
  }
}


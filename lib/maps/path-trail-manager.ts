/**
 * Path Trail Manager for showing historical truck movement
 */

interface TrailPoint {
  lat: number;
  lng: number;
  timestamp: number;
  heading?: number;
}

export class PathTrailManager {
  private map: any;
  private trails: Map<string, TrailPoint[]> = new Map();
  private polylines: Map<string, any> = new Map();
  private maxPoints = 50; // Maximum points to store per truck
  private enabled = false;

  constructor(map: any) {
    this.map = map;
  }

  /**
   * Enable or disable trail rendering
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.clearAllTrails();
    }
  }

  /**
   * Add a point to a truck's trail
   */
  addPoint(truckId: string, point: TrailPoint): void {
    if (!this.enabled) return;

    const trail = this.trails.get(truckId) || [];
    trail.push(point);

    // Keep only the last N points
    if (trail.length > this.maxPoints) {
      trail.shift();
    }

    this.trails.set(truckId, trail);
    this.updateTrail(truckId);
  }

  /**
   * Update the visual trail for a truck
   */
  private updateTrail(truckId: string): void {
    const trail = this.trails.get(truckId);
    if (!trail || trail.length < 2) {
      this.removeTrail(truckId);
      return;
    }

    // Remove existing polyline
    const existing = this.polylines.get(truckId);
    if (existing) {
      existing.setMap(null);
    }

    // Create gradient polyline with fading opacity
    const path = trail.map((point) => ({ lat: point.lat, lng: point.lng }));

    // Create main polyline
    if (typeof window !== 'undefined' && (window as any).google?.maps?.Polyline) {
      const polyline = new (window as any).google.maps.Polyline({
        path,
        strokeColor: '#2563eb',
        strokeWeight: 3,
        strokeOpacity: 0.6,
        zIndex: 100,
        map: this.map,
      });

      this.polylines.set(truckId, polyline);
    }
  }

  /**
   * Remove trail for a specific truck
   */
  removeTrail(truckId: string): void {
    const polyline = this.polylines.get(truckId);
    if (polyline) {
      polyline.setMap(null);
      this.polylines.delete(truckId);
    }
    this.trails.delete(truckId);
  }

  /**
   * Clear all trails
   */
  clearAllTrails(): void {
    this.polylines.forEach((polyline) => {
      polyline.setMap(null);
    });
    this.polylines.clear();
    this.trails.clear();
  }

  /**
   * Get trail for a specific truck
   */
  getTrail(truckId: string): TrailPoint[] {
    return this.trails.get(truckId) || [];
  }

  /**
   * Check if trails are enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}


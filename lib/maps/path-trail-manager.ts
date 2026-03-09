/**
 * Path Trail Manager for showing historical truck movement
 * Renders speed-gradient colored trail segments
 */

interface TrailPoint {
  lat: number;
  lng: number;
  timestamp: number;
  heading?: number;
  speed?: number;
}

export class PathTrailManager {
  private map: any;
  private trails: Map<string, TrailPoint[]> = new Map();
  private segments: Map<string, any[]> = new Map();
  private maxPoints = 50;
  private enabled = false;

  constructor(map: any) {
    this.map = map;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.clearAllTrails();
  }

  addPoint(truckId: string, point: TrailPoint): void {
    if (!this.enabled) return;

    const trail = this.trails.get(truckId) || [];
    trail.push(point);

    if (trail.length > this.maxPoints) trail.shift();

    this.trails.set(truckId, trail);
    this.updateTrail(truckId);
  }

  private speedToColor(speed: number): string {
    if (speed > 55) return '#22c55e'; // green — highway
    if (speed > 25) return '#3b82f6'; // blue — moving
    if (speed > 5) return '#f59e0b';  // amber — slow
    return '#6b7280';                  // gray — stopped
  }

  private updateTrail(truckId: string): void {
    const trail = this.trails.get(truckId);
    if (!trail || trail.length < 2) {
      this.removeTrail(truckId);
      return;
    }

    // Remove existing segments
    const existing = this.segments.get(truckId);
    if (existing) existing.forEach(p => p.setMap(null));

    if (typeof window === 'undefined' || !(window as any).google?.maps?.Polyline) return;

    const newSegments: any[] = [];
    for (let i = 1; i < trail.length; i++) {
      const from = trail[i - 1];
      const to = trail[i];
      const ageRatio = i / trail.length; // 0=oldest, 1=newest
      const color = this.speedToColor(to.speed ?? 0);

      const polyline = new (window as any).google.maps.Polyline({
        path: [
          { lat: from.lat, lng: from.lng },
          { lat: to.lat, lng: to.lng },
        ],
        strokeColor: color,
        strokeWeight: 3,
        strokeOpacity: 0.3 + ageRatio * 0.5, // fade: 0.3 → 0.8
        zIndex: 100,
        map: this.map,
      });
      newSegments.push(polyline);
    }

    this.segments.set(truckId, newSegments);
  }

  removeTrail(truckId: string): void {
    const segs = this.segments.get(truckId);
    if (segs) {
      segs.forEach(p => p.setMap(null));
      this.segments.delete(truckId);
    }
    this.trails.delete(truckId);
  }

  clearAllTrails(): void {
    this.segments.forEach(segs => segs.forEach(p => p.setMap(null)));
    this.segments.clear();
    this.trails.clear();
  }

  getTrail(truckId: string): TrailPoint[] {
    return this.trails.get(truckId) || [];
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

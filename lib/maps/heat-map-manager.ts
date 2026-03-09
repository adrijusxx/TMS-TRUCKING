/**
 * Heat Map Manager for Google Maps visualization layer
 */

interface HeatMapPoint {
  lat: number;
  lng: number;
}

export class HeatMapManager {
  private layer: google.maps.visualization.HeatmapLayer | null = null;

  enable(map: google.maps.Map, assets: HeatMapPoint[]): void {
    const data = assets.map(a =>
      new google.maps.LatLng(a.lat, a.lng)
    );

    if (!this.layer) {
      this.layer = new google.maps.visualization.HeatmapLayer({
        data,
        map,
        radius: 40,
        opacity: 0.6,
      });
    } else {
      this.layer.setData(data);
      this.layer.setMap(map);
    }
  }

  disable(): void {
    this.layer?.setMap(null);
  }

  update(assets: HeatMapPoint[]): void {
    if (!this.layer) return;
    const data = assets.map(a =>
      new google.maps.LatLng(a.lat, a.lng)
    );
    this.layer.setData(data);
  }
}

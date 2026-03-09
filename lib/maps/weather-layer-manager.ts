/**
 * Weather Layer Manager using RainViewer API
 * Free precipitation radar tiles — no API key required
 * @see https://www.rainviewer.com/api/weather-maps-api.html
 */

const RAINVIEWER_API = 'https://api.rainviewer.com/public/weather-maps.json';

interface RainViewerResponse {
  host: string;
  radar: {
    past: Array<{ time: number; path: string }>;
    nowcast: Array<{ time: number; path: string }>;
  };
}

export class WeatherLayerManager {
  private layer: google.maps.ImageMapType | null = null;
  private map: google.maps.Map | null = null;

  async enable(map: google.maps.Map): Promise<void> {
    this.map = map;
    this.disable(); // Remove any existing layer

    try {
      const res = await fetch(RAINVIEWER_API);
      const data: RainViewerResponse = await res.json();
      const frames = [...data.radar.past, ...data.radar.nowcast];
      const latest = frames[frames.length - 1];
      if (!latest) return;

      const tileUrl = `${data.host}${latest.path}/256/{z}/{x}/{y}/2/1_1.png`;

      this.layer = new google.maps.ImageMapType({
        getTileUrl: (coord, zoom) =>
          tileUrl
            .replace('{z}', String(zoom))
            .replace('{x}', String(coord.x))
            .replace('{y}', String(coord.y)),
        tileSize: new google.maps.Size(256, 256),
        opacity: 0.5,
        name: 'Weather',
      });

      map.overlayMapTypes.push(this.layer);
    } catch (err) {
      console.error('[WeatherLayer] Failed to load RainViewer data:', err);
    }
  }

  disable(): void {
    if (!this.map || !this.layer) return;
    const overlays = this.map.overlayMapTypes;
    for (let i = 0; i < overlays.getLength(); i++) {
      if (overlays.getAt(i) === this.layer) {
        overlays.removeAt(i);
        break;
      }
    }
    this.layer = null;
  }
}

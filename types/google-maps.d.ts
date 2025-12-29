/// <reference types="@types/google.maps" />

declare namespace google {
  namespace maps {
    class Geocoder {
      geocode(
        request: GeocoderRequest,
        callback: (
          results: GeocoderResult[] | null,
          status: GeocoderStatus
        ) => void
      ): void;
    }

    class LatLngBounds {
      extend(latLng: LatLng | LatLngLiteral): void;
      getCenter(): LatLng;
    }

    class Marker {
      constructor(opts?: MarkerOptions);
      setMap(map: Map | null): void;
    }

    class Map {
      constructor(mapDiv: Element | null, opts?: MapOptions);
    }

    class Size {
      constructor(width: number, height: number);
    }

    class Point {
      constructor(x: number, y: number);
    }

    interface GeocoderRequest {
      address?: string;
      location?: LatLng | LatLngLiteral;
    }

    interface GeocoderResult {
      geometry: {
        location: LatLng;
      };
    }

    type GeocoderStatus = 'OK' | 'ZERO_RESULTS' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'INVALID_REQUEST' | 'UNKNOWN_ERROR';

    interface LatLng {
      lat(): number;
      lng(): number;
    }

    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    interface MarkerOptions {
      position?: LatLng | LatLngLiteral;
      map?: Map | null;
      label?: string | MarkerLabel;
      title?: string;
      icon?: string | Icon | Symbol;
    }

    interface MarkerLabel {
      text: string;
      color?: string;
      fontSize?: string;
      fontWeight?: string;
    }

    interface Icon {
      url?: string;
      scaledSize?: Size;
      anchor?: Point;
    }

    interface Symbol {
      path?: SymbolPath | string;
      scale?: number;
      fillColor?: string;
      fillOpacity?: number;
      strokeColor?: string;
      strokeWeight?: number;
    }

    enum SymbolPath {
      CIRCLE,
      BACKWARD_CLOSED_ARROW,
      BACKWARD_OPEN_ARROW,
      FORWARD_CLOSED_ARROW,
      FORWARD_OPEN_ARROW,
    }

    interface MapOptions {
      center?: LatLng | LatLngLiteral;
      zoom?: number;
    }
  }
}


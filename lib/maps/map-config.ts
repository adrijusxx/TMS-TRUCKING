/**
 * Centralized map configuration and styling
 */

interface MapColorScheme {
  healthy: string;
  faulty: string;
  assigned: string;
  unassigned: string;
  trailer: string;
  pickup: string;
  delivery: string;
  route: string;
}

export const MAP_COLORS: MapColorScheme = {
  healthy: '#16a34a', // Green
  faulty: '#dc2626', // Red - for when filter is active
  assigned: '#2563eb', // Blue
  unassigned: '#6b7280', // Gray - neutral
  trailer: '#8b5cf6', // Purple
  pickup: '#1d4ed8', // Blue
  delivery: '#f97316', // Orange
  route: '#0ea5e9', // Sky blue
};

interface MarkerSizeConfig {
  small: number;
  medium: number;
  large: number;
}

export const MARKER_SIZES: MarkerSizeConfig = {
  small: 28, // Increased for better text visibility
  medium: 36,
  large: 44,
};

interface MapConfig {
  defaultZoom: number;
  defaultCenter: { lat: number; lng: number };
  minZoom: number;
  maxZoom: number;
  refreshInterval: number;
}

export const DEFAULT_MAP_CONFIG: MapConfig = {
  defaultZoom: 5,
  defaultCenter: { lat: 39.8283, lng: -98.5795 },
  minZoom: 3,
  maxZoom: 18,
  refreshInterval: 30000, // 30 seconds
};

interface RouteStyle {
  strokeColor: string;
  strokeWeight: number;
  strokeOpacity: number;
  zIndex: number;
}

export const ROUTE_STYLES: RouteStyle = {
  strokeColor: MAP_COLORS.route,
  strokeWeight: 3,
  strokeOpacity: 0.7,
  zIndex: 1,
};

interface ClusterStyle {
  textColor: string;
  url: string;
  height: number;
  width: number;
  anchor: [number, number];
  textSize: number;
}

export const CLUSTER_STYLES: ClusterStyle[] = [
  {
    textColor: '#ffffff',
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="#2563eb" stroke="#ffffff" stroke-width="2"/>
        <text x="20" y="26" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="white">1</text>
      </svg>
    `),
    height: 40,
    width: 40,
    anchor: [20, 20],
    textSize: 12,
  },
  {
    textColor: '#ffffff',
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
      <svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
        <circle cx="25" cy="25" r="22" fill="#1d4ed8" stroke="#ffffff" stroke-width="2"/>
        <text x="25" y="30" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="white">2</text>
      </svg>
    `),
    height: 50,
    width: 50,
    anchor: [25, 25],
    textSize: 14,
  },
  {
    textColor: '#ffffff',
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
      <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
        <circle cx="30" cy="30" r="26" fill="#0ea5e9" stroke="#ffffff" stroke-width="2"/>
        <text x="30" y="36" text-anchor="middle" font-family="Arial" font-size="18" font-weight="bold" fill="white">3</text>
      </svg>
    `),
    height: 60,
    width: 60,
    anchor: [30, 30],
    textSize: 16,
  },
];




/**
 * Marker utility functions for creating and styling map markers
 */

import type { MapLocation } from './live-map-service';
import { MAP_COLORS, MARKER_SIZES } from './map-config';

export interface TruckStatus {
  hasActiveFaults: boolean;
  isAssigned: boolean;
  isHealthy: boolean;
}

export interface MarkerIconOptions {
  label: string;
  fill: string;
  size: number;
  labelColor?: string;
  heading?: number;
  showDirection?: boolean;
  pulse?: boolean;
}

const badgeIconCache = new Map<string, google.maps.Icon>();

/**
 * Format badge label to fit within marker
 */
export function formatBadgeLabel(
  value: string | number | undefined,
  fallback: string,
  maxChars = 4
): string {
  if (!value) return fallback;
  const text = String(value);
  if (text.length <= maxChars) return text;
  return text.slice(-maxChars);
}

/**
 * Build a truck marker icon with direction indicator
 */
export function buildTruckMarkerIcon({
  label,
  fill,
  size,
  labelColor = '#ffffff',
  heading = 0,
  showDirection = true,
  pulse = false,
}: MarkerIconOptions): google.maps.Icon {
  const cacheKey = `${fill}-${size}-${label}-${labelColor}-${heading}-${showDirection}-${pulse}`;
  if (badgeIconCache.has(cacheKey)) {
    return badgeIconCache.get(cacheKey)!;
  }

  const labelSize = label.length > 4 ? 8 : label.length > 2 ? 9 : 11;
  const iconSize = size;
  const centerX = iconSize / 2;
  const centerY = iconSize / 2;
  const radius = iconSize / 2 - 2;

  // Create SVG with truck icon and direction arrow
  let svg = `
    <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 ${iconSize} ${iconSize}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${pulse ? `
        <style>
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          .pulse-circle {
            animation: pulse 2s infinite;
          }
        </style>
        ` : ''}
      </defs>
      <circle cx="${centerX}" cy="${centerY}" r="${iconSize / 2}" fill="${fill}" ${pulse ? 'class="pulse-circle"' : ''} />
      <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="white" />
      <text x="50%" y="55%" text-anchor="middle" font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="${labelSize}" font-weight="600" fill="${labelColor}">${label}</text>
  `;

  // Add direction arrow if heading is available
  if (showDirection && heading !== undefined && heading !== null) {
    const arrowLength = radius * 0.6;
    const arrowX = centerX + Math.sin((heading * Math.PI) / 180) * arrowLength;
    const arrowY = centerY - Math.cos((heading * Math.PI) / 180) * arrowLength;

    svg += `
      <path d="M ${centerX} ${centerY} L ${arrowX} ${arrowY}" 
            stroke="${fill}" 
            stroke-width="2" 
            stroke-linecap="round" 
            fill="none" 
            opacity="0.8" />
      <circle cx="${arrowX}" cy="${arrowY}" r="3" fill="${fill}" />
    `;
  }

  svg += `</svg>`;

  const icon: google.maps.Icon = {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(iconSize, iconSize),
    anchor: new google.maps.Point(centerX, centerY),
  };

  badgeIconCache.set(cacheKey, icon);
  return icon;
}

/**
 * Build a simple badge icon (for pickups, deliveries, trailers)
 */
export function buildBadgeIcon({
  label,
  fill,
  size,
  labelColor = '#0f172a',
}: Omit<MarkerIconOptions, 'heading' | 'showDirection' | 'pulse'>): google.maps.Icon {
  const cacheKey = `${fill}-${size}-${label}-${labelColor}`;
  if (badgeIconCache.has(cacheKey)) {
    return badgeIconCache.get(cacheKey)!;
  }

  const labelSize = label.length > 4 ? 8 : label.length > 2 ? 9 : 11;
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${fill}" />
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="white" />
      <text x="50%" y="55%" text-anchor="middle" font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="${labelSize}" font-weight="600" fill="${labelColor}">${label}</text>
    </svg>
  `;

  const icon: google.maps.Icon = {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(size / 2, size / 2),
  };

  badgeIconCache.set(cacheKey, icon);
  return icon;
}

/**
 * Determine truck marker color based on status
 */
export function getTruckMarkerColor(status: TruckStatus): string {
  if (status.hasActiveFaults) {
    return MAP_COLORS.faulty;
  }
  if (status.isAssigned) {
    return MAP_COLORS.assigned;
  }
  if (status.isHealthy) {
    return MAP_COLORS.healthy;
  }
  return MAP_COLORS.unassigned;
}

/**
 * Determine marker size based on zoom level
 */
export function getMarkerSizeForZoom(zoom: number): number {
  if (zoom >= 12) {
    return MARKER_SIZES.large;
  }
  if (zoom >= 8) {
    return MARKER_SIZES.medium;
  }
  return MARKER_SIZES.small;
}

/**
 * Create truck status from diagnostics and assignment
 */
export function createTruckStatus(
  hasActiveFaults: boolean,
  isAssigned: boolean
): TruckStatus {
  return {
    hasActiveFaults,
    isAssigned,
    isHealthy: !hasActiveFaults && isAssigned,
  };
}


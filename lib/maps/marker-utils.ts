/**
 * Marker utility functions for creating and styling map markers
 */

import type { MapLocation } from './live-map-service';
import { MAP_COLORS, MARKER_SIZES } from './map-config';

interface TruckStatus {
  hasActiveFaults: boolean;
  isAssigned: boolean;
  isHealthy: boolean;
}

interface MarkerIconOptions {
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
 * Build a text-only truck marker (no icon, just bold text)
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
  const cacheKey = `text-${fill}-${size}-${label}-${labelColor}-${heading}-${showDirection}-${pulse}`;
  if (badgeIconCache.has(cacheKey)) {
    return badgeIconCache.get(cacheKey)!;
  }

  // Calculate text size based on label length
  const labelSize = label.length > 4 ? 14 : label.length > 2 ? 16 : 18;
  const padding = 8;
  const textWidth = label.length * (labelSize * 0.6); // Approximate text width
  const iconWidth = Math.max(size, textWidth + padding * 2);
  const iconHeight = size;
  const centerX = iconWidth / 2;
  const centerY = iconHeight / 2;

  // Create SVG with just text on colored background
  let svg = `
    <svg width="${iconWidth}" height="${iconHeight}" viewBox="0 0 ${iconWidth} ${iconHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${pulse ? `
        <style>
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          .pulse-bg {
            animation: pulse 2s infinite;
          }
        </style>
        ` : ''}
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="1" dy="1" stdDeviation="2" flood-color="#000000" flood-opacity="0.5"/>
        </filter>
      </defs>
      <!-- Background rectangle with rounded corners -->
      <rect x="0" y="0" width="${iconWidth}" height="${iconHeight}" 
            rx="4" ry="4" 
            fill="${fill}" 
            ${pulse ? 'class="pulse-bg"' : ''}
            filter="url(#shadow)"
            stroke="white" 
            stroke-width="2" />
      <!-- Truck number text -->
      <text x="50%" y="50%" 
            text-anchor="middle" 
            dominant-baseline="central"
            font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" 
            font-size="${labelSize}" 
            font-weight="700" 
            fill="${labelColor}">${label}</text>
  `;

  // Add corner direction indicator if heading is available
  if (showDirection && heading !== undefined && heading !== null) {
    const triangleSize = 5; // Small triangle size (4-6px)
    const cornerOffset = 2; // Distance from corner
    
    // Normalize heading to 0-360
    const normalizedHeading = ((heading % 360) + 360) % 360;
    
    // Determine corner position based on heading angle
    let cornerX: number, cornerY: number;
    let trianglePoints: string;
    
    if (normalizedHeading >= 0 && normalizedHeading < 90) {
      // Top-right corner (0-90°)
      cornerX = iconWidth - cornerOffset;
      cornerY = cornerOffset;
      trianglePoints = `${cornerX},${cornerY} ${cornerX - triangleSize},${cornerY} ${cornerX},${cornerY + triangleSize}`;
    } else if (normalizedHeading >= 90 && normalizedHeading < 180) {
      // Top-left corner (90-180°)
      cornerX = cornerOffset;
      cornerY = cornerOffset;
      trianglePoints = `${cornerX},${cornerY} ${cornerX + triangleSize},${cornerY} ${cornerX},${cornerY + triangleSize}`;
    } else if (normalizedHeading >= 180 && normalizedHeading < 270) {
      // Bottom-left corner (180-270°)
      cornerX = cornerOffset;
      cornerY = iconHeight - cornerOffset;
      trianglePoints = `${cornerX},${cornerY} ${cornerX + triangleSize},${cornerY} ${cornerX},${cornerY - triangleSize}`;
    } else {
      // Bottom-right corner (270-360°)
      cornerX = iconWidth - cornerOffset;
      cornerY = iconHeight - cornerOffset;
      trianglePoints = `${cornerX},${cornerY} ${cornerX - triangleSize},${cornerY} ${cornerX},${cornerY - triangleSize}`;
    }

    svg += `
      <polygon points="${trianglePoints}" 
               fill="#1a1a1a" 
               stroke="none" 
               opacity="0.9" />
    `;
  }

  svg += `</svg>`;

  const icon: google.maps.Icon = {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(iconWidth, iconHeight),
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
 * Default: All trucks green
 * When showFaultyOnly === true: Faulty trucks red, others hidden by filter
 */
export function getTruckMarkerColor(status: TruckStatus, showFaultyOnly?: boolean): string {
  // When filter is active, only show faulty trucks in red
  if (showFaultyOnly && status.hasActiveFaults) {
    return MAP_COLORS.faulty; // Red
  }
  // Default: All trucks green (ignore assignment status)
  return MAP_COLORS.healthy; // Green
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

/**
 * Build a Samsara-style truck marker (text-only, uses Samsara blue color)
 * Same as regular truck marker but with Samsara branding color
 */
export function buildSamsaraMarkerIcon({
  label,
  fill,
  size,
  labelColor = '#ffffff',
  heading = 0,
  showDirection = true,
  pulse = false,
}: MarkerIconOptions): google.maps.Icon {
  // Use Samsara blue (#00A0E3) if fill is the default healthy color
  const samsaraBlue = '#00A0E3';
  const finalFill = fill === '#16a34a' ? samsaraBlue : fill;
  
  // Reuse the text-only marker builder
  return buildTruckMarkerIcon({
    label,
    fill: finalFill,
    size,
    labelColor,
    heading,
    showDirection,
    pulse,
  });
}




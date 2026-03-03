/**
 * Navigation Button
 *
 * Deep-link button that opens Google Maps, Apple Maps, or Waze
 * with turn-by-turn directions to a destination.
 * Detects the platform (iOS / Android / desktop) to choose the right app.
 */

'use client';

import { useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Navigation } from 'lucide-react';

type Platform = 'ios' | 'android' | 'desktop';

interface NavigationButtonProps {
  /** Full address string — used when lat/lng are unavailable */
  destinationAddress?: string;
  /** Destination latitude */
  destinationLat?: number;
  /** Destination longitude */
  destinationLng?: number;
  /** Button label override */
  label?: string;
  /** Visual variant */
  variant?: 'default' | 'outline' | 'ghost';
  /** Size of the button */
  size?: 'default' | 'sm' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

/** Detect the user's platform from the user agent string. */
function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  return 'desktop';
}

/**
 * Build a navigation deep-link URL for the given platform.
 *
 * - iOS  -> Apple Maps (`maps://`)
 * - Android / desktop -> Google Maps (`https://www.google.com/maps/dir/`)
 */
export function getNavigationUrl(
  destination: { address?: string; lat?: number; lng?: number },
  platform: Platform,
): string {
  const hasCoords =
    destination.lat !== undefined && destination.lng !== undefined;

  if (platform === 'ios') {
    // Apple Maps deep link
    if (hasCoords) {
      return `maps://maps.apple.com/?daddr=${destination.lat},${destination.lng}&dirflg=d`;
    }
    const encoded = encodeURIComponent(destination.address || '');
    return `maps://maps.apple.com/?daddr=${encoded}&dirflg=d`;
  }

  // Google Maps works on Android and desktop browsers
  if (hasCoords) {
    return `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving`;
  }

  const encoded = encodeURIComponent(destination.address || '');
  return `https://www.google.com/maps/dir/?api=1&destination=${encoded}&travelmode=driving`;
}

export default function NavigationButton({
  destinationAddress,
  destinationLat,
  destinationLng,
  label,
  variant = 'default',
  size = 'lg',
  className,
}: NavigationButtonProps) {
  const platform = useMemo(() => detectPlatform(), []);

  const hasDestination =
    !!destinationAddress ||
    (destinationLat !== undefined && destinationLng !== undefined);

  const handleNavigate = useCallback(() => {
    const url = getNavigationUrl(
      {
        address: destinationAddress,
        lat: destinationLat,
        lng: destinationLng,
      },
      platform,
    );
    window.open(url, '_blank');
  }, [destinationAddress, destinationLat, destinationLng, platform]);

  if (!hasDestination) return null;

  const displayLabel =
    label ||
    (platform === 'ios' ? 'Open in Apple Maps' : 'Open in Google Maps');

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleNavigate}
    >
      <Navigation className="h-5 w-5 mr-2" />
      {displayLabel}
    </Button>
  );
}

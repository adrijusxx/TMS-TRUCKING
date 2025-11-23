import { NextRequest, NextResponse } from 'next/server';
import {
  GeocodingCacheManager,
  ApiCacheType,
} from '@/lib/managers/GeocodingCacheManager';

/**
 * GET /api/geocoding/reverse
 * Reverse geocode coordinates to address (server-side proxy to avoid CORS)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    if (!lat || !lon) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);

    if (isNaN(latNum) || isNaN(lonNum)) {
      return NextResponse.json(
        { error: 'Invalid latitude or longitude' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = GeocodingCacheManager.normalizeReverseGeocodeKey(
      latNum,
      lonNum
    );
    const cached = await GeocodingCacheManager.get<{ address: unknown }>(
      cacheKey,
      ApiCacheType.REVERSE_GEOCODE
    );

    if (cached) {
      return NextResponse.json(cached);
    }

    // Call Nominatim API server-side to avoid CORS
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'TMS-Trucking-App/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Reverse geocoding failed');
    }

    const data = await response.json();
    const result = { address: data.address || {} };

    // Cache successful response
    await GeocodingCacheManager.set(
      cacheKey,
      ApiCacheType.REVERSE_GEOCODE,
      result
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return NextResponse.json(
      { error: 'Failed to reverse geocode' },
      { status: 500 }
    );
  }
}


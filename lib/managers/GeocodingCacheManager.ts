import { prisma } from '@/lib/prisma';

export enum ApiCacheType {
  GEOCODE = 'GEOCODE',
  REVERSE_GEOCODE = 'REVERSE_GEOCODE',
  DISTANCE_MATRIX = 'DISTANCE_MATRIX',
  DIRECTIONS = 'DIRECTIONS',
}

interface CacheOptions {
  ttlDays: number;
}

const DEFAULT_TTL: Record<ApiCacheType, number> = {
  [ApiCacheType.GEOCODE]: 90, // 90 days
  [ApiCacheType.REVERSE_GEOCODE]: 90, // 90 days
  [ApiCacheType.DISTANCE_MATRIX]: 7, // 7 days
  [ApiCacheType.DIRECTIONS]: 7, // 7 days
};

export class GeocodingCacheManager {
  /**
   * Get cached API response if valid
   */
  static async get<T = unknown>(
    cacheKey: string,
    apiType: ApiCacheType
  ): Promise<T | null> {
    try {
      const cached = await prisma.apiCache.findUnique({
        where: { cacheKey },
      });

      if (!cached || cached.apiType !== apiType) {
        return null;
      }

      // Check if expired
      if (new Date() >= cached.expiresAt) {
        // Delete expired entry asynchronously
        prisma.apiCache.delete({ where: { id: cached.id } }).catch(() => {
          // Ignore errors in cleanup
        });
        return null;
      }

      return cached.response as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Store API response in cache
   */
  static async set(
    cacheKey: string,
    apiType: ApiCacheType,
    response: unknown,
    options?: CacheOptions
  ): Promise<void> {
    try {
      const ttlDays = options?.ttlDays ?? DEFAULT_TTL[apiType];
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + ttlDays);

      await prisma.apiCache.upsert({
        where: { cacheKey },
        update: {
          response: response as any,
          expiresAt,
          updatedAt: new Date(),
        },
        create: {
          cacheKey,
          apiType,
          response: response as any,
          expiresAt,
        },
      });
    } catch (error) {
      console.error('Cache set error:', error);
      // Don't throw - caching failures shouldn't break the app
    }
  }

  /**
   * Normalize address for geocoding cache key
   */
  static normalizeGeocodeKey(address: string): string {
    return address
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/[^\w\s,.-]/g, '') // Remove special chars except commas, dots, hyphens
      .replace(/\b(st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive|ln|lane|ct|court|pl|place|pkwy|parkway)\b/gi, (match) => {
        // Normalize common street suffixes
        const normalized: Record<string, string> = {
          st: 'st',
          street: 'st',
          ave: 'ave',
          avenue: 'ave',
          rd: 'rd',
          road: 'rd',
          blvd: 'blvd',
          boulevard: 'blvd',
          dr: 'dr',
          drive: 'dr',
          ln: 'ln',
          lane: 'ln',
          ct: 'ct',
          court: 'ct',
          pl: 'pl',
          place: 'pl',
          pkwy: 'pkwy',
          parkway: 'pkwy',
        };
        return normalized[match.toLowerCase()] || match.toLowerCase();
      })
      .replace(/,/g, ', ') // Normalize comma spacing
      .trim();
  }

  /**
   * Normalize coordinates for reverse geocoding cache key
   * Round to 4 decimal places (~11m precision)
   */
  static normalizeReverseGeocodeKey(lat: number, lng: number): string {
    const roundedLat = Math.round(lat * 10000) / 10000;
    const roundedLng = Math.round(lng * 10000) / 10000;
    return `reverse:${roundedLat},${roundedLng}`;
  }

  /**
   * Normalize distance matrix request for cache key
   */
  static normalizeDistanceKey(
    origins: Array<{ city: string; state: string } | { lat: number; lng: number }>,
    destinations: Array<{ city: string; state: string } | { lat: number; lng: number }>,
    params?: {
      mode?: string;
      units?: string;
      avoid?: string;
      departureTime?: Date;
      trafficModel?: string;
    }
  ): string {
    // Normalize origins
    const normalizedOrigins = origins
      .map((o) => {
        if ('city' in o) {
          return `${this.normalizeGeocodeKey(o.city)},${this.normalizeState(o.state)}`;
        }
        // Round coordinates to 4 decimal places for consistency
        return `${Math.round(o.lat * 10000) / 10000},${Math.round(o.lng * 10000) / 10000}`;
      })
      .sort()
      .join('|');

    // Normalize destinations
    const normalizedDestinations = destinations
      .map((d) => {
        if ('city' in d) {
          return `${this.normalizeGeocodeKey(d.city)},${this.normalizeState(d.state)}`;
        }
        return `${Math.round(d.lat * 10000) / 10000},${Math.round(d.lng * 10000) / 10000}`;
      })
      .sort()
      .join('|');

    // Normalize params
    const normalizedParams: string[] = [];
    if (params?.mode) normalizedParams.push(`mode:${params.mode}`);
    if (params?.units) normalizedParams.push(`units:${params.units}`);
    if (params?.avoid) normalizedParams.push(`avoid:${params.avoid}`);
    // For departureTime, round to nearest hour for caching (traffic changes hourly)
    if (params?.departureTime) {
      const hour = Math.floor(params.departureTime.getTime() / (1000 * 60 * 60));
      normalizedParams.push(`departure:${hour}`);
    }
    if (params?.trafficModel) normalizedParams.push(`traffic:${params.trafficModel}`);

    const paramsStr = normalizedParams.length > 0 ? `:${normalizedParams.join(',')}` : '';

    return `distance:${normalizedOrigins}:${normalizedDestinations}${paramsStr}`;
  }

  /**
   * Normalize route request for cache key
   */
  static normalizeRouteKey(
    waypoints: Array<
      | { city: string; state: string; address?: string }
      | { lat: number; lng: number }
    >,
    params?: {
      mode?: string;
      units?: string;
      avoid?: string;
    }
  ): string {
    // Normalize waypoints
    const normalizedWaypoints = waypoints
      .map((wp) => {
        if ('lat' in wp) {
          return `${Math.round(wp.lat * 10000) / 10000},${Math.round(wp.lng * 10000) / 10000}`;
        }
        const parts: string[] = [];
        if (wp.address) parts.push(this.normalizeGeocodeKey(wp.address));
        parts.push(this.normalizeGeocodeKey(wp.city));
        parts.push(this.normalizeState(wp.state));
        return parts.join(',');
      })
      .join('|');

    // Normalize params
    const normalizedParams: string[] = [];
    if (params?.mode) normalizedParams.push(`mode:${params.mode}`);
    if (params?.units) normalizedParams.push(`units:${params.units}`);
    if (params?.avoid) normalizedParams.push(`avoid:${params.avoid}`);

    const paramsStr = normalizedParams.length > 0 ? `:${normalizedParams.join(',')}` : '';

    return `route:${normalizedWaypoints}${paramsStr}`;
  }

  /**
   * Normalize fuel station search cache key
   * Round to 3 decimal places (~111m precision) for dedup
   */
  static normalizeFuelKey(lat: number, lng: number, radiusMeters: number): string {
    const roundedLat = Math.round(lat * 1000) / 1000;
    const roundedLng = Math.round(lng * 1000) / 1000;
    return `fuel:${roundedLat},${roundedLng}:r${radiusMeters}`;
  }

  /**
   * Normalize toll estimate cache key
   */
  static normalizeTollKey(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): string {
    const oLat = Math.round(origin.lat * 10000) / 10000;
    const oLng = Math.round(origin.lng * 10000) / 10000;
    const dLat = Math.round(destination.lat * 10000) / 10000;
    const dLng = Math.round(destination.lng * 10000) / 10000;
    return `toll:${oLat},${oLng}:${dLat},${dLng}`;
  }

  /**
   * Normalize state abbreviation
   */
  private static normalizeState(state: string): string {
    const stateMap: Record<string, string> = {
      alabama: 'al',
      alaska: 'ak',
      arizona: 'az',
      arkansas: 'ar',
      california: 'ca',
      colorado: 'co',
      connecticut: 'ct',
      delaware: 'de',
      florida: 'fl',
      georgia: 'ga',
      hawaii: 'hi',
      idaho: 'id',
      illinois: 'il',
      indiana: 'in',
      iowa: 'ia',
      kansas: 'ks',
      kentucky: 'ky',
      louisiana: 'la',
      maine: 'me',
      maryland: 'md',
      massachusetts: 'ma',
      michigan: 'mi',
      minnesota: 'mn',
      mississippi: 'ms',
      missouri: 'mo',
      montana: 'mt',
      nebraska: 'ne',
      nevada: 'nv',
      'new hampshire': 'nh',
      'new jersey': 'nj',
      'new mexico': 'nm',
      'new york': 'ny',
      'north carolina': 'nc',
      'north dakota': 'nd',
      ohio: 'oh',
      oklahoma: 'ok',
      oregon: 'or',
      pennsylvania: 'pa',
      'rhode island': 'ri',
      'south carolina': 'sc',
      'south dakota': 'sd',
      tennessee: 'tn',
      texas: 'tx',
      utah: 'ut',
      vermont: 'vt',
      virginia: 'va',
      washington: 'wa',
      'west virginia': 'wv',
      wisconsin: 'wi',
      wyoming: 'wy',
      'district of columbia': 'dc',
    };

    const normalized = state.toLowerCase().trim();
    return stateMap[normalized] || normalized;
  }

  /**
   * Clean up expired cache entries
   * Should be called periodically (e.g., via cron job)
   */
  static async cleanupExpired(): Promise<number> {
    try {
      const result = await prisma.apiCache.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });
      return result.count;
    } catch (error) {
      console.error('Cache cleanup error:', error);
      return 0;
    }
  }
}






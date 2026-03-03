import { NextResponse } from 'next/server';

/**
 * Simple in-memory rate limiter for API routes.
 * Uses a sliding window approach. No external dependencies (no Redis needed).
 *
 * For production at scale, consider replacing with @upstash/ratelimit + Redis.
 *
 * @example
 * // In an API route:
 * const limiter = createRateLimiter({ windowMs: 60_000, max: 10 });
 *
 * export async function POST(request: NextRequest) {
 *   const ip = request.headers.get('x-forwarded-for') || 'unknown';
 *   const limited = limiter.check(ip);
 *   if (limited) return limited;
 *   // ... handle request
 * }
 */

interface RateLimiterOptions {
  /** Time window in milliseconds */
  windowMs: number;
  /** Max requests per window */
  max: number;
}

interface WindowEntry {
  count: number;
  resetAt: number;
}

const stores = new Map<string, Map<string, WindowEntry>>();

// Periodic cleanup to prevent memory leaks (every 5 minutes)
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [, store] of stores) {
      for (const [key, entry] of store) {
        if (now > entry.resetAt) store.delete(key);
      }
    }
  }, 5 * 60 * 1000);
  // Allow Node to exit even if interval is active
  if (typeof cleanupInterval === 'object' && 'unref' in cleanupInterval) {
    cleanupInterval.unref();
  }
}

export function createRateLimiter(options: RateLimiterOptions) {
  const storeKey = `${options.windowMs}-${options.max}`;
  if (!stores.has(storeKey)) {
    stores.set(storeKey, new Map());
  }
  const store = stores.get(storeKey)!;
  ensureCleanup();

  return {
    /**
     * Check if the identifier (IP, userId, etc.) is rate limited.
     * Returns a 429 NextResponse if limited, or null if allowed.
     */
    check(identifier: string): NextResponse | null {
      const now = Date.now();
      const entry = store.get(identifier);

      if (!entry || now > entry.resetAt) {
        store.set(identifier, { count: 1, resetAt: now + options.windowMs });
        return null;
      }

      entry.count++;
      if (entry.count > options.max) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'RATE_LIMITED',
              message: `Too many requests. Try again in ${retryAfter} seconds.`,
            },
          },
          {
            status: 429,
            headers: { 'Retry-After': String(retryAfter) },
          }
        );
      }

      return null;
    },
  };
}

/** Pre-configured limiters for common use cases */
export const rateLimiters = {
  /** General API: 100 requests per minute */
  general: createRateLimiter({ windowMs: 60_000, max: 100 }),
  /** AI endpoints: 20 requests per minute */
  ai: createRateLimiter({ windowMs: 60_000, max: 20 }),
  /** Import/export: 5 requests per minute */
  importExport: createRateLimiter({ windowMs: 60_000, max: 5 }),
  /** Auth: 10 attempts per minute */
  auth: createRateLimiter({ windowMs: 60_000, max: 10 }),
};

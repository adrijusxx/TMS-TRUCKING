# API Cache Maintenance Guide

## Overview

The API cache system stores geocoding and mapping API responses to reduce costs and improve performance. This document explains how to maintain the cache and troubleshoot issues.

## Cache Cleanup Scheduled Job

### Purpose

The `ApiCache` table stores cached responses from:
- Google Maps Geocoding API
- Google Maps Distance Matrix API
- Google Maps Directions API
- Nominatim Reverse Geocoding API

Over time, expired cache entries accumulate. The cleanup job removes expired entries to prevent database bloat.

### Cache TTL (Time To Live)

- **Geocoding**: 90 days (addresses rarely change)
- **Reverse Geocoding**: 90 days (coordinates to addresses are stable)
- **Distance Matrix**: 7 days (traffic patterns change weekly)
- **Directions**: 7 days (routes can change with traffic/construction)

## Setup Scheduled Cleanup

### Option 1: Cron Job (Linux/Unix)

Add to your crontab (`crontab -e`):

```bash
# Clean up expired API cache entries daily at 2 AM
0 2 * * * cd /path/to/TMS-TRUCKING && node -e "require('./scripts/cleanup-api-cache.js')"
```

### Option 2: Node.js Cron Package

Install `node-cron`:

```bash
npm install node-cron
```

Create `scripts/scheduled-cleanup.ts`:

```typescript
import cron from 'node-cron';
import { GeocodingCacheManager } from '@/lib/managers/GeocodingCacheManager';

// Run daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('Starting API cache cleanup...');
  const deletedCount = await GeocodingCacheManager.cleanupExpired();
  console.log(`Cleaned up ${deletedCount} expired cache entries`);
});
```

### Option 3: Next.js API Route + External Cron

Create `app/api/cron/cleanup-cache/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { GeocodingCacheManager } from '@/lib/managers/GeocodingCacheManager';

export async function GET(request: NextRequest) {
  // Add authentication check (e.g., check for secret header)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const deletedCount = await GeocodingCacheManager.cleanupExpired();
    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Cleaned up ${deletedCount} expired cache entries`,
    });
  } catch (error) {
    console.error('Cache cleanup error:', error);
    return NextResponse.json(
      { error: 'Cleanup failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

Then use an external cron service (e.g., cron-job.org, EasyCron) to call:
```
GET https://your-domain.com/api/cron/cleanup-cache
Authorization: Bearer YOUR_CRON_SECRET
```

## Manual Cleanup

### Run Cleanup Manually

You can run the cleanup manually at any time:

```typescript
import { GeocodingCacheManager } from '@/lib/managers/GeocodingCacheManager';

const deletedCount = await GeocodingCacheManager.cleanupExpired();
console.log(`Cleaned up ${deletedCount} expired entries`);
```

### Via Prisma Studio

1. Open Prisma Studio: `npx prisma studio`
2. Navigate to `ApiCache` table
3. Filter by `expiresAt < now()`
4. Delete expired entries

### Via SQL

```sql
-- Check how many expired entries exist
SELECT COUNT(*) FROM "ApiCache" WHERE "expiresAt" < NOW();

-- Delete expired entries
DELETE FROM "ApiCache" WHERE "expiresAt" < NOW();
```

## Troubleshooting

### Website Crashing or Slow Performance

If your website starts crashing or experiencing performance issues, check the following:

#### 1. Check Cache Table Size

```sql
-- Check total cache entries
SELECT COUNT(*) FROM "ApiCache";

-- Check cache size in MB
SELECT pg_size_pretty(pg_total_relation_size('"ApiCache"')) AS size;

-- Check expired entries count
SELECT COUNT(*) FROM "ApiCache" WHERE "expiresAt" < NOW();
```

#### 2. Check Database Connection Pool

If the cache table is very large, it might be causing connection pool exhaustion:

```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity WHERE datname = 'your_database_name';
```

#### 3. Emergency Cache Cleanup

If cache is causing issues, run immediate cleanup:

```bash
# Via Node.js script
node -e "const { GeocodingCacheManager } = require('./lib/managers/GeocodingCacheManager.ts'); GeocodingCacheManager.cleanupExpired().then(count => console.log('Cleaned:', count));"

# Or via SQL (faster for large tables)
psql -d your_database -c "DELETE FROM \"ApiCache\" WHERE \"expiresAt\" < NOW();"
```

#### 4. Disable Caching Temporarily

If cache is causing critical issues, you can temporarily disable caching by modifying the cache manager:

```typescript
// In lib/managers/GeocodingCacheManager.ts
static async get<T = unknown>(cacheKey: string, apiType: ApiCacheType): Promise<T | null> {
  return null; // Temporarily disable caching
}
```

**Remember to re-enable after fixing the issue!**

#### 5. Check for Cache Key Collisions

If you're seeing incorrect cached data, check for key collisions:

```sql
-- Find duplicate cache keys (should be none due to unique constraint)
SELECT "cacheKey", COUNT(*) 
FROM "ApiCache" 
GROUP BY "cacheKey" 
HAVING COUNT(*) > 1;
```

#### 6. Monitor Cache Hit Rate

```sql
-- Check cache age distribution
SELECT 
  "apiType",
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE "expiresAt" < NOW()) as expired,
  COUNT(*) FILTER (WHERE "expiresAt" >= NOW()) as active,
  AVG(EXTRACT(EPOCH FROM ("expiresAt" - NOW()))) / 86400 as avg_days_until_expiry
FROM "ApiCache"
GROUP BY "apiType";
```

## Performance Optimization

### Index Maintenance

The cache table has indexes on:
- `cacheKey` (unique)
- `apiType`
- `expiresAt`

If queries are slow, check index usage:

```sql
-- Analyze table statistics
ANALYZE "ApiCache";

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename = 'ApiCache';
```

### Partitioning (For Very Large Tables)

If the cache table grows beyond 1 million entries, consider partitioning by `expiresAt`:

```sql
-- Example: Partition by month
CREATE TABLE "ApiCache_2025_01" PARTITION OF "ApiCache"
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

## Monitoring

### Recommended Monitoring Queries

```sql
-- Cache health check
SELECT 
  'Total Entries' as metric,
  COUNT(*)::text as value
FROM "ApiCache"
UNION ALL
SELECT 
  'Expired Entries',
  COUNT(*)::text
FROM "ApiCache"
WHERE "expiresAt" < NOW()
UNION ALL
SELECT 
  'Table Size',
  pg_size_pretty(pg_total_relation_size('"ApiCache"'));
```

### Alert Thresholds

Set up alerts if:
- Cache table exceeds 1GB in size
- Expired entries exceed 100,000
- Cache hit rate drops below 50%

## Cache Invalidation

### Manual Invalidation

To manually invalidate specific cache entries:

```typescript
import { prisma } from '@/lib/prisma';

// Delete by cache key
await prisma.apiCache.delete({
  where: { cacheKey: 'geocode:123 main st, chicago, il' }
});

// Delete by API type
await prisma.apiCache.deleteMany({
  where: { apiType: 'GEOCODE' }
});

// Delete all cache
await prisma.apiCache.deleteMany({});
```

### Address Update Handling

If an address is updated in your system, you may want to invalidate its cache:

```typescript
import { GeocodingCacheManager } from '@/lib/managers/GeocodingCacheManager';
import { prisma } from '@/lib/prisma';

async function invalidateAddressCache(address: string) {
  const cacheKey = GeocodingCacheManager.normalizeGeocodeKey(address);
  await prisma.apiCache.deleteMany({
    where: {
      cacheKey,
      apiType: 'GEOCODE',
    },
  });
}
```

## Best Practices

1. **Run cleanup daily** - Prevents database bloat
2. **Monitor cache size** - Set up alerts for large tables
3. **Review TTLs periodically** - Adjust based on usage patterns
4. **Backup before bulk operations** - Always backup before deleting large amounts of data
5. **Test cleanup in staging** - Verify cleanup works before running in production

## Related Files

- `lib/managers/GeocodingCacheManager.ts` - Cache manager implementation
- `lib/maps/google-maps.ts` - Google Maps API functions with caching
- `app/api/geocoding/reverse/route.ts` - Reverse geocoding with caching
- `prisma/schema.prisma` - Database schema definition

## Support

If you encounter issues:

1. Check this document first
2. Review the cache table size and expired entries
3. Check application logs for cache-related errors
4. Run manual cleanup if needed
5. Consider temporarily disabling cache if critical issues persist






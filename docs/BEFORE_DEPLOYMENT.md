# Pre-Deployment Checklist

This document contains critical tasks and checks that must be completed before deploying to production. Each section includes detailed explanations of why these checks are important and how to properly execute them.

## 🚨 Critical Checks Before Deployment

### 1. Database Migrations

Database migrations are changes to your database schema (tables, columns, indexes, etc.). They must be applied in the correct order and tested before production deployment.

**Why this matters:**
- Untested migrations can break your application
- Missing migrations cause schema mismatches
- Database drift (differences between code and database) causes runtime errors
- Prisma client must match the database schema or queries will fail

**How to check:**

- [ ] **All migrations have been tested in staging**
  - Test each migration in a staging environment that mirrors production
  - Verify data integrity after migrations
  - Check that all indexes are created properly
  - Ensure no data loss occurs during migrations

- [ ] **Run `npx prisma migrate deploy` to apply pending migrations**
  - This command applies all pending migrations to production
  - **Important**: Use `migrate deploy` (not `migrate dev`) for production
  - `migrate deploy` doesn't create new migrations, only applies existing ones
  - Always backup your database before running migrations in production
  - Command: `npx prisma migrate deploy`

- [ ] **Verify Prisma client is up to date: `npm run db:generate`**
  - Prisma Client is the TypeScript/JavaScript client that queries your database
  - After schema changes, you must regenerate the client
  - Without regeneration, TypeScript types won't match your schema
  - This can cause runtime errors even if TypeScript compiles successfully
  - Command: `npm run db:generate` or `npx prisma generate`

- [ ] **Check for database drift: `npx prisma migrate status`**
  - Database drift occurs when your database schema doesn't match your migration files
  - This happens if migrations were applied manually or if someone modified the database directly
  - Drift can cause deployment failures or runtime errors
  - Command: `npx prisma migrate status`
  - **If drift is detected**: Review the differences and create a migration to sync them

### 2. API Cache Maintenance

The API cache stores responses from mapping APIs (Google Maps, Nominatim) to reduce costs and improve performance. Without proper maintenance, the cache table can grow indefinitely and cause database performance issues.

**Why this matters:**
- Large cache tables slow down database queries
- Expired entries waste storage space
- Missing indexes cause slow cache lookups
- Without scheduled cleanup, the table grows unbounded
- Cache bloat can exhaust database connection pools

**How to check:**

#### Check Cache Table Size

```sql
-- Run this SQL query to check cache size
-- This shows total entries, expired entries, and table size on disk
SELECT 
  COUNT(*) as total_entries,
  COUNT(*) FILTER (WHERE "expiresAt" < NOW()) as expired_entries,
  pg_size_pretty(pg_total_relation_size('"ApiCache"')) as table_size
FROM "ApiCache";
```

**Interpretation:**
- **total_entries**: Total number of cached API responses
- **expired_entries**: Entries that should be deleted (past expiration date)
- **table_size**: Physical disk space used by the cache table

**Thresholds:**
- **If table size > 500MB**: Cache is taking significant database space, cleanup recommended
- **If expired entries > 50,000**: Many stale entries exist, cleanup will free space
- **If total_entries > 1,000,000**: Consider reviewing cache TTLs or implementing partitioning

**If table size > 500MB or expired entries > 50,000**: Run cleanup before deployment

#### Run Cache Cleanup

Cache cleanup removes expired entries from the `ApiCache` table. This should be done regularly (daily recommended) to prevent table bloat.

**Option 1: Use npm script (Recommended)**
```bash
npm run cache:cleanup
```
- Uses the TypeScript cleanup script
- Includes error handling and logging
- Safest option with proper error reporting

**Option 2: Direct SQL (Fastest for large tables)**
```bash
psql -d your_database -c "DELETE FROM \"ApiCache\" WHERE \"expiresAt\" < NOW();"
```
- Fastest method for very large tables
- No error handling, so verify connection first
- Returns count of deleted rows

**Option 3: Via Node.js**
```bash
npx tsx scripts/cleanup-api-cache.ts
```
- Direct script execution
- Useful for testing or manual runs
- Includes logging output

**After cleanup:**
- Verify table size decreased: Run the size check query again
- Check application logs for any errors
- Monitor database performance improvements

#### Verify Cache Setup

- [ ] **Cache cleanup scheduled job is configured**
  - A scheduled job (cron) should run daily to clean expired entries
  - Without this, expired entries accumulate indefinitely
  - See `docs/API_CACHE_MAINTENANCE.md` for setup instructions
  - Verify the job is running: Check cron logs or job scheduler status

- [ ] **Cache table has proper indexes**
  - Indexes speed up cache lookups and cleanup operations
  - Required indexes: `cacheKey` (unique), `apiType`, `expiresAt`
  - Check indexes: `SELECT indexname FROM pg_indexes WHERE tablename = 'ApiCache';`
  - Missing indexes cause slow queries and can crash the application

- [ ] **Cache TTLs are appropriate for your use case**
  - TTL (Time To Live) determines how long entries are cached
  - Current TTLs: Geocoding (90 days), Distance Matrix (7 days), Directions (7 days)
  - If addresses change frequently, reduce geocoding TTL
  - If routes change often, reduce directions TTL
  - Adjust in `lib/managers/GeocodingCacheManager.ts` DEFAULT_TTL constant

### 3. Environment Variables

Environment variables store configuration that differs between environments (development, staging, production). Missing or incorrect variables cause application failures.

**Why this matters:**
- Missing variables cause runtime errors (e.g., "API key not configured")
- Incorrect database URLs cause connection failures
- Exposed secrets in git create security vulnerabilities
- Wrong API keys cause API call failures and unexpected costs

**How to check:**

- [ ] **All required environment variables are set**
  - Check `.env.example` or documentation for required variables
  - Verify each variable has a value (not empty or undefined)
  - Test that the application starts without errors
  - Common required variables:
    - `DATABASE_URL` - PostgreSQL connection string
    - `NEXTAUTH_SECRET` - Authentication secret
    - `NEXTAUTH_URL` - Application URL
    - `GOOGLE_MAPS_API_KEY` - Google Maps API key
    - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Public Google Maps API key
    - Any third-party API keys (Samsara, etc.)

- [ ] **`GOOGLE_MAPS_API_KEY` is configured**
  - Server-side Google Maps API key for geocoding, distance matrix, directions
  - Used in `lib/maps/google-maps.ts` for API calls
  - Without this, mapping features fall back to simplified calculations
  - Verify it's valid: Check Google Cloud Console for API key status
  - Ensure it has correct API restrictions enabled

- [ ] **`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is configured**
  - Public API key for client-side Google Maps JavaScript API
  - Used in browser components (e.g., `components/map/LiveMap.tsx`)
  - Must be public (prefixed with `NEXT_PUBLIC_`) to work in browser
  - Should have HTTP referrer restrictions for security
  - Different from server-side key - both are needed

- [ ] **Database connection strings are correct**
  - `DATABASE_URL` must point to the correct production database
  - Format: `postgresql://user:password@host:port/database?schema=public`
  - Verify connection: `npx prisma db pull` (should connect successfully)
  - Test with: `psql $DATABASE_URL -c "SELECT 1;"`
  - **Critical**: Never use development database URL in production

- [ ] **API keys and secrets are not committed to git**
  - Check `.gitignore` includes `.env`, `.env.local`, `.env.production`
  - Verify no secrets in git history: `git log -p --all -S "GOOGLE_MAPS_API_KEY"`
  - If secrets were committed: Rotate all exposed keys immediately
  - Use environment variable management tools (AWS Secrets Manager, etc.) for production
  - Never commit `.env` files or hardcode secrets in code

### 4. Build & Tests

Building and testing ensures your code compiles correctly and works as expected before deployment. Skipping these steps leads to production failures.

**Why this matters:**
- Build failures prevent deployment or cause runtime errors
- Linting errors indicate code quality issues and potential bugs
- TypeScript errors cause runtime failures in production
- Untested features may break critical user workflows
- Performance issues discovered in production are harder to fix

**How to check:**

- [ ] **Run `npm run build` successfully**
  - This compiles your Next.js application for production
  - Build process includes: TypeScript compilation, code optimization, static page generation
  - **Critical**: Build must complete without errors
  - Check build output for warnings (warnings can become errors in production)
  - Verify build artifacts are created: `.next/` directory should exist
  - Build time should be reasonable (< 10 minutes for typical apps)
  - If build fails: Fix errors before deploying
  - Command: `npm run build`

- [ ] **Run `npm run lint` - no critical errors**
  - Linting checks code quality, style, and potential bugs
  - Critical errors must be fixed (they can cause runtime failures)
  - Warnings should be reviewed (they indicate code smells)
  - Common lint errors: unused variables, missing dependencies, unsafe code patterns
  - Fix all critical errors before deployment
  - Warnings can be addressed post-deployment if non-critical
  - Command: `npm run lint`

- [ ] **Run `npm run type-check` - no TypeScript errors**
  - TypeScript type checking catches type mismatches before runtime
  - Type errors cause runtime failures in production
  - This is separate from build (build may succeed with type errors in some cases)
  - All type errors must be fixed before deployment
  - Common type errors: missing type definitions, incorrect types, null/undefined handling
  - Command: `npm run type-check` or `npx tsc --noEmit`

- [ ] **Test critical user flows in staging**
  - Staging environment should mirror production
  - Test workflows that users depend on:
    - User authentication and login
    - Creating/editing loads
    - Route calculation and mapping
    - Driver assignment
    - Invoice generation
    - Data import/export
  - Verify no regressions from recent changes
  - Test with realistic data volumes
  - Check error handling (what happens when things fail?)
  - Verify performance is acceptable
  - Document any known issues before deploying

### 5. Performance Checks

Performance issues in production affect user experience and can cause crashes. These checks identify bottlenecks before they become critical.

**Why this matters:**
- Connection pool exhaustion causes application crashes
- Cache failures increase API costs and slow responses
- API rate limit violations cause service interruptions
- Slow queries cause timeouts and poor user experience
- Performance issues are harder to diagnose and fix in production

**How to check:**

- [ ] **Check database connection pool settings**
  - Connection pools manage database connections efficiently
  - Too few connections: Requests queue and timeout
  - Too many connections: Database resource exhaustion
  - Check Prisma connection limit: Default is usually 10-20 connections
  - Verify pool settings in `DATABASE_URL` or Prisma config
  - Monitor active connections: `SELECT count(*) FROM pg_stat_activity WHERE datname = 'your_db';`
  - **Warning signs**: Connection timeouts, "too many connections" errors
  - Adjust pool size based on application load (typical: 10-50 connections)

- [ ] **Verify cache is working (check logs for cache hits)**
  - Cache reduces API calls and improves response times
  - Check application logs for cache hit/miss patterns
  - High cache hit rate (>70%) indicates good caching
  - Low cache hit rate (<30%) suggests cache isn't working or TTLs too short
  - Verify cache entries exist: `SELECT COUNT(*) FROM "ApiCache" WHERE "expiresAt" > NOW();`
  - Check for cache errors in logs (database connection issues, etc.)
  - Test manually: Make same API call twice, second should be faster (cached)

- [ ] **Monitor API rate limits (Google Maps, etc.)**
  - API providers enforce rate limits to prevent abuse
  - Exceeding limits causes API errors and service interruptions
  - Google Maps limits: Check your quota in Google Cloud Console
  - Common limits: Requests per second, requests per day, requests per 100 seconds
  - Monitor usage: Check API dashboard for current usage
  - Set up alerts: Configure alerts at 80% of quota
  - If approaching limits: Review caching effectiveness, consider upgrading plan
  - **Critical**: Know your limits before deployment to avoid unexpected failures

- [ ] **Check for slow queries**
  - Slow queries cause timeouts and poor user experience
  - Check database slow query log (if enabled)
  - Use PostgreSQL query analysis: `EXPLAIN ANALYZE` on common queries
  - Look for queries taking > 1 second
  - Common causes: Missing indexes, full table scans, inefficient joins
  - Check index usage: `SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0;`
  - Fix slow queries before deployment (add indexes, optimize queries)
  - Monitor query performance in production after deployment

### 6. Security

Security vulnerabilities can lead to data breaches, unauthorized access, and compliance violations. These checks prevent common security issues.

**Why this matters:**
- Security vulnerabilities expose user data and system access
- Exposed secrets allow attackers to access your systems
- Broken authentication allows unauthorized access
- Misconfigured CORS allows cross-site attacks
- Security breaches cause legal liability and reputation damage

**How to check:**

- [ ] **Review recent security updates**
  - Check for security patches in dependencies: `npm audit`
  - Review changelogs of updated packages for security fixes
  - Update packages with known vulnerabilities before deployment
  - Check GitHub security advisories for your dependencies
  - Run `npm audit fix` to automatically fix vulnerabilities
  - **Critical vulnerabilities**: Fix immediately before deployment
  - **High vulnerabilities**: Fix before deployment if possible
  - Document any vulnerabilities that can't be fixed immediately

- [ ] **Check for exposed API keys or secrets**
  - Exposed secrets allow attackers to access your services
  - Check git history: `git log -p --all -S "password" --source --all`
  - Search codebase for hardcoded secrets: `grep -r "api.*key" --include="*.ts" --include="*.tsx"`
  - Check environment files aren't committed: `git ls-files | grep -E "\.env"`
  - Verify `.env` files are in `.gitignore`
  - Check public repositories (GitHub, etc.) for accidentally pushed secrets
  - If secrets found: Rotate all exposed keys immediately
  - Use secret management tools (AWS Secrets Manager, HashiCorp Vault) for production

- [ ] **Verify authentication is working**
  - Broken authentication allows unauthorized access
  - Test login flow: Verify users can log in successfully
  - Test logout: Verify sessions are properly terminated
  - Test protected routes: Verify unauthenticated users are redirected
  - Test session expiration: Verify expired sessions require re-login
  - Check NextAuth configuration: Verify `NEXTAUTH_SECRET` and `NEXTAUTH_URL` are correct
  - Test role-based access: Verify users only access authorized resources
  - Verify password hashing: Passwords should be hashed (never plain text)
  - Check for authentication bypass vulnerabilities

- [ ] **Check CORS settings**
  - CORS (Cross-Origin Resource Sharing) controls which domains can access your API
  - Misconfigured CORS allows unauthorized domains to access your API
  - Check Next.js API routes: Verify CORS headers are set correctly
  - Review allowed origins: Only production domains should be allowed
  - Test CORS: Verify unauthorized domains are blocked
  - Check for wildcard origins (`*`): Should be avoided in production
  - Verify credentials handling: `Access-Control-Allow-Credentials` should be set correctly
  - Test from different origins to ensure CORS works as expected

---

## 🚨 Emergency Procedures (If Website Crashes)

If your website crashes or becomes unresponsive, follow these steps in order. Each step addresses a common cause of production failures.

### Step 1: Check Cache Table Size

A bloated cache table is a common cause of database performance issues and application crashes. This check identifies if cache is the problem.

**What to do:**

```sql
-- Run this SQL query to check cache size
-- This shows if cache table is consuming too much space
SELECT 
  COUNT(*) as total_entries,
  COUNT(*) FILTER (WHERE "expiresAt" < NOW()) as expired_entries,
  pg_size_pretty(pg_total_relation_size('"ApiCache"')) as table_size
FROM "ApiCache";
```

**Interpretation:**
- **total_entries**: Number of cached API responses
- **expired_entries**: Entries that should be deleted (wasting space)
- **table_size**: Physical disk space used

**Decision:**
- **If table_size > 500MB**: Cache is likely causing performance issues
- **If expired_entries > 50,000**: Many stale entries need cleanup
- **If total_entries > 1,000,000**: Table is very large, cleanup needed

**If table size > 500MB or expired entries > 50,000**: Run cleanup immediately (see Step 2)

**Why this helps:**
- Large tables slow down all database queries
- Expired entries waste storage and slow down cleanup operations
- Reducing table size improves query performance immediately

### Step 2: Run Emergency Cleanup

Removing expired cache entries frees database resources and improves performance. This is safe to run at any time.

**What to do:**

**Option 1: Use npm script (Recommended)**
```bash
npm run cache:cleanup
```
- Safest option with error handling
- Includes logging to verify cleanup worked
- Use this if you have access to the application directory

**Option 2: Direct SQL (Fastest for large tables)**
```bash
psql -d your_database -c "DELETE FROM \"ApiCache\" WHERE \"expiresAt\" < NOW();"
```
- Fastest method for very large tables
- Direct database operation, bypasses application
- Use this if npm script is slow or unavailable
- **Note**: Returns count of deleted rows

**Option 3: Via Node.js**
```bash
npx tsx scripts/cleanup-api-cache.ts
```
- Alternative to npm script
- Useful if package.json scripts aren't working

**After cleanup:**
1. Verify cleanup worked: Run Step 1 query again, table_size should decrease
2. Check application logs for errors
3. Monitor website performance - should improve immediately
4. If website is still down, proceed to Step 3

**Expected results:**
- Expired entries count should drop to near zero
- Table size should decrease significantly
- Database queries should be faster
- Website should become responsive again

### Step 3: Check Database Connections

Exhausted connection pools prevent new requests from connecting to the database, causing the website to crash.

**What to do:**

```sql
-- Check current active database connections
SELECT count(*) FROM pg_stat_activity WHERE datname = 'your_database_name';

-- More detailed view (shows what's using connections)
SELECT 
  count(*) as total_connections,
  count(*) FILTER (WHERE state = 'active') as active_queries,
  count(*) FILTER (WHERE state = 'idle') as idle_connections,
  count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
FROM pg_stat_activity 
WHERE datname = 'your_database_name';
```

**Interpretation:**
- **total_connections**: Current number of database connections
- **active_queries**: Connections currently executing queries
- **idle_connections**: Connections waiting for queries
- **idle_in_transaction**: Connections in uncommitted transactions (problematic)

**Decision:**
- **If connections > 80% of max**: Connection pool is nearly exhausted
- **If idle_in_transaction > 10**: Transactions aren't being committed (leak)
- **If active_queries > 50% of connections**: Database is overloaded

**If connections > 80% of max**: 
- Cache cleanup (Step 2) might help by reducing query load
- Also check for connection leaks (connections not being closed)
- Consider increasing connection pool size temporarily
- Look for long-running queries that hold connections

**Additional checks:**
- Check for connection leaks in application code
- Review recent code changes that might create connections
- Check for transactions that aren't being committed/rolled back

### Step 4: Temporarily Disable Caching (Last Resort)

If cache is causing critical issues and cleanup didn't help, temporarily disable caching to restore service. **This increases API costs**, so only use as last resort.

**What to do:**

Edit `lib/managers/GeocodingCacheManager.ts`:

```typescript
static async get<T = unknown>(cacheKey: string, apiType: ApiCacheType): Promise<T | null> {
  return null; // Temporarily disable - REMEMBER TO RE-ENABLE!
}
```

**What this does:**
- All cache lookups return `null` (cache miss)
- Application makes API calls directly (no caching)
- Website should work, but API costs will increase
- Response times may be slower

**After disabling:**
1. Verify website is working again
2. Monitor API costs (they will increase significantly)
3. Investigate root cause of cache issues
4. Fix the underlying problem
5. **Re-enable caching** by removing the `return null;` line

**⚠️ CRITICAL: Remember to re-enable caching after fixing the issue!**

**Why this is last resort:**
- Increases API costs dramatically (no caching = every request hits API)
- Slower response times (no cached responses)
- Doesn't fix the root cause, only masks symptoms
- Should only be used if website is completely down

**When to use:**
- Website is completely down
- Cache cleanup didn't help
- Database connections are exhausted
- Need immediate service restoration
- Will investigate and fix root cause after service restored

---

## Common Issues & Solutions

This section covers common problems you might encounter and how to fix them.

### Issue: Cache Table Growing Too Large

**Symptoms:**
- Slow database queries (queries taking > 1 second)
- High database disk usage (database size growing rapidly)
- Website becoming slow (pages taking longer to load)
- Database connection timeouts
- Application crashes under load

**Root Cause:**
- Expired cache entries aren't being cleaned up
- Cache TTLs are too long, causing entries to accumulate
- No scheduled cleanup job is running
- High volume of unique API calls (many different addresses)

**Solution:**

1. **Run cleanup immediately:**
   ```bash
   npm run cache:cleanup
   ```
   - Removes expired entries immediately
   - Frees database space
   - Improves query performance

2. **Set up scheduled cleanup:**
   - Configure a daily cron job to run cleanup automatically
   - See `docs/API_CACHE_MAINTENANCE.md` for setup instructions
   - Prevents future accumulation of expired entries
   - Run cleanup daily at low-traffic time (e.g., 2 AM)

3. **Consider reducing TTL if addresses change frequently:**
   - If addresses in your system change often, reduce geocoding TTL
   - Edit `lib/managers/GeocodingCacheManager.ts` DEFAULT_TTL constant
   - Reduce `GEOCODE` from 90 days to 30 days if needed
   - Balance between cache effectiveness and data freshness

4. **Monitor cache growth:**
   - Set up monitoring to alert when cache exceeds thresholds
   - Review cache growth patterns weekly
   - Adjust TTLs based on actual usage patterns

**Prevention:**
- Always set up scheduled cleanup before deployment
- Monitor cache size regularly
- Review TTLs periodically based on data change frequency

### Issue: Stale Cached Data

**Symptoms:**
- Incorrect addresses showing up in the application
- Wrong coordinates being returned for locations
- Users reporting outdated location information
- Address updates not reflecting in the application

**Root Cause:**
- Address was updated in your system, but cache still has old data
- Cache TTL hasn't expired yet, so old data is still being served
- Cache wasn't invalidated when address was updated

**Solution:**

**Option 1: Invalidate specific cache entry (Recommended)**
```typescript
// Invalidate cache for a specific address
import { prisma } from '@/lib/prisma';
import { GeocodingCacheManager } from '@/lib/managers/GeocodingCacheManager';

// Normalize the address to match cache key format
const cacheKey = GeocodingCacheManager.normalizeGeocodeKey('old address');

// Delete cached entry
await prisma.apiCache.deleteMany({
  where: { 
    cacheKey, 
    apiType: 'GEOCODE' 
  }
});

// Next API call will fetch fresh data and cache it
```

**Option 2: Invalidate all geocoding cache (Nuclear option)**
```typescript
// Delete all geocoding cache entries
await prisma.apiCache.deleteMany({
  where: { apiType: 'GEOCODE' }
});
```
- Use only if many addresses are stale
- Will increase API costs temporarily (all addresses re-fetched)

**Option 3: Wait for TTL expiration**
- If only a few addresses are stale, wait for cache to expire naturally
- Cache expires after TTL (90 days for geocoding)
- Not recommended if data is critical

**Prevention:**
- Implement cache invalidation when addresses are updated
- Add cache invalidation to address update workflows
- Consider shorter TTLs if addresses change frequently

### Issue: Cache Not Working

**Symptoms:**
- Still making API calls for repeated addresses (should be cached)
- High API costs (not seeing cost reduction from caching)
- No cache entries in database
- Application logs show no cache hits

**Root Cause:**
- Database migration wasn't run (ApiCache table doesn't exist)
- Prisma client wasn't regenerated (doesn't know about ApiCache model)
- Cache code has errors preventing it from working
- Database connection issues preventing cache writes

**Check:**

1. **Verify migration ran:**
   ```sql
   -- Check if ApiCache table exists
   SELECT * FROM "ApiCache" LIMIT 1;
   ```
   - If error "table does not exist": Run migration `npx prisma migrate deploy`
   - If query succeeds: Table exists, check other causes

2. **Check Prisma client is regenerated:**
   ```bash
   npm run db:generate
   ```
   - Prisma client must know about ApiCache model
   - Regenerate after schema changes
   - Verify no errors during generation

3. **Check application logs for cache errors:**
   - Look for "Cache get error" or "Cache set error" messages
   - Database connection errors prevent cache from working
   - Permission errors prevent cache writes
   - Check logs during API calls to see if cache is being used

4. **Test cache manually:**
   ```typescript
   // Test if cache is working
   import { GeocodingCacheManager, ApiCacheType } from '@/lib/managers/GeocodingCacheManager';
   
   // Try to set a cache entry
   await GeocodingCacheManager.set('test-key', ApiCacheType.GEOCODE, { test: 'data' });
   
   // Try to get it back
   const cached = await GeocodingCacheManager.get('test-key', ApiCacheType.GEOCODE);
   console.log('Cache test:', cached); // Should return { test: 'data' }
   ```

5. **Verify database connection:**
   - Check `DATABASE_URL` is correct
   - Verify database is accessible
   - Test connection: `npx prisma db pull`

**Common fixes:**
- Run missing migrations
- Regenerate Prisma client
- Fix database connection issues
- Check database permissions
- Review cache code for bugs

---

## Quick Reference Commands

Common commands you'll need during deployment and troubleshooting. Each command includes a brief explanation.

### Cache Management

```bash
# Cleanup expired cache entries
npm run cache:cleanup
# Removes expired entries from ApiCache table
# Safe to run anytime, recommended daily

# Check cache statistics by API type
psql -d your_database -c "SELECT \"apiType\", COUNT(*) FROM \"ApiCache\" GROUP BY \"apiType\";"
# Shows how many cached entries exist for each API type
# Helps identify which APIs are being cached most

# Delete all cache (nuclear option - use with caution)
psql -d your_database -c "DELETE FROM \"ApiCache\";"
# Removes ALL cache entries, not just expired ones
# Use only in emergencies - will increase API costs temporarily
# All addresses/routes will need to be re-fetched
```

### Database Management

```bash
# Check database migrations status
npx prisma migrate status
# Shows which migrations have been applied
# Identifies pending migrations that need to be deployed
# Detects database drift (schema differences)

# Generate Prisma client
npm run db:generate
# Regenerates TypeScript client after schema changes
# Must run after migrations or schema updates
# Ensures types match database schema

# Open Prisma Studio (database GUI)
npm run db:studio
# Visual interface to browse and edit database
# Useful for debugging and manual data inspection
# Opens in browser at http://localhost:5555
```

### Build & Quality Checks

```bash
# Build project for production
npm run build
# Compiles Next.js application
# Creates optimized production build
# Must complete without errors before deployment

# Type check (without building)
npm run type-check
# Validates TypeScript types
# Catches type errors before runtime
# Faster than full build for quick checks

# Lint code
npm run lint
# Checks code quality and style
# Identifies potential bugs and code smells
# Fix critical errors before deployment
```

### Troubleshooting

```bash
# Check cache table size
psql -d your_database -c "SELECT COUNT(*) as total, pg_size_pretty(pg_total_relation_size('\"ApiCache\"')) as size FROM \"ApiCache\";"

# Check expired cache entries
psql -d your_database -c "SELECT COUNT(*) FROM \"ApiCache\" WHERE \"expiresAt\" < NOW();"

# Check database connections
psql -d your_database -c "SELECT count(*) FROM pg_stat_activity WHERE datname = 'your_database_name';"

# Test database connection
npx prisma db pull
# Attempts to connect and read schema
# Fails if connection is broken
```

### Environment & Configuration

```bash
# Check environment variables (Linux/Mac)
env | grep -E "DATABASE_URL|GOOGLE_MAPS|NEXTAUTH"

# Check if .env file exists and is readable
ls -la .env*

# Verify .env is in .gitignore
grep -E "\.env" .gitignore
```

---

## Additional Pre-Deployment Tasks

### Add your custom checks here:

- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

---

## Related Documentation

- `docs/API_CACHE_MAINTENANCE.md` - Detailed cache maintenance guide
- `scripts/cleanup-api-cache.ts` - Cache cleanup script
- `lib/managers/GeocodingCacheManager.ts` - Cache manager implementation

---

## Notes

Add any deployment-specific notes or reminders here:

- 
- 
- 


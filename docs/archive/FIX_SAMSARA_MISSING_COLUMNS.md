# FIX: Samsara Integration Missing Database Columns

**Date:** December 5, 2025  
**Issue:** Prisma schema/database mismatch causing runtime errors  
**Error Code:** P2022

## Problem

The Prisma schema defined Samsara integration fields that were never migrated to the database:

### Missing Columns in `Truck` Table:
- `samsaraId` (TEXT, UNIQUE)
- `samsaraSyncedAt` (TIMESTAMP)
- `samsaraSyncStatus` (TEXT)
- `lastOdometerReading` (DOUBLE PRECISION)
- `lastOdometerUpdate` (TIMESTAMP)
- `lastEngineHours` (DOUBLE PRECISION)

### Missing Columns in `Trailer` Table:
- `samsaraId` (TEXT, UNIQUE)
- `samsaraSyncedAt` (TIMESTAMP)
- `samsaraSyncStatus` (TEXT)

## Error Messages

```
PrismaClientKnownRequestError: The column `Truck.samsaraId` does not exist in the current database.
PrismaClientKnownRequestError: The column `Truck.lastOdometerReading` does not exist in the current database.
```

## Root Cause

Schema was updated with Samsara integration fields, but:
1. No migration was created for these fields
2. Shadow database issues prevented `prisma migrate dev`
3. Database was out of sync with schema

## Solution

### 1. Created Migration File

**File:** `prisma/migrations/20251205000000_add_samsara_fields/migration.sql`

```sql
-- Add Samsara Integration fields to Truck table
ALTER TABLE "Truck" ADD COLUMN IF NOT EXISTS "samsaraId" TEXT;
ALTER TABLE "Truck" ADD COLUMN IF NOT EXISTS "samsaraSyncedAt" TIMESTAMP(3);
ALTER TABLE "Truck" ADD COLUMN IF NOT EXISTS "samsaraSyncStatus" TEXT;
ALTER TABLE "Truck" ADD COLUMN IF NOT EXISTS "lastOdometerReading" DOUBLE PRECISION;
ALTER TABLE "Truck" ADD COLUMN IF NOT EXISTS "lastOdometerUpdate" TIMESTAMP(3);
ALTER TABLE "Truck" ADD COLUMN IF NOT EXISTS "lastEngineHours" DOUBLE PRECISION;

-- Add Samsara Integration fields to Trailer table
ALTER TABLE "Trailer" ADD COLUMN IF NOT EXISTS "samsaraId" TEXT;
ALTER TABLE "Trailer" ADD COLUMN IF NOT EXISTS "samsaraSyncedAt" TIMESTAMP(3);
ALTER TABLE "Trailer" ADD COLUMN IF NOT EXISTS "samsaraSyncStatus" TEXT;

-- Create unique constraints for samsaraId
CREATE UNIQUE INDEX IF NOT EXISTS "Truck_samsaraId_key" ON "Truck"("samsaraId");
CREATE UNIQUE INDEX IF NOT EXISTS "Trailer_samsaraId_key" ON "Trailer"("samsaraId");

-- Create indexes for samsaraId
CREATE INDEX IF NOT EXISTS "Truck_samsaraId_idx" ON "Truck"("samsaraId");
CREATE INDEX IF NOT EXISTS "Trailer_samsaraId_idx" ON "Trailer"("samsaraId");
```

### 2. Executed SQL Directly

Used raw SQL execution via Prisma Client to apply changes to production database.

### 3. Marked Migration as Applied

```bash
npx prisma migrate resolve --applied 20251205000000_add_samsara_fields
```

## Required User Actions

To complete the fix, you MUST:

1. **Stop the Dev Server** (Terminal 3)
   ```bash
   # Press Ctrl+C in the terminal running 'npm run dev'
   ```

2. **Regenerate Prisma Client**
   ```bash
   npx prisma generate
   ```

3. **Restart Dev Server**
   ```bash
   npm run dev
   ```

## Verification

After restarting, these operations should work without errors:
- ✅ Loading truck details pages
- ✅ Loading load details pages
- ✅ Viewing fleet board
- ✅ Any query involving Truck or Trailer models

## Multi-MC Safety Check

✅ **Safe**: These fields are optional integration fields that do not affect Multi-MC isolation:
- All fields are nullable (optional)
- No impact on `mcNumberId` filtering
- No changes to authentication or authorization logic

## Prevention

To avoid this in the future:
1. Always run `npx prisma migrate dev` after schema changes
2. Check migration files are created in `prisma/migrations/`
3. Verify with `npx prisma migrate status`
4. If shadow DB issues occur, use `npx prisma db push --accept-data-loss` for dev

## Related Files

- `prisma/schema.prisma` (lines 1113-1119: Truck Samsara fields)
- `prisma/schema.prisma` (lines 1201-1205: Trailer Samsara fields)
- `app/dashboard/loads/[id]/page.tsx` (affected page)
- `app/dashboard/trucks/page.tsx` (affected page)


# Schema Sync Required

## Critical Issues

The audit scripts require the database schema to be fully synced with Prisma schema. 

### Current Issues

1. **Customer Model**: The `detentionFreeTimeHours` and `detentionRate` fields exist in the Prisma schema but don't exist in the database. 
   - ✅ Migration file created: `prisma/migrations/20250127000002_add_customer_detention_fields/migration.sql`
   - ⚠️ Migration needs to be applied to the database

2. **Invoice Model**: Invoice doesn't have `deletedAt` field - this has been fixed in the scripts.

3. **LoadStatus Enum**: The actual enum values are:
   - `PENDING`
   - `ASSIGNED`
   - `EN_ROUTE_PICKUP` (NOT `DISPATCHED`)
   - `AT_PICKUP`
   - `LOADED`
   - `EN_ROUTE_DELIVERY` (NOT `IN_TRANSIT`)
   - `AT_DELIVERY`
   - `DELIVERED`
   - `BILLING_HOLD`
   - `READY_TO_BILL`
   - `INVOICED`
   - `PAID`
   - `CANCELLED`

4. **Document Model**: Uses `uploadedBy` (string), not `uploadedById`.

5. **DriverAdvance Model**: 
   - Does NOT have `companyId` field
   - Does NOT have `advanceType` enum - it's just cash/fuel based on `loadId` presence

## Resolution Steps

1. **Regenerate Prisma Client**:
   ```bash
   npm run db:generate
   ```

2. **Run Migrations** (if needed):
   ```bash
   npm run db:migrate
   ```

3. **Or Sync Database to Schema**:
   ```bash
   npx prisma db push
   ```

## Fixes Applied

- ✅ Removed `deletedAt` filter from Invoice queries
- ✅ Updated Invoice queries to use `loadIds` array instead of relation
- ✅ Regenerated Prisma Client

## Pending Fixes

The following script files need updates:
- `generate-test-loads.ts`: Fix LoadStatus enum values, Document `uploadedBy` field
- `generate-test-expenses.ts`: Fix LoadStatus enum values
- `generate-test-accessorials.ts`: Fix LoadStatus enum values
- `generate-test-advances.ts`: Remove `companyId` and `advanceType` usage
- `test-load-creation.ts`: Fix LoadStatus enum values, Document fields
- `test-load-completion.ts`: Fix LoadStatus enum values, Document fields
- `test-ready-to-bill.ts`: Fix Customer creation, Document fields


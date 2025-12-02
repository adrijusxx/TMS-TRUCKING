# Quick Fix: Schema Sync Errors

## Problem

You're getting these errors:
1. `The column Customer.detentionFreeTimeHours does not exist in the current database.`
2. `The column LoadExpense.vendorId does not exist in the current database.`

These happen because your Prisma schema has fields that don't exist in your database yet.

## Solution - Run These Commands

**Important:** Stop your Next.js dev server first (Ctrl+C), then run these commands:

### Step 1: Apply Schema Changes

Choose **ONE** of these methods:

#### Option A: Sync Schema Directly (Fastest - Recommended for Development)
```bash
npx prisma db push
```

#### Option B: Apply Migrations (Better for Production)
```bash
npx prisma migrate deploy
```

### Step 2: Regenerate Prisma Client
```bash
npx prisma generate
```

### Step 3: Restart Dev Server
```bash
npm run dev
```

## What Gets Fixed

✅ **Customer table** will get:
- `detentionFreeTimeHours` column (nullable Float)
- `detentionRate` column (nullable Float)

✅ **LoadExpense table** will get:
- `vendorId` column (nullable String, foreign key to Vendor)
- `reimbursable` column (Boolean, default false)
- Index on `vendorId`

## Files Created

The following migration files have been created:
- `prisma/migrations/20250127000002_add_customer_detention_fields/migration.sql`
- `prisma/migrations/20250127000003_add_load_expense_vendor_relation/migration.sql`

## Verification

After running the commands:
1. ✅ Load edit page should work: `/dashboard/loads/[id]/edit`
2. ✅ Load API endpoint should work: `/api/loads/[id]`
3. ✅ No more Prisma column errors in console

## Alternative: Run the Fix Script

If the above doesn't work, you can also run:

```bash
npx tsx scripts/apply-schema-fixes.ts
npx prisma generate
```

Then restart your dev server.






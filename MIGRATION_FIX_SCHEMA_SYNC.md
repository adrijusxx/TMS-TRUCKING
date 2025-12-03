# Schema Synchronization - Migration Fixes

## Issues Identified

Two critical schema mismatches have been identified where Prisma schema fields don't exist in the database:

### 1. Customer Model - Missing Detention Fields
- **Error**: `The column Customer.detentionFreeTimeHours does not exist in the current database.`
- **Fields Missing**:
  - `detentionFreeTimeHours` (Float?, nullable)
  - `detentionRate` (Float?, nullable)
- **Migration**: `20250127000002_add_customer_detention_fields`

### 2. LoadExpense Model - Missing Vendor Relation
- **Error**: `The column LoadExpense.vendorId does not exist in the current database.`
- **Fields Missing**:
  - `vendorId` (String?, nullable, foreign key to Vendor)
  - `reimbursable` (Boolean, default false)
- **Migration**: `20250127000003_add_load_expense_vendor_relation`

## Migrations Created

### Migration 1: Add Customer Detention Fields
**File**: `prisma/migrations/20250127000002_add_customer_detention_fields/migration.sql`

Adds:
- `detentionFreeTimeHours` - Customer-specific free time (hours) before detention charges apply
- `detentionRate` - Customer-specific detention rate ($/hour)

### Migration 2: Add LoadExpense Vendor Relation
**File**: `prisma/migrations/20250127000003_add_load_expense_vendor_relation/migration.sql`

Adds:
- `vendorId` - Foreign key to Vendor table (nullable)
- `reimbursable` - Boolean flag indicating if expense is reimbursable
- Foreign key constraint and index

## How to Apply

### Option 1: Apply All Migrations (Recommended)

```bash
# Apply all pending migrations
npx prisma migrate deploy

# Regenerate Prisma Client
npx prisma generate
```

### Option 2: Sync Schema Directly (Faster for Development)

```bash
# Sync schema directly to database
npx prisma db push

# Regenerate Prisma Client
npx prisma generate
```

### Option 3: Apply Migrations Individually

```bash
# Apply first migration
npx prisma migrate resolve --applied 20250127000002_add_customer_detention_fields
npx prisma migrate deploy

# Apply second migration
npx prisma migrate resolve --applied 20250127000003_add_load_expense_vendor_relation
npx prisma migrate deploy

# Regenerate Prisma Client
npx prisma generate
```

## After Applying Migrations

1. ✅ Restart your Next.js dev server
2. ✅ The errors should be resolved
3. ✅ All Prisma queries should work correctly

## Verification

After applying migrations, verify by:
1. Checking that the load edit page works: `/dashboard/loads/[id]/edit`
2. Checking that load API endpoints work: `/api/loads/[id]`
3. No more Prisma column errors in the console

## Notes

- Both migrations use safe SQL with existence checks (`IF NOT EXISTS`)
- Migrations are idempotent - safe to run multiple times
- No data loss - all fields are nullable or have defaults







# Fix Blocked Driver Imports

## Problem

When importing drivers, they appear to be "stuck" and won't import. This happens because:

1. **Soft-deleted drivers** still exist in the database with unique constraints
2. **Unique constraints** on `driverNumber` and `email` prevent importing drivers with the same values
3. Even though drivers are soft-deleted, the database constraints still apply

## Diagnosis

### Step 1: Check What's Blocking Imports

Run the diagnostic script:

```bash
npm run db:diagnose-imports
```

This will show you:
- How many soft-deleted drivers exist
- Which drivers/emails are blocking imports
- Any duplicate constraint violations

### Step 2: Review the Output

The script will show you:
- Total drivers (active and deleted)
- Soft-deleted drivers that might block imports
- Duplicate driver numbers or emails (shouldn't happen, but possible)
- Orphaned user records

## Solutions

### Solution 1: Use "Update Existing Drivers" Option (Recommended)

**If you want to keep the existing data:**

1. Go to Drivers → Import
2. **Enable "Update existing drivers" checkbox**
3. Upload your CSV file
4. The import will automatically:
   - Reactivate soft-deleted drivers
   - Update existing drivers with new data
   - Create new drivers that don't exist

This is the **safest option** - it preserves all data and reactivates deleted drivers.

### Solution 2: Reactivate Soft-Deleted Drivers

If you want to reactivate all soft-deleted drivers at once:

```bash
# See what would be reactivated
npm run db:cleanup-drivers --action=list

# Reactivate all soft-deleted drivers
npm run db:cleanup-drivers --action=reactivate
```

Or for a specific company:

```bash
npm run db:cleanup-drivers --action=reactivate --company-id=<your-company-id>
```

### Solution 3: Permanently Delete Soft-Deleted Drivers

**⚠️ WARNING: This permanently deletes drivers and cannot be undone!**

Only use this if:
- You're sure you don't need the deleted drivers
- The drivers don't have related records (loads, settlements, etc.)

```bash
# First check what would be deleted (dry run)
npm run db:cleanup-drivers --action=delete --dry-run

# Then actually delete
npm run db:cleanup-drivers --action=delete
```

**Note:** This will fail if drivers have related records (loads, settlements, etc.). In that case, use Solution 1 or 2.

### Solution 4: Database Reset (Last Resort)

**⚠️ WARNING: This deletes ALL data in the database!**

Only use this if:
- You're in development/testing
- You're okay losing ALL data (drivers, loads, trucks, customers, invoices, etc.)

```bash
npm run db:reset
```

Then you can re-import everything fresh.

## Why This Happens

The database has unique constraints:

1. **User.email** - Must be unique across all users
2. **Driver.driverNumber** - Must be unique across all drivers

When a driver is soft-deleted:
- The record still exists with `deletedAt` set
- The unique constraints still apply
- You cannot create a new driver with the same email or driver number

## Prevention

To prevent this issue in the future:

1. **Always use "Update existing drivers"** when re-importing
2. **Before deleting drivers**, consider if you'll need to re-import them later
3. **For permanent cleanup**, use the cleanup script periodically

## Quick Fix Command

If you just want to reactivate all soft-deleted drivers:

```bash
npm run db:cleanup-drivers --action=reactivate
```

Then try your import again with "Update existing drivers" enabled.

## Import Best Practices

1. **First import**: Leave "Update existing drivers" **unchecked**
2. **Subsequent imports** (updates/re-imports): **Check "Update existing drivers"**
3. **After cleaning up**: Check "Update existing drivers" to reactivate any deleted drivers























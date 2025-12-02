# Deleting Records in TMS

This guide explains how to safely delete records in the TMS system.

## Important: Soft Deletes Only

**The TMS system uses soft deletes, not hard deletes.** Records are never permanently removed from the database. Instead, they are marked with a `deletedAt` timestamp and optionally `isActive: false`.

## Why Prisma Studio Delete Doesn't Work

If you try to delete records directly in Prisma Studio using the delete button:

1. **Foreign Key Constraints**: The database has many `ON DELETE RESTRICT` constraints that prevent deletion if related records exist.
2. **Soft Delete Pattern**: The application expects soft deletes (setting `deletedAt`), not hard deletes (removing the record).
3. **Data Integrity**: Hard deleting can break relationships and cause application errors.

## Methods to Delete Records

### Method 1: Using the Application UI (Recommended)

The safest way to delete records is through the application UI:
- Navigate to the record you want to delete
- Use the delete button/action provided
- The application will handle soft deletion correctly

### Method 2: Using the Soft Delete Script

For bulk deletions or when the UI isn't available, use the provided script:

```bash
npm run db:soft-delete <model> <id1> [id2] [id3] ...
```

**Examples:**

```bash
# Delete a single user
npm run db:soft-delete user clxxx123

# Delete multiple drivers
npm run db:soft-delete driver clxxx123 clxxx456 clxxx789

# Delete a load
npm run db:soft-delete load clxxx123

# Delete a truck
npm run db:soft-delete truck clxxx123
```

**Available Models:**
- `user` - Users
- `driver` - Drivers
- `load` - Loads
- `truck` - Trucks
- `trailer` - Trailers
- `customer` - Customers
- `invoice` - Invoices
- `settlement` - Settlements
- `breakdown` - Breakdowns
- `maintenanceRecord` or `maintenance` - Maintenance records
- `inspection` - Inspections
- `document` - Documents
- `vendor` - Vendors
- `mcNumber` or `mc` - MC Numbers
- Any other Prisma model name (camelCase)

### Method 3: Using Prisma Studio (For Updates Only)

If you need to manually update records in Prisma Studio:

1. **To Soft Delete**: Instead of using the delete button, edit the record:
   - Set `deletedAt` to the current timestamp (or click the calendar and select "Now")
   - If the model has `isActive`, set it to `false`
   - Save the record

2. **To Restore**: Edit the record:
   - Set `deletedAt` to `null`
   - If the model has `isActive`, set it to `true`
   - Save the record

**Important**: Do NOT use the red "Delete" button in Prisma Studio - it attempts a hard delete and will fail due to foreign key constraints.

### Method 4: Direct Prisma Query (For Developers)

If you need to delete records programmatically:

```typescript
import { prisma } from '@/lib/prisma';

// Soft delete a single record
await prisma.driver.update({
  where: { id: 'driver-id' },
  data: {
    deletedAt: new Date(),
    isActive: false, // if model has this field
  },
});

// Soft delete multiple records
await prisma.driver.updateMany({
  where: {
    id: { in: ['id1', 'id2', 'id3'] },
    deletedAt: null, // Only delete records that aren't already deleted
  },
  data: {
    deletedAt: new Date(),
    isActive: false,
  },
});
```

## Understanding Soft Deletes

### How Soft Deletes Work

When a record is soft-deleted:
1. The record remains in the database
2. `deletedAt` is set to the current timestamp
3. `isActive` is set to `false` (if the model has this field)
4. The application filters out soft-deleted records in queries (by checking `deletedAt: null`)

### Query Behavior

The application automatically filters soft-deleted records:

```typescript
// This query only returns non-deleted records
const activeDrivers = await prisma.driver.findMany({
  where: {
    companyId: 'company-id',
    deletedAt: null, // Filter out soft-deleted records
  },
});
```

### Restoring Soft-Deleted Records

To restore a soft-deleted record, simply set `deletedAt` back to `null`:

**Using Prisma Studio:**
- Edit the record
- Set `deletedAt` to `null`
- Save

**Using the script:**
Currently not supported - use Prisma Studio or direct query.

**Using direct query:**
```typescript
await prisma.driver.update({
  where: { id: 'driver-id' },
  data: {
    deletedAt: null,
    isActive: true,
  },
});
```

## Foreign Key Constraints

The database has foreign key constraints that prevent deletion if related records exist:

- **ON DELETE RESTRICT**: Prevents deletion if child records exist
- **ON DELETE CASCADE**: Automatically deletes child records when parent is deleted
- **ON DELETE SET NULL**: Sets foreign key to null when parent is deleted

**Common constraint issues:**
- Cannot delete a `Driver` if they have active `Load`s assigned
- Cannot delete a `Customer` if they have active `Invoice`s
- Cannot delete a `Truck` if it has active `Load`s assigned

**Solution**: Delete or reassign related records first, or use soft deletes (which don't violate constraints).

## Troubleshooting

### Error: "Foreign key constraint violation"

This means you're trying to delete a record that has related records. Options:
1. Use soft delete instead (recommended)
2. Delete related records first
3. Reassign related records to another entity

### Error: "Record not found"

The record may already be soft-deleted. Check:
```typescript
const record = await prisma.model.findFirst({
  where: { id: 'record-id' },
  // Don't filter deletedAt - we want to see it
});
console.log(record?.deletedAt); // Will show deletion timestamp if deleted
```

### Records still showing after "deletion"

If records still appear in the UI:
1. Check that `deletedAt` was actually set (not null)
2. Verify the UI is filtering by `deletedAt: null`
3. Clear any caches (browser cache, React Query cache, etc.)

## Best Practices

1. **Always use soft deletes** - Never hard delete unless absolutely necessary
2. **Use the application UI** when possible - It handles all edge cases
3. **Check related records** before deleting - Understand the impact
4. **Test in development first** - Don't delete production data without testing
5. **Keep backups** - Always have recent database backups before bulk deletions
6. **Document deletions** - Keep track of why records were deleted

## Emergency: Hard Delete

If you absolutely need to hard delete a record (not recommended):

⚠️ **WARNING**: This will permanently remove the record and may break relationships.

1. First, manually delete or reassign all related records
2. Disable foreign key checks (if absolutely necessary)
3. Use `prisma.model.delete()` instead of `update()`

**Example (USE WITH EXTREME CAUTION):**
```typescript
// Only for emergency situations
await prisma.driver.delete({
  where: { id: 'driver-id' },
});
```

This is strongly discouraged and should only be done after careful consideration and backups.











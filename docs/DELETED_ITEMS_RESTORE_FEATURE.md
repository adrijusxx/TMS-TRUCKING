# Deleted Items Restore Feature

## Overview

This feature allows administrators to view and restore soft-deleted items across ALL entity types from the Admin Settings page. This addresses the issue where deleted items couldn't be restored or accessed.

## Supported Entity Types

- **Trucks** - Fleet trucks with VIN, make, model, year
- **Trailers** - Fleet trailers with VIN, make, model, year
- **Drivers** - Driver records with contact info
- **Loads** - Load records with pickup/delivery info
- **Invoices** - Invoice records with amounts and status
- **Customers** - Customer/broker records
- **Documents** - Uploaded documents
- **Tags** - System tags with colors
- **MC Numbers** - Motor Carrier numbers
- **Accidents** - Accident records
- **Maintenance Records** - Vehicle maintenance history
- **Fuel Transactions** - Fuel purchase records
- **Insurance Policies** - Insurance policy records

## Features

### 1. **View Deleted Items**
- Summary cards showing counts for all entity types
- Tabbed interface to browse by entity type
- Shows deletion date and relevant details per type
- Scrollable tab list for many entity types

### 2. **Restore Functionality**
- One-click restore for any deleted item
- Confirmation dialog before restoration
- Automatic refresh after restore

### 3. **Admin-Only Access**
- Requires ADMIN or SUPER_ADMIN role
- Located in Settings → Data Management → Deleted Items

## Implementation

### Files Created

1. **`lib/services/RestoreService.ts`**
   - Service class for restore operations
   - Methods: `restoreTruck()`, `restoreTrailer()`, `restoreDriver()`
   - Methods: `getDeletedTrucks()`, `getDeletedTrailers()`, `getDeletedDrivers()`
   - Method: `getDeletedItemsSummary()`

2. **`app/api/admin/restore/route.ts`**
   - POST endpoint: `/api/admin/restore`
   - Body: `{ entityType: 'truck'|'trailer'|'driver', entityId: string }`
   - Returns: `{ success: boolean, error?: string }`

3. **`app/api/admin/deleted-items/route.ts`**
   - GET endpoint: `/api/admin/deleted-items?type=truck|trailer|driver|summary`
   - Returns deleted items or summary counts

4. **`components/settings/categories/DeletedItemsCategory.tsx`**
   - Main UI component with tabs for each entity type
   - Summary cards, item lists, restore buttons

### Files Modified

1. **`lib/config/settings-navigation.ts`**
   - Added "Deleted Items" to Data Management category
   - Icon: `RotateCcw`

2. **`app/dashboard/settings/admin/page.tsx`**
   - Added `deleted-items` tab mapping
   - Added `DeletedItemsCategory` to render switch

## Usage

1. Navigate to **Settings** → **Data Management** → **Deleted Items**
2. View summary counts at the top
3. Select tab (Trucks/Trailers/Drivers) to see deleted items
4. Click **Restore** button on any item to restore it
5. Confirm the restore action

## Data Flow

```
User clicks Restore
  ↓
POST /api/admin/restore
  ↓
RestoreService.restoreTruck/Trailer/Driver()
  ↓
Prisma: UPDATE ... SET deletedAt = NULL
  ↓
Success response
  ↓
UI refreshes list
```

## Security

- **Permission Check**: `admin:manage` required
- **Authentication**: Session required
- **Company Isolation**: Only shows deleted items for user's company

## Audit History Feature

A companion feature in the same Data Management section that shows all system activity:

### Location
Settings → Data Management → Audit History

### Features
- **Summary cards**: Total actions, Created, Updated, Deleted counts
- **Filters**: By entity type (loads, trucks, etc.), action type, and entity ID
- **Activity log**: Shows all changes with user name, timestamp, and details
- **Pagination**: For large audit trails

### Data Shown
- Action type (CREATE, UPDATE, DELETE)
- Entity type and ID
- User who made the change
- Timestamp
- IP address (if available)
- Changed fields (if logged)

---

## Future Enhancements

Potential improvements:
- Bulk restore (select multiple items)
- Permanent delete option (hard delete)
- Filter/search deleted items by date range
- Export deleted items list
- Restore with conflict resolution (if truck number/VIN conflicts)
- More detailed change diffs in audit log

## Related Issues

This feature solves:
- ✅ Cannot restore deleted trucks/trailers/drivers
- ✅ No visibility into what was deleted
- ✅ 124 deleted trucks with samsaraId causing confusion in queue counts
- ✅ No audit trail visibility (now have Audit History)
- ✅ Cannot see who deleted/edited data (now have user tracking)


# MC Functionality Implementation Progress

## Overview
Comprehensive review and fix of MC (Motor Carrier) number functionality across the TMS codebase.

## Requirements Summary
1. **Admin Users**: 
   - Can view ALL data (no MC filter)
   - Can filter by specific MC(s) (one or multiple)
   - Can choose MC when creating records

2. **Employee Users**:
   - See combined data from all their assigned MCs (from `mcAccess` array)
   - Cannot choose MC when creating - records go to their default MC (`user.mcNumberId`)
   - Cannot see data from MCs not in their `mcAccess` array

## Completed Tasks ✓

### Phase 1: Core MC State Management ✓
1. **McStateManager.ts** - COMPLETED
   - Simplified view modes to: `'all'`, `'filtered'`, `'assigned'`
   - Admin 'all' mode: No MC filtering
   - Admin 'filtered' mode: Filter by selected MC(s)
   - Employee 'assigned' mode: Always show all their accessible MCs
   - Fixed `getMcState()` to properly handle all scenarios
   - Updated `buildMcNumberWhereClause()` to return proper filters
   - Updated `buildMultiMcNumberWhereClause()` for backward compatibility

2. **mc-number-filter.ts** - COMPLETED
   - Updated to use new McStateManager logic
   - Simplified `buildMcNumberWhereClause()` to delegate to McStateManager
   - Added deprecation notes for `buildMultiMcNumberWhereClause()`

3. **role-data-filter.ts** - COMPLETED
   - Removed MC filtering from role filter functions
   - MC filtering now applied separately in API routes
   - Updated all filter functions: `getLoadFilter`, `getDriverFilter`, `getTruckFilter`, etc.
   - Added documentation explaining separation of concerns

### Phase 2: API Route Fixes (In Progress)

#### GET Routes Fixed ✓
1. **app/api/loads/route.ts** - GET method
   - Simplified MC filtering to use `buildMcNumberWhereClause()`
   - Properly merges MC filter with role filter
   - Removed admin "viewingAll" special case logic

2. **app/api/drivers/route.ts** - GET method
   - Simplified MC filtering to use `buildMcNumberWhereClause()`
   - Properly merges MC filter with role filter
   - Removed admin special case logic

3. **app/api/trucks/route.ts** - GET method
   - Simplified MC filtering to use `buildMcNumberWhereClause()`
   - Properly merges MC filter with role filter
   - Removed admin special case logic

#### POST Routes Fixed ✓
1. **app/api/loads/route.ts** - POST method
   - Implemented admin-only MC selection rule
   - Employees use their default MC (`user.mcNumberId`)
   - Validates admin MC selection against permissions

2. **app/api/drivers/route.ts** - POST method
   - Implemented admin-only MC selection rule
   - Employees use their default MC
   - Sets `mcAccess` array for new driver users
   - Syncs MC between User and Driver records

3. **app/api/trucks/route.ts** - POST method
   - Implemented admin-only MC selection rule
   - Employees use their default MC
   - Assigns `mcNumberId` to new trucks

## Remaining Tasks

### Phase 2: API Route Fixes (Continued)

#### GET Routes To Fix (23 remaining)
- app/api/trailers/route.ts
- app/api/customers/route.ts
- app/api/settlements/route.ts
- app/api/invoices/route.ts
- app/api/dispatch/board/route.ts
- app/api/loads/stats/route.ts
- app/api/analytics/dashboard/route.ts
- app/api/analytics/revenue-forecast/route.ts
- app/api/analytics/empty-miles/route.ts
- app/api/analytics/fuel/route.ts
- app/api/analytics/drivers/performance/route.ts
- app/api/analytics/revenue/route.ts
- app/api/analytics/profitability/route.ts
- app/api/dashboard/load-status-distribution/route.ts
- app/api/customers/stats/route.ts
- app/api/fleet-board/route.ts
- app/api/dashboard/truck-performance/route.ts
- app/api/dashboard/revenue-trends/route.ts
- app/api/dashboard/driver-performance/route.ts
- app/api/dashboard/customer-performance/route.ts
- app/api/dashboard/deadlines/route.ts
- app/api/import-export/[entity]/route.ts
- app/api/search/route.ts

**Pattern to Apply:**
```typescript
// Replace old logic:
const isAdmin = ...;
const viewingAll = isAdmin;
let mcWhere: ...;
if (!viewingAll) { ... } else { ... }

// With new logic:
const mcWhere = await buildMcNumberWhereClause(session, request);

// And merge filters:
const where: any = {
  ...mcWhere,
  ...roleFilter,
  deletedAt: null,
};
```

#### POST Routes To Fix (Remaining)
- app/api/trailers/route.ts
- app/api/customers/route.ts
- All other POST endpoints creating MC-assigned data

**Pattern to Apply:**
```typescript
// Determine MC number assignment
const isAdmin = session.user.role === 'ADMIN';
let assignedMcNumberId: string | null = null;

if (isAdmin && validated.mcNumberId) {
  // Admin provided mcNumberId - validate and use it
  assignedMcNumberId = validated.mcNumberId;
} else {
  // Employee or admin without explicit mcNumberId - use user's default MC
  assignedMcNumberId = (session.user as any).mcNumberId || null;
}

// Then use assignedMcNumberId in create/update
```

### Phase 3: UI Component Fixes (Pending)
1. Create unified `McSelector.tsx` component
2. Update dashboard header to show MC selector
3. Add MC indicators to all list components

### Phase 4: User Management API (Pending)
1. Verify `app/api/settings/users/[id]/route.ts`
2. Ensure proper validation of `mcAccess` array
3. Sync MC between User and Driver records

### Phase 5: Testing (Pending)
1. Test admin scenarios
2. Test employee scenarios
3. Verify no data leakage

### Phase 6: Documentation (Pending)
1. Update `.cursorrules`
2. Add code comments
3. Update README if needed

## Key Changes Made

### McStateManager View Modes
- **Before**: `'current'`, `'all'`, `'multi'` (confusing)
- **After**: `'all'`, `'filtered'`, `'assigned'` (clear)

### MC Filtering Logic
- **Before**: Complex logic with admin special cases in every route
- **After**: Centralized in `McStateManager.buildMcNumberWhereClause()`

### Data Creation Rules
- **Before**: Unclear who can assign MC
- **After**: Only admins can choose MC; employees use their default

### Role vs MC Filtering
- **Before**: Mixed together in role filter functions
- **After**: Separated - role filter handles role-based access, MC filter applied separately

## Testing Checklist

### Admin Tests
- [ ] Admin can view all data without MC filter
- [ ] Admin can filter by single MC
- [ ] Admin can filter by multiple MCs
- [ ] Admin can create record and assign to specific MC
- [ ] Admin can update user's MC access

### Employee Tests
- [ ] Employee with single MC access sees only their MC data
- [ ] Employee with multiple MC access sees combined data from all assigned MCs
- [ ] Employee creates record - goes to their default MC
- [ ] Employee cannot see data from MCs not in their `mcAccess`
- [ ] Employee cannot change MC assignment on records

## Notes
- All changes maintain backward compatibility
- No database schema changes required
- Existing data remains valid
- Changes are security-critical - thorough testing required


# Rework MC Number View Logic + Mandatory MC Assignments

## Problem Analysis

The current implementation has:
- MultiMcSelector embedded inside CompanySwitcher dropdown (confusing UX)
- Scattered state management (cookies, session, URL params, local state)
- Complex selection logic that's hard to follow
- "Switch to MC Number" section appearing even in multi-select mode
- MC number assignments are optional for drivers, dispatchers, employees, trucks, and trailers
- MC numbers stored as strings instead of relations, making validation difficult

## Solution

1. **Unified MC Selection Interface**: Create a unified interface in CompanySwitcher with checkboxes for multi-select
2. **Mandatory MC Assignments**: Make MC number assignment mandatory for all entities (drivers, dispatchers, employees, trucks, trailers)
3. **Schema Improvements**: Change from optional string fields to required relation fields (mcNumberId)

## Implementation Plan

### Phase 1: MC Number View UI Rework

#### 1.1 Refactor CompanySwitcher Component
**File**: `components/layout/CompanySwitcher.tsx`

- Remove MultiMcSelector integration
- Add checkbox support directly in the dropdown
- Implement unified selection logic:
  - Single click on unchecked MC = switch to that MC only (clears multi-select)
  - Checkbox toggle = add/remove from multi-select
  - "Select All" option for multi-select
  - Clear visual indicators for selected state
- Simplify state management:
  - Use McStateManager for cookie/session state
  - Single source of truth for current view mode
  - Remove redundant cookie management

#### 1.2 Simplify MultiMcSelector Component
**File**: `components/mc-numbers/MultiMcSelector.tsx`

- Keep as standalone component for use in MC Numbers page
- Remove cookie management (use McStateManager)
- Simplify API integration
- Better error handling

#### 1.3 State Management Improvements
**Files**: 
- `lib/managers/McStateManager.ts` (verify/update if needed)
- `components/layout/CompanySwitcher.tsx`

- Centralize state in McStateManager
- Remove manual cookie manipulation from components
- Use URL params as primary state indicator
- Session updates only when necessary

#### 1.4 UI/UX Improvements
**File**: `components/layout/CompanySwitcher.tsx`

- Add visual indicators:
  - Checkmark for selected MCs
  - Badge showing count when in multi-select mode
  - Clear "Current" vs "Multi-Select" mode indicators
- Improve dropdown layout:
  - Group "View Mode" options at top
  - MC list with checkboxes below
  - Action buttons at bottom
- Better loading states and error handling

### Phase 2: Mandatory MC Number Assignments

#### 2.1 Schema Changes
**File**: `prisma/schema.prisma`

**Driver Model** (line ~582):
- Change `mcNumber String?` to `mcNumberId String` (required)
- Add relation: `mcNumber McNumber @relation(fields: [mcNumberId], references: [id])`
- Remove old `mcNumber` string field

**Truck Model** (line ~843):
- Change `mcNumber String?` to `mcNumberId String` (required)
- Add relation: `mcNumber McNumber @relation(fields: [mcNumberId], references: [id])`
- Remove old `mcNumber` string field

**Trailer Model** (line ~932):
- Change `mcNumber String?` to `mcNumberId String` (required)
- Add relation: `mcNumber McNumber @relation(fields: [mcNumberId], references: [id])`
- Remove old `mcNumber` string field

**User Model** (line ~24):
- Change `mcNumberId String?` to `mcNumberId String` (required)
- Keep relation as-is

**Add indexes**:
- `@@index([mcNumberId])` for Driver, Truck, Trailer models

#### 2.2 Database Migration
**File**: `prisma/migrations/[timestamp]_make_mc_number_mandatory/migration.sql`

- Add `mcNumberId` columns (required, no default)
- Migrate existing `mcNumber` string values to `mcNumberId` relations
- Add foreign key constraints
- Drop old `mcNumber` string columns
- Add indexes

**Migration Strategy**:
1. Add new `mcNumberId` columns as nullable first
2. Migrate data: Find McNumber records by `number` field matching existing `mcNumber` strings
3. Set `mcNumberId` values
4. Make columns required (NOT NULL)
5. Add foreign keys
6. Drop old `mcNumber` columns

#### 2.3 Update Validation Schemas

**File**: `lib/validations/driver.ts`
- Add `mcNumberId: z.string().min(1, 'MC number is required')` to createDriverSchema
- Add to updateDriverSchema

**File**: `lib/validations/truck.ts`
- Add `mcNumberId: z.string().min(1, 'MC number is required')` to createTruckSchema
- Add to updateTruckSchema

**File**: `lib/validations/trailer.ts` (create if doesn't exist)
- Add `mcNumberId: z.string().min(1, 'MC number is required')` to createTrailerSchema
- Add to updateTrailerSchema

**File**: `lib/validations/user.ts` (create if doesn't exist)
- Add `mcNumberId: z.string().min(1, 'MC number is required')` for dispatchers/employees
- Make optional for DRIVER role (they get MC from Driver record)

#### 2.4 Update Create/Edit Forms

**File**: `components/drivers/CreateDriverForm.tsx`
- Add MC Number selector dropdown (required field)
- Fetch available MC numbers for company
- Update form submission to include `mcNumberId`
- Show validation error if MC not selected

**File**: `components/drivers/EditDriverForm.tsx` (if exists)
- Add MC Number selector dropdown
- Pre-select current MC number
- Update form submission

**File**: `components/trucks/CreateTruckForm.tsx`
- Add MC Number selector dropdown (required field)
- Fetch available MC numbers for company
- Update form submission to include `mcNumberId`
- Show validation error if MC not selected

**File**: `components/trucks/EditTruckForm.tsx` (if exists)
- Add MC Number selector dropdown
- Pre-select current MC number
- Update form submission

**File**: `components/trailers/CreateTrailerForm.tsx` (if exists)
- Add MC Number selector dropdown (required field)
- Fetch available MC numbers for company
- Update form submission to include `mcNumberId`
- Show validation error if MC not selected

**File**: `components/trailers/EditTrailerForm.tsx` (if exists)
- Add MC Number selector dropdown
- Pre-select current MC number
- Update form submission

**File**: `components/settings/UserManagement.tsx` or similar (for dispatchers/employees)
- Add MC Number selector dropdown (required for DISPATCHER, ACCOUNTANT roles)
- Make optional for ADMIN role
- Update form submission

#### 2.5 Create MC Number Selector Component
**File**: `components/mc-numbers/McNumberSelector.tsx` (new)

- Reusable dropdown component for selecting MC numbers
- Props:
  - `value?: string` - current selected MC number ID
  - `onChange: (mcNumberId: string) => void`
  - `required?: boolean`
  - `companyId?: string` - optional, defaults to session company
- Fetches MC numbers from `/api/mc-numbers`
- Shows MC number and company name
- Handles loading and error states

#### 2.6 Update API Endpoints

**File**: `app/api/drivers/route.ts`
- POST: Validate `mcNumberId` is provided and exists
- Verify MC number belongs to user's company
- Update to use `mcNumberId` instead of `mcNumber` string

**File**: `app/api/trucks/route.ts`
- POST: Validate `mcNumberId` is provided and exists
- Verify MC number belongs to user's company
- Update to use `mcNumberId` instead of `mcNumber` string

**File**: `app/api/trailers/route.ts` (if exists)
- POST: Validate `mcNumberId` is provided and exists
- Verify MC number belongs to user's company
- Update to use `mcNumberId` instead of `mcNumber` string

**File**: `app/api/users/route.ts` or similar
- POST/PATCH: Validate `mcNumberId` for dispatchers/employees
- Verify MC number belongs to user's company
- Make optional for ADMIN role

#### 2.7 Update Import/Export Logic

**File**: `app/api/import-export/[entity]/route.ts`
- Update driver import to require MC number
- Update truck import to require MC number
- Update trailer import to require MC number
- Map MC number strings to `mcNumberId` during import
- Validate MC numbers exist before creating records

#### 2.8 Update Filtering Logic

**Files**: Various API routes that filter by MC number
- Update to use `mcNumberId` relation instead of `mcNumber` string
- Update `McStateManager.buildMcNumberWhereClause` if needed
- Update queries to use `mcNumberId` joins

## Key Changes Summary

### UI Changes
1. **Unified Selection Interface**
   - Checkboxes for each MC number
   - Click MC name = switch to single MC (clears multi-select)
   - Toggle checkbox = add/remove from multi-select
   - "Select All" / "Deselect All" for bulk operations

2. **State Management**
   - Single source of truth via McStateManager
   - URL params: `?mc=all`, `?mc=<mcId>`, `?mc=multi`
   - Cookies managed by McStateManager only
   - Session updates on actual switches

3. **Visual Clarity**
   - Show current mode in button text
   - Display selected count in multi-select mode
   - Clear visual distinction between selected/unselected
   - Loading states during switches

### Schema Changes
1. **Mandatory MC Assignments**
   - Drivers: `mcNumberId String` (required)
   - Trucks: `mcNumberId String` (required)
   - Trailers: `mcNumberId String` (required)
   - Users (dispatchers/employees): `mcNumberId String` (required, optional for ADMIN)

2. **Relation Instead of String**
   - All entities use `mcNumberId` relation to `McNumber` model
   - Better data integrity and validation
   - Easier to query and filter

### Validation Changes
1. **Required Fields**
   - All create/edit forms require MC number selection
   - API endpoints validate MC number exists and belongs to company
   - Import processes validate MC numbers before creating records

## Testing Checklist

### MC Number View
- [ ] Switch to single MC number
- [ ] Select multiple MC numbers
- [ ] Switch from multi-select to single MC
- [ ] Switch from single MC to multi-select
- [ ] "Select All" / "Deselect All" functionality
- [ ] State persists across page refreshes
- [ ] URL params update correctly
- [ ] API calls work correctly
- [ ] Error handling works
- [ ] Loading states display properly

### Mandatory MC Assignments
- [ ] Driver creation requires MC number
- [ ] Driver edit requires MC number
- [ ] Truck creation requires MC number
- [ ] Truck edit requires MC number
- [ ] Trailer creation requires MC number
- [ ] Trailer edit requires MC number
- [ ] Dispatcher/Employee creation requires MC number
- [ ] Dispatcher/Employee edit requires MC number
- [ ] MC number selector shows only company's MC numbers
- [ ] Validation errors show when MC not selected
- [ ] API endpoints reject requests without MC number
- [ ] Import processes validate MC numbers
- [ ] Database migration runs successfully
- [ ] Existing data migrates correctly

## Migration Notes

1. **Data Migration**: Existing records with `mcNumber` strings must be matched to `McNumber` records
2. **Backward Compatibility**: Consider keeping old fields temporarily during migration
3. **Validation**: Ensure all existing records have valid MC numbers before making fields required
4. **Rollback Plan**: Keep migration reversible in case of issues



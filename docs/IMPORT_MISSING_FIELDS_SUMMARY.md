# Import Missing Fields - Critical Summary

## ⚠️ Critical Warning

**197 required database fields are NOT being imported from CSV/Excel files.**

This means when users click "Import" buttons, some required data is missing, which could cause:
- ❌ **Import failures** - Database will reject records
- ❌ **NULL constraint errors** - Required fields without defaults will fail
- ❌ **Data integrity issues** - Missing critical information
- ❌ **Application errors** - Features that depend on these fields will break

## Most Critical Missing Fields

### 🔴 Loads Import - CRITICAL MISSING FIELDS

These fields are **REQUIRED** by the database but **NOT imported**:

1. **`customerId`** (String, Required)
   - **Impact**: Import will FAIL - cannot create load without customer
   - **What breaks**: Load creation, customer association
   - **Fix needed**: Import customer ID or name and resolve to ID

2. **`equipmentType`** (Enum, Required, No Default)
   - **Impact**: Import will FAIL - enum field without default
   - **What breaks**: Load creation, equipment type validation
   - **Fix needed**: Import equipment type or set default value

3. **`weight`** (Float, Required)
   - **Impact**: Import will FAIL - numeric field without default
   - **What breaks**: Load creation, weight calculations
   - **Fix needed**: Import weight from CSV or set default

4. **`revenue`** (Float, Required)
   - **Impact**: Import will FAIL - numeric field without default
   - **What breaks**: Load creation, financial calculations
   - **Fix needed**: Import revenue from CSV or set default

### 🟡 Loads Import - Fields with Defaults (Less Critical)

These have defaults but should still be imported for accuracy:

- `loadType` - Default: FTL (but should import actual value)
- `hazmat` - Default: false (but should import if true)
- `fuelAdvance` - Default: 0 (but should import actual value)
- `expenses` - Default: 0 (but should import actual value)
- `accountingSyncStatus` - Default: NOT_SYNCED (but should import if available)

### 🔴 Trucks Import - CRITICAL MISSING FIELDS

1. **`equipmentType`** (Enum, Required, No Default)
   - **Impact**: Import will FAIL
   - **What breaks**: Truck creation, equipment validation
   - **Fix needed**: Import equipment type

2. **`capacity`** (Float, Required)
   - **Impact**: Import will FAIL
   - **What breaks**: Truck creation, capacity calculations
   - **Fix needed**: Import capacity

3. **`registrationExpiry`** (DateTime, Required)
   - **Impact**: Import will FAIL
   - **What breaks**: Truck creation, registration tracking
   - **Fix needed**: Import registration expiry date

4. **`insuranceExpiry`** (DateTime, Required)
   - **Impact**: Import will FAIL
   - **What breaks**: Truck creation, insurance tracking
   - **Fix needed**: Import insurance expiry date

5. **`inspectionExpiry`** (DateTime, Required)
   - **Impact**: Import will FAIL
   - **What breaks**: Truck creation, inspection tracking
   - **Fix needed**: Import inspection expiry date

### 🔴 Trailers Import - CRITICAL MISSING FIELDS

1. **`equipmentType`** (Enum, Required, No Default)
   - **Impact**: Import will FAIL
   - **What breaks**: Trailer creation
   - **Fix needed**: Import equipment type

2. **`capacity`** (Float, Required)
   - **Impact**: Import will FAIL
   - **What breaks**: Trailer creation
   - **Fix needed**: Import capacity

3. **`registrationExpiry`** (DateTime, Required)
   - **Impact**: Import will FAIL
   - **What breaks**: Trailer creation
   - **Fix needed**: Import registration expiry date

4. **`insuranceExpiry`** (DateTime, Required)
   - **Impact**: Import will FAIL
   - **What breaks**: Trailer creation
   - **Fix needed**: Import insurance expiry date

5. **`inspectionExpiry`** (DateTime, Required)
   - **Impact**: Import will FAIL
   - **What breaks**: Trailer creation
   - **Fix needed**: Import inspection expiry date

### 🔴 Drivers Import - CRITICAL MISSING FIELDS

1. **`payType`** (Enum, Required, Default: PER_MILE)
   - **Impact**: May work with default, but should import actual value
   - **What breaks**: Pay calculations if wrong type
   - **Fix needed**: Import pay type

2. **`payRate`** (Float, Required)
   - **Impact**: Import will FAIL
   - **What breaks**: Driver creation, pay calculations
   - **Fix needed**: Import pay rate

3. **`mcNumberId`** (String, Required)
   - **Impact**: Import will FAIL
   - **What breaks**: Driver creation, MC number association
   - **Fix needed**: Import MC number and resolve to ID

### 🔴 Customers Import - CRITICAL MISSING FIELDS

1. **`address`** (String, Required)
   - **Impact**: Import will FAIL
   - **What breaks**: Customer creation
   - **Fix needed**: Import address

2. **`city`** (String, Required)
   - **Impact**: Import will FAIL
   - **What breaks**: Customer creation
   - **Fix needed**: Import city

3. **`state`** (String, Required)
   - **Impact**: Import will FAIL
   - **What breaks**: Customer creation
   - **Fix needed**: Import state

4. **`zip`** (String, Required)
   - **Impact**: Import will FAIL
   - **What breaks**: Customer creation
   - **Fix needed**: Import zip code

5. **`phone`** (String, Required)
   - **Impact**: Import will FAIL
   - **What breaks**: Customer creation
   - **Fix needed**: Import phone number

6. **`email`** (String, Required)
   - **Impact**: Import will FAIL
   - **What breaks**: Customer creation
   - **Fix needed**: Import email

## What Happens When These Fields Are Missing?

### Scenario 1: User Imports Loads CSV
1. User clicks "Import" button
2. CSV file is uploaded
3. System tries to create Load records
4. **FAILS** because `customerId` is missing
5. **Error**: "Cannot create Load: customerId is required"
6. Import fails completely or creates partial/invalid data

### Scenario 2: User Imports Trucks CSV
1. User clicks "Import" button
2. CSV file is uploaded
3. System tries to create Truck records
4. **FAILS** because `equipmentType` is missing
5. **Error**: "Cannot create Truck: equipmentType is required"
6. Import fails

### Scenario 3: User Imports Drivers CSV
1. User clicks "Import" button
2. CSV file is uploaded
3. System tries to create Driver records
4. **FAILS** because `payRate` is missing
5. **Error**: "Cannot create Driver: payRate is required"
6. Import fails

## How to Fix

### Option 1: Add Missing Fields to Import Mapping

Update `app/api/import-export/[entity]/route.ts` to import these fields:

```typescript
// Example for Loads
const customerId = getValue(row, ['customer_id', 'Customer ID', 'customerId']);
const equipmentType = getValue(row, ['equipment_type', 'Equipment Type', 'equipmentType']);
const weight = parseFloat(getValue(row, ['weight', 'Weight']) || '0');
const revenue = parseFloat(getValue(row, ['revenue', 'Revenue']) || '0');
```

### Option 2: Set Default Values

For fields with defaults, ensure defaults are applied:

```typescript
const loadType = getValue(row, ['load_type', 'Load Type']) || 'FTL';
const hazmat = getValue(row, ['hazmat', 'Hazmat']) === 'true' || false;
```

### Option 3: Resolve IDs from Names

For ID fields, resolve from names:

```typescript
// Resolve customer ID from customer name
const customerName = getValue(row, ['customer_name', 'Customer Name']);
const customer = await prisma.customer.findFirst({
  where: { name: customerName, companyId }
});
const customerId = customer?.id;
```

## Priority Actions

### 🔴 Immediate (Import Will Fail)
1. Add `customerId` to Loads import
2. Add `equipmentType` to Loads/Trucks/Trailers imports
3. Add `weight` and `revenue` to Loads import
4. Add `payRate` to Drivers import
5. Add address fields to Customers import

### 🟡 High Priority (Data Accuracy)
1. Add `loadType` to Loads import
2. Add `hazmat` to Loads import
3. Add financial fields to Loads import
4. Add expiry dates to Trucks/Trailers imports

### 🟢 Medium Priority (Nice to Have)
1. Add optional fields for better data completeness
2. Add validation for enum values
3. Add better error messages for missing fields

## Full Report

See `docs/import-mapping-audit-report.md` for complete details on all 197 missing fields.

## Next Steps

1. **Review the full audit report** - `docs/import-mapping-audit-report.md`
2. **Prioritize critical fields** - Start with fields that will cause import failures
3. **Update import mappings** - Add missing field mappings to import code
4. **Test imports** - Verify imports work with the new mappings
5. **Add validation** - Add checks to warn users about missing required fields before import




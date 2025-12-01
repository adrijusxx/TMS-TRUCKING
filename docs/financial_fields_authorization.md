# Financial Fields Authorization Implementation

**Date:** 2025-01-27  
**Status:** ✅ **IMPLEMENTED**

---

## Overview

Added role-based authorization checks to protect financial/payroll fields. Only ADMIN and ACCOUNTANT roles can WRITE/UPDATE these fields. DISPATCHER role has READ-ONLY access.

---

## Protected Fields

The following driver fields are considered "financial" and require ADMIN/ACCOUNTANT to modify:

- `payType` - Pay method (CPM, Percentage, Flat)
- `payRate` - Pay rate
- `perDiem` - Per diem (cents per mile tax-free)
- `escrowTargetAmount` - Escrow target amount
- `escrowDeductionPerWeek` - Weekly escrow deduction
- `escrowBalance` - Current escrow balance (read-only, but protected)
- `driverTariff` - Driver tariff (can be manually set)

---

## Authorization Rules

### System Configuration (`/api/system-config`)
- **GET**: All authenticated users can read
- **PATCH**: Only ADMIN or ACCOUNTANT can update

### Driver Financial Fields (`/api/drivers/[id]`)
- **GET**: All authenticated users can read (with role-based filtering)
- **PATCH**: 
  - ADMIN/ACCOUNTANT: Can update all fields including financial
  - DISPATCHER: Can update non-financial fields only
  - Other roles: Based on existing permission checks

### Bulk Pay Update (`/api/drivers/bulk-update-pay`)
- **POST**: Only ADMIN or ACCOUNTANT can update pay rates in bulk

---

## Implementation Details

### Helper Functions (`lib/utils/financial-access.ts`)

```typescript
// Check if user can write financial fields
canWriteFinancialFields(role: UserRole): boolean

// Check if user can read financial fields
canReadFinancialFields(role: UserRole): boolean

// Check if a field is financial
isFinancialField(field: string): boolean

// Check if update data contains financial fields
containsFinancialFields(updateData: Record<string, any>): boolean

// Extract financial fields from update data
extractFinancialFields(updateData: Record<string, any>): Record<string, any>

// Remove financial fields from update data
removeFinancialFields(updateData: Record<string, any>): Record<string, any>
```

### API Endpoint Updates

#### `app/api/system-config/route.ts`
- **PATCH**: Added explicit role check for ADMIN or ACCOUNTANT
- Returns 403 with clear error message if unauthorized

#### `app/api/drivers/[id]/route.ts`
- **PATCH**: Checks if update contains financial fields
- If financial fields present and user is not ADMIN/ACCOUNTANT:
  - Returns 403 with list of restricted fields
  - Prevents update from proceeding

#### `app/api/drivers/bulk-update-pay/route.ts`
- **POST**: Added explicit role check for ADMIN or ACCOUNTANT
- Returns 403 if unauthorized

### Frontend Updates

#### `components/drivers/DriverEditTabs/DriverFinancialsTab.tsx`
- Added role check using `useSession()`
- If role is DISPATCHER:
  - Shows read-only alert banner
  - Disables all form inputs
  - Prevents form submission
  - All fields are `disabled` and `readOnly`

---

## Error Responses

### System Config Update (Unauthorized)
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Only administrators and accountants can update system configuration"
  }
}
```

### Driver Financial Fields Update (Unauthorized)
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Only administrators and accountants can modify financial/payroll fields",
    "restrictedFields": ["payType", "payRate", "perDiem"]
  }
}
```

### Bulk Pay Update (Unauthorized)
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Only administrators and accountants can update driver pay rates"
  }
}
```

---

## Testing Checklist

- [x] System config PATCH endpoint checks role
- [x] Driver PATCH endpoint detects financial fields
- [x] Driver PATCH endpoint blocks non-admin/accountant from updating financial fields
- [x] Driver PATCH endpoint allows dispatchers to update non-financial fields
- [x] Bulk pay update endpoint checks role
- [x] Driver Financials tab shows read-only for dispatchers
- [x] Driver Financials tab disables all inputs for dispatchers
- [x] Error messages are clear and informative

---

## Usage Examples

### Allowing Dispatcher to Update Non-Financial Fields
```typescript
// Dispatcher can update:
- status
- currentTruckId
- homeTerminal
- notes
- etc.

// Dispatcher CANNOT update:
- payType
- payRate
- perDiem
- escrowTargetAmount
- escrowDeductionPerWeek
```

### Admin/Accountant Full Access
```typescript
// Admin/Accountant can update:
- All fields including financial
- System configuration
- Bulk pay updates
```

---

**Implementation Status:** ✅ **COMPLETE**






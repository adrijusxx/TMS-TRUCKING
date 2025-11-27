# Driver Pay Logic Implementation Summary

**Date:** 2025-01-27  
**Status:** ✅ **IMPLEMENTED** - Strict Driver Pay Hierarchy

---

## Implementation Complete

### File: `lib/managers/SettlementManager.ts`

All driver pay logic follows the **STRICT hierarchy** as specified:

---

## 1. Gross Pay Calculation ✅

### CPM Method (PER_MILE)
```typescript
// STRICT: CPM = (loadedMiles + emptyMiles) * Rate
const loadedMiles = load.loadedMiles || 0;
const emptyMiles = load.emptyMiles || 0;
const totalMiles = loadedMiles + emptyMiles;
if (totalMiles > 0) {
  grossPay += totalMiles * driver.payRate;
}
```

**Key Points:**
- ✅ Uses `loadedMiles + emptyMiles` explicitly (NOT `totalMiles`)
- ✅ Only calculates if `totalMiles > 0`

### Percentage Method (PERCENTAGE)
```typescript
// STRICT: Percentage = (TotalInvoice - FuelSurcharge) * Percentage
// CRITICAL: Exclude Fuel Surcharge (FSC) from calculation
const baseAmount = invoiceTotal - fuelSurcharge;
grossPay += baseAmount * (driver.payRate / 100);
```

**Key Points:**
- ✅ Fetches invoice total for the load
- ✅ Identifies and excludes FUEL_SURCHARGE accessorials
- ✅ Calculates percentage on base amount (invoice - FSC)
- ✅ Falls back to load.revenue if no invoice exists

---

## 2. Additions ✅

### StopPay
- Source: `AccessorialCharge` with `chargeType === 'ADDITIONAL_STOP'`
- Status: Must be `APPROVED` or `BILLED`
- Added to `totalAdditions`

### DetentionPay
- Source: `AccessorialCharge` with `chargeType === 'DETENTION'`
- Status: Must be `APPROVED` or `BILLED`
- Includes detention hours and rate
- Added to `totalAdditions`

### Reimbursements (Tolls/Scales)
- Source: `LoadExpense` with `expenseType === 'TOLL'` or `'SCALE'`
- Status: Must be `APPROVED`
- Added to `totalAdditions`

**Calculation:**
```typescript
const netPay = grossPay + totalAdditions - totalDeductions - totalAdvances - negativeBalanceDeduction;
```

---

## 3. Deductions (STRICT Priority Order) ✅

### Priority 1: Advances (Fuel/Cash)
- **Fuel Advances**: From `FuelEntry` table (period-based)
- **Cash Advances**: From `DriverAdvance` table (via `advanceManager.getAdvancesForSettlement()`)
- Applied FIRST before any other deductions
- Stored in `totalAdvances` (separate from deductions array)

### Priority 2: Recurring Deductions
- **Types**: `INSURANCE`, `OCCUPATIONAL_ACCIDENT`, `FUEL_CARD_FEE`
- **Source**: `DeductionRule` table
- **Calculation Types**: FIXED, PERCENTAGE, PER_MILE
- Applied AFTER advances

### Priority 3: Garnishments/Escrow
- **Types**: `ESCROW`, `OTHER` (with notes indicating garnishment)
- **Source**: `DeductionRule` table
- **Calculation Types**: FIXED, PERCENTAGE, PER_MILE
- Applied LAST (after advances and recurring)

**Implementation:**
```typescript
// Priority 1: Advances (handled separately)
const advances = await this.advanceManager.getAdvancesForSettlement(...);
const totalAdvances = advances.reduce((sum, adv) => sum + adv.amount, 0);

// Priority 2 & 3: Recurring and Garnishments (handled in calculateDeductions)
const deductions = await this.calculateDeductions(...);
const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
```

---

## 4. Negative Balance Rule ✅

### Implementation
```typescript
// Calculate net pay
const netPay = grossPay + totalAdditions - totalDeductions - totalAdvances - negativeBalanceDeduction;

// CRITICAL: If netPay < 0, DO NOT throw error
if (netPay < 0) {
  // Create NegativeBalance record
  await prisma.driverNegativeBalance.create({
    data: {
      driverId,
      amount: Math.abs(netPay), // Store as positive amount
      originalSettlementId: settlement.id,
      notes: `Negative balance from settlement ${settlementNumber}. Will be applied to next week's settlement.`,
    },
  });
  
  // Store netPay as 0 in settlement (balance tracked separately)
  netPay: 0
}
```

### Automatic Application Next Week
```typescript
// Get previous negative balance (if any)
const previousNegativeBalance = await this.getPreviousNegativeBalance(driverId);
const negativeBalanceDeduction = previousNegativeBalance ? previousNegativeBalance.amount : 0;

// Apply to current settlement
const netPay = grossPay + totalAdditions - totalDeductions - totalAdvances - negativeBalanceDeduction;

// Mark as applied
if (previousNegativeBalance && netPay >= 0) {
  await prisma.driverNegativeBalance.update({
    where: { id: previousNegativeBalance.id },
    data: {
      isApplied: true,
      appliedSettlementId: settlement.id,
      appliedAt: new Date(),
    },
  });
}
```

**Key Points:**
- ✅ NO ERROR thrown when `netPay < 0`
- ✅ Creates `DriverNegativeBalance` record
- ✅ Links to original settlement
- ✅ Automatically applies to next settlement
- ✅ Marks as applied when balance is recovered

---

## Database Schema

### DriverNegativeBalance Model
```prisma
model DriverNegativeBalance {
  id       String @id @default(cuid())
  driverId String
  driver   Driver @relation(...)
  
  amount               Float  // Positive amount (negative in calculations)
  originalSettlementId String? // Settlement that created this balance
  appliedSettlementId  String? // Settlement where balance was applied
  appliedAt           DateTime?
  isApplied           Boolean @default(false)
  notes               String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## Settlement Calculation Flow

```
1. Fetch Driver & Loads
   ↓
2. Calculate Gross Pay
   ├─ CPM: (loadedMiles + emptyMiles) * Rate
   └─ Percentage: (Invoice - FSC) * Percentage
   ↓
3. Calculate Additions
   ├─ StopPay (ADDITIONAL_STOP accessorials)
   ├─ DetentionPay (DETENTION accessorials)
   └─ Reimbursements (TOLL/SCALE expenses)
   ↓
4. Calculate Deductions (Priority Order)
   ├─ Priority 1: Advances (Fuel/Cash)
   ├─ Priority 2: Recurring (Insurance, ELD)
   └─ Priority 3: Garnishments/Escrow
   ↓
5. Apply Previous Negative Balance (if any)
   ↓
6. Calculate Net Pay
   NetPay = GrossPay + Additions - Deductions - Advances - NegativeBalance
   ↓
7. Handle Negative Balance (if NetPay < 0)
   ├─ Create DriverNegativeBalance record
   └─ Store NetPay as 0 in Settlement
   ↓
8. Create Settlement Record
```

---

## Testing Checklist

- [x] CPM calculation uses `loadedMiles + emptyMiles` (not `totalMiles`)
- [x] Percentage calculation excludes Fuel Surcharge
- [x] StopPay added from ADDITIONAL_STOP accessorials
- [x] DetentionPay added from DETENTION accessorials
- [x] Reimbursements added from TOLL/SCALE expenses
- [x] Advances applied FIRST (Priority 1)
- [x] Recurring deductions applied SECOND (Priority 2)
- [x] Garnishments/Escrow applied THIRD (Priority 3)
- [x] Negative balance creates record (no error)
- [x] Negative balance auto-applies next week
- [x] Previous negative balance marked as applied

---

## Usage Example

```typescript
import { SettlementManager } from '@/lib/managers/SettlementManager';

const settlementManager = new SettlementManager();

const settlement = await settlementManager.generateSettlement({
  driverId: 'driver-123',
  periodStart: new Date('2025-01-20'),
  periodEnd: new Date('2025-01-27'),
});

// Settlement includes:
// - grossPay: Calculated per pay type
// - additions: StopPay + DetentionPay + Reimbursements
// - deductions: Recurring + Garnishments (Priority 2 & 3)
// - advances: Fuel/Cash advances (Priority 1)
// - netPay: Final amount (0 if negative balance created)
// - negativeBalance: Created if netPay < 0
```

---

**Implementation Status:** ✅ **COMPLETE**

All requirements implemented with strict adherence to the specified hierarchy.


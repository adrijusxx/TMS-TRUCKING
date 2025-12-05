# Migration Summary: Add Detention and Billing Logic

**Migration Name:** `20250127000000_add_detention_and_billing_logic`  
**Date:** 2025-01-27  
**Status:** ✅ Schema Updated | ✅ Migration Created | ✅ Types Updated

---

## Schema Changes Applied

### 1. Load Table - New Fields

```prisma
model Load {
  // ... existing fields ...
  
  // Billing Hold Fields (AR/AP Decoupling)
  isBillingHold          Boolean                 @default(false) // Blocks invoicing (AR), allows settlement (AP)
  billingHoldReason      String? // Reason for billing hold
  detentionStartStrategy DetentionStartStrategy? // How detention clock starts
}
```

**Purpose:**
- `isBillingHold`: Boolean flag that blocks customer invoicing (AR) but allows driver settlement (AP)
- `billingHoldReason`: Stores the reason why billing hold was set (e.g., "Detention charge requires Rate Con update")
- `detentionStartStrategy`: Configures how detention clock starts (ARRIVAL vs APPOINTMENT)

### 2. LoadStop Table - New Fields

```prisma
model LoadStop {
  // ... existing fields ...
  
  // Detention Calculation Fields
  billableDetentionMinutes Int?      @default(0) // Calculated billable detention time
  detentionClockStart      DateTime? // When the billable clock actually started
}
```

**Purpose:**
- `billableDetentionMinutes`: Stores the calculated billable detention time in minutes
- `detentionClockStart`: Records when the billable clock actually started (Math.max(Arrival, Appointment))

### 3. LoadStatus Enum - New Values

```prisma
enum LoadStatus {
  PENDING
  ASSIGNED
  EN_ROUTE_PICKUP
  AT_PICKUP
  LOADED
  EN_ROUTE_DELIVERY
  AT_DELIVERY
  DELIVERED
  BILLING_HOLD      // NEW: Blocks invoicing (AR), allows settlement (AP)
  READY_TO_BILL     // NEW: Passed audit gate, ready for invoice
  INVOICED
  PAID
  CANCELLED
}
```

**Purpose:**
- `BILLING_HOLD`: Status indicating invoice is blocked due to pending accessorials
- `READY_TO_BILL`: Status indicating load passed audit gate and is ready for invoicing

### 4. DetentionStartStrategy Enum - New Enum

```prisma
enum DetentionStartStrategy {
  ARRIVAL      // Clock starts when driver arrives (legacy behavior)
  APPOINTMENT  // Clock starts at scheduled appointment time (US Trucking standard)
}
```

**Purpose:**
- Configures how detention clock starts for each load
- `APPOINTMENT`: Prevents false billing when drivers arrive early (US Trucking standard)
- `ARRIVAL`: Legacy behavior for loads without appointment times

---

## Migration SQL

**File:** `prisma/migrations/20250127000000_add_detention_and_billing_logic/migration.sql`

```sql
-- CreateEnum
CREATE TYPE "DetentionStartStrategy" AS ENUM ('ARRIVAL', 'APPOINTMENT');

-- AlterEnum (Add new values to LoadStatus enum)
ALTER TYPE "LoadStatus" ADD VALUE 'BILLING_HOLD';
ALTER TYPE "LoadStatus" ADD VALUE 'READY_TO_BILL';

-- AlterTable: Add billing hold fields to Load
ALTER TABLE "Load" ADD COLUMN     "isBillingHold" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Load" ADD COLUMN     "billingHoldReason" TEXT;
ALTER TABLE "Load" ADD COLUMN     "detentionStartStrategy" "DetentionStartStrategy";

-- AlterTable: Add detention calculation fields to LoadStop
ALTER TABLE "LoadStop" ADD COLUMN     "billableDetentionMinutes" INTEGER DEFAULT 0;
ALTER TABLE "LoadStop" ADD COLUMN     "detentionClockStart" TIMESTAMP(3);

-- CreateIndex: Add index on isBillingHold for faster queries
CREATE INDEX "Load_isBillingHold_idx" ON "Load"("isBillingHold");

-- CreateIndex: Add index on detentionClockStart for detention queries
CREATE INDEX "LoadStop_detentionClockStart_idx" ON "LoadStop"("detentionClockStart");
```

---

## TypeScript Types Updated

**File:** `types/index.ts`

### Updated Load Interface

```typescript
export interface Load {
  // ... existing fields ...
  // Billing Hold Fields (AR/AP Decoupling)
  isBillingHold?: boolean;
  billingHoldReason?: string | null;
  detentionStartStrategy?: DetentionStartStrategy | null;
}
```

### New LoadStop Interface

```typescript
export interface LoadStop {
  // ... existing fields ...
  // Detention Calculation Fields
  billableDetentionMinutes?: number | null;
  detentionClockStart?: Date | null;
}
```

### Exported Types

```typescript
import { UserRole, LoadStatus, DriverStatus, TruckStatus, DetentionStartStrategy } from '@prisma/client';

export type {
  UserRole,
  LoadStatus,
  DriverStatus,
  TruckStatus,
  DetentionStartStrategy // NEW
};
```

---

## Database Indexes Created

1. **`Load_isBillingHold_idx`**: Index on `Load.isBillingHold` for fast queries filtering loads on billing hold
2. **`LoadStop_detentionClockStart_idx`**: Index on `LoadStop.detentionClockStart` for detention calculation queries

---

## Next Steps

### 1. Apply Migration to Database

```bash
# Apply the migration
npx prisma migrate deploy

# Or for development
npx prisma migrate dev
```

### 2. Update Service Layer Implementation

Implement the managers defined in `docs/service_layer_pseudo_code.md`:
- `DetentionManager` - Handles early arrival logic
- `BillingHoldManager` - Manages AR/AP decoupling
- `SettlementManager` - Ensures settlement can proceed with billing hold

### 3. Update API Routes

Update the following API routes to use new fields:
- `app/api/loads/[id]/stops/[stopId]/route.ts` - Check detention on departure
- `app/api/accessorial-charges/route.ts` - Set billing hold
- `app/api/invoices/route.ts` - Check `isBillingHold` flag
- `app/api/settlements/route.ts` - Allow settlement despite billing hold
- `app/api/rate-confirmations/[id]/route.ts` - Clear billing hold

### 4. Update UI Components

Update components to display:
- Billing hold indicator when `isBillingHold = true`
- Detention calculation details in stop views
- Warning when driver arrives late (detention at risk)

---

## Business Rules Implemented

### 1. Detention Clock Logic
- **Billable Clock Start:** `Math.max(ActualArrival, ScheduledAppointment)`
- **Early Arrival Protection:** Prevents false billing when drivers arrive early
- **Late Driver Flagging:** Flags detention as "At Risk" when driver arrives late

### 2. Billing Hold Workflow
- **AR vs AP Decoupling:** `isBillingHold` blocks invoicing but allows settlement
- **Settlement Logic:** Drivers get base pay even if invoice is held
- **Status Independence:** `isBillingHold` flag works independently of `status`

### 3. Schema Fields Usage
- `isBillingHold`: Controls invoicing (AR)
- `billingHoldReason`: Explains why hold was set
- `detentionStartStrategy`: Configures detention clock behavior
- `billableDetentionMinutes`: Stores calculated detention time
- `detentionClockStart`: Records when billable clock started

---

## Testing Checklist

- [ ] Apply migration to development database
- [ ] Verify new fields exist in database
- [ ] Test detention calculation with early arrival
- [ ] Test detention calculation with late arrival
- [ ] Test billing hold blocks invoicing
- [ ] Test billing hold allows settlement
- [ ] Test billing hold clears when Rate Con updated
- [ ] Verify indexes are created
- [ ] Test queries filtering by `isBillingHold`

---

## Rollback Plan

If migration needs to be rolled back:

```sql
-- Remove indexes
DROP INDEX IF EXISTS "Load_isBillingHold_idx";
DROP INDEX IF EXISTS "LoadStop_detentionClockStart_idx";

-- Remove columns
ALTER TABLE "LoadStop" DROP COLUMN IF EXISTS "detentionClockStart";
ALTER TABLE "LoadStop" DROP COLUMN IF EXISTS "billableDetentionMinutes";
ALTER TABLE "Load" DROP COLUMN IF EXISTS "detentionStartStrategy";
ALTER TABLE "Load" DROP COLUMN IF EXISTS "billingHoldReason";
ALTER TABLE "Load" DROP COLUMN IF EXISTS "isBillingHold";

-- Note: Cannot remove enum values from LoadStatus enum in PostgreSQL
-- Would need to recreate enum or leave values unused

-- Drop enum
DROP TYPE IF EXISTS "DetentionStartStrategy";
```

---

**Migration Created Successfully** ✅










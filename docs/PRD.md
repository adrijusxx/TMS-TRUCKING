# Product Requirements Document (PRD)
## USA Trucking TMS V2 - Straight Line Workflow

**Version:** 1.0  
**Date:** 2025 
**Domain:** USA Domestic Trucking & Logistics  
**Regulatory Standards:** FMCSA (Federal Motor Carrier Safety Administration)

---

## Executive Summary

This PRD defines the "Straight Line Workflow" for TMS V2, establishing the Load as the central source of truth for all financial and operational data. The workflow ensures a single, unidirectional flow from Order → Dispatch → Active Load → Delivery → Invoice → Settlement, with strict validation gates preventing data duplication and ensuring financial integrity.

---

## 1. Core Entity: Load as Source of Truth

### 1.1 Load Financial Structure

The Load entity serves as the **single source of truth** for all financial calculations. It maintains three distinct financial buckets:

#### Revenue Bucket (Accounts Receivable)
- **Primary Revenue:** `revenue` field (Float) - Total customer payment
- **Components:**
  - Line Haul (base rate)
  - Fuel Surcharge
  - Accessorial Charges (via `AccessorialCharge[]` relation)
- **Calculation:** `revenue = lineHaul + fuelSurcharge + sum(accessorialCharges.amount)`
- **Validation Rule:** Load cannot transition to `ASSIGNED` status without a confirmed `revenue > 0` (exception: $0 for internal moves with explicit override)

#### Expense Bucket (Accounts Payable)
- **Driver Pay:** `driverPay` field (Float) - Calculated based on driver's pay profile
- **Load Expenses:** `totalExpenses` field (Float) - Aggregated from `LoadExpense[]` relation
- **Fuel Advances:** `fuelAdvance` field (Float) - Pre-settlement deductions
- **Calculation:** `totalExpenses = sum(loadExpenses.amount)`
- **Initial Estimate:** Set at dispatch based on:
  - Driver pay type (PER_MILE, PER_LOAD, PERCENTAGE, HOURLY)
  - Assigned miles (`totalMiles`)
  - Load revenue (for percentage-based pay)

#### Margin Calculation
- **Net Profit:** `netProfit` field (Float) - Calculated field
- **Formula:** `netProfit = revenue - driverPay - totalExpenses`
- **Revenue Per Mile:** `revenuePerMile` field (Float) - Calculated: `revenue / totalMiles`
- **Validation:** System must prevent negative margin loads from being dispatched (configurable threshold)

### 1.2 Load Status Lifecycle

```
PENDING → ASSIGNED → EN_ROUTE_PICKUP → AT_PICKUP → LOADED → 
EN_ROUTE_DELIVERY → AT_DELIVERY → DELIVERED → READY_TO_BILL → 
INVOICED → PAID
```

**Critical Status Transitions:**
- `PENDING → ASSIGNED`: Requires Safety Gate + Fleet Gate validation
- `DELIVERED → READY_TO_BILL`: Requires Audit Gate validation
- `READY_TO_BILL → INVOICED`: Automatic invoice generation trigger

### 1.3 Load Data Integrity Rules

1. **No Duplication:** System must check for duplicate reference numbers (PO#, PU#, Shipment ID) before creating Load
2. **Geographic Validation:** All addresses must include valid US State codes, Zip codes, and timezone calculations
3. **Financial Lock:** Once Load reaches `READY_TO_BILL`, `driverPay` and `revenue` are locked (require admin override to modify)
4. **Single Source:** All financial calculations derive from Load fields; no manual re-entry in Accounting module

---

## 2. Dispatch Logic: Safety Gate & Fleet Gate

### 2.1 Safety Gate (Driver Validity)

**Purpose:** Enforce FMCSA compliance by preventing dispatch of ineligible drivers.

#### Pre-Dispatch Validation Checklist

Before a Load can transition from `PENDING` to `ASSIGNED`, the system must validate:

1. **CDL Validity:**
   - `Driver.licenseExpiry > currentDate + 30 days` (configurable buffer)
   - `Driver.licenseState` must be valid US state code
   - `Driver.licenseNumber` must not be null/empty
   - **Block Action:** If CDL expired or expiring within buffer, set `Driver.assignmentStatus = NOT_READY` and prevent dispatch

2. **Medical Card Validity:**
   - `Driver.medicalCardExpiry > currentDate + 30 days` (configurable buffer)
   - **Block Action:** If medical card expired or expiring within buffer, set `Driver.assignmentStatus = NOT_READY` and prevent dispatch

3. **DQF (Driver Qualification File) Status:**
   - `DriverQualificationFile.status = COMPLETE`
   - All required documents present and not expired
   - **Block Action:** If DQF incomplete or expired, prevent dispatch

4. **HOS (Hours of Service) Compliance:**
   - Driver must have sufficient available hours for the estimated trip duration
   - Check 8-day and 11-hour rules
   - **Block Action:** If HOS violation would occur, prevent dispatch

#### Safety Gate Implementation

**Service:** `SafetyGateService`
- **Method:** `validateDriverForDispatch(driverId: string, loadId: string): ValidationResult`
- **Returns:** 
  ```typescript
  {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    blockedReasons: string[];
  }
  ```
- **Integration Point:** Called automatically when dispatcher attempts to assign driver to load
- **UI Feedback:** Display validation errors in dispatch interface; disable "Assign" button if `isValid = false`

### 2.2 Fleet Gate (Truck Maintenance)

**Purpose:** Ensure assigned equipment is roadworthy and compliant.

#### Pre-Dispatch Validation Checklist

Before a Load can transition from `PENDING` to `ASSIGNED`, the system must validate:

1. **Truck Registration:**
   - `Truck.registrationExpiry > currentDate`
   - **Block Action:** If registration expired, set `Truck.status = OUT_OF_SERVICE` and prevent dispatch

2. **Truck Insurance:**
   - `Truck.insuranceExpiry > currentDate`
   - **Block Action:** If insurance expired, prevent dispatch

3. **Truck Inspection:**
   - `Truck.inspectionExpiry > currentDate`
   - **Block Action:** If inspection expired, prevent dispatch

4. **Truck Maintenance Status:**
   - `Truck.status != OUT_OF_SERVICE`
   - `Truck.status != IN_MAINTENANCE` (unless override approved)
   - Check for overdue preventive maintenance (`Truck.nextMaintenance < currentDate`)
   - **Warning:** If maintenance due within 7 days, show warning but allow dispatch (configurable)

5. **Breakdown Status:**
   - No active `Breakdown` records for the assigned truck
   - **Block Action:** If truck has unresolved breakdown, prevent dispatch

#### Fleet Gate Implementation

**Service:** `FleetGateService`
- **Method:** `validateTruckForDispatch(truckId: string, loadId: string): ValidationResult`
- **Returns:** Same structure as Safety Gate
- **Integration Point:** Called automatically when dispatcher attempts to assign truck to load
- **UI Feedback:** Display validation errors in dispatch interface; disable "Assign" button if `isValid = false`

### 2.3 Combined Gate Validation

**Service:** `DispatchValidationService`
- **Method:** `validateDispatchAssignment(loadId: string, driverId: string, truckId: string): CombinedValidationResult`
- **Logic:**
  1. Call `SafetyGateService.validateDriverForDispatch()`
  2. Call `FleetGateService.validateTruckForDispatch()`
  3. Check driver-truck compatibility (equipment type, MC number assignment)
  4. Return combined result
- **Enforcement:** Load status cannot change to `ASSIGNED` unless both gates pass

---

## 3. Settlement Logic: Delivered Load → Driver Pay Item

### 3.1 Settlement Trigger

**Trigger Condition:** Load status transitions to `DELIVERED` AND `readyForSettlement = true`

**Automatic Actions:**
1. Create `LedgerEntry` record (if not exists) with:
   - `type = PAY_ITEM`
   - `loadId = Load.id`
   - `driverId = Load.driverId`
   - `amount = Load.driverPay` (locked value from Load)
   - `status = PENDING_SETTLEMENT`
   - `description = "Load Pay: {Load.loadNumber}"`

2. Mark Load as settlement-ready:
   - `Load.readyForSettlement = true`
   - `Load.deliveredAt = currentTimestamp`

**Note:** `LedgerEntry` is the accounting representation; it aggregates into `Settlement` during settlement period processing.

### 3.2 Settlement Period Processing

**Frequency:** Weekly (configurable: every Friday for previous week's work)

**Service:** `SettlementCalculationService`

**Process:**

1. **Identify Eligible Loads:**
   ```typescript
   const eligibleLoads = await prisma.load.findMany({
     where: {
       status: 'DELIVERED',
       readyForSettlement: true,
       deliveredAt: {
         gte: periodStart,
         lte: periodEnd
       },
       driverId: { not: null }
     }
   });
   ```

2. **Group by Driver:**
   - Group loads by `driverId`
   - Create or update `Settlement` record per driver

3. **Calculate Gross Pay:**
   - **Per Mile Pay:** `(loadedMiles + emptyMiles) × driverRate`
   - **Per Load Pay:** `driverPay` (from Load)
   - **Percentage Pay:** `(revenue - fuelSurcharge) × driverPercentage`
   - **Hourly Pay:** `hoursWorked × hourlyRate`

4. **Aggregate Additions:**
   - Stop Pay (from `AccessorialCharge` where `type = STOP_PAY`)
   - Reimbursements (from `LoadExpense` where `reimbursable = true`)
   - Lumper Fees (if driver paid, mark as reimbursement)

5. **Calculate Deductions:**
   - **Advances:** Sum of `DriverAdvance[]` where `settlementId = null` and `approvedStatus = APPROVED`
   - **Recurring Deductions:** From `DeductionRule[]` (truck lease, insurance, ELD subscription)
   - **Load Expenses:** From `LoadExpense[]` where `reimbursable = false` (fuel, tolls, scales)
   - **Escrow:** Calculate based on driver's escrow balance

6. **Calculate Net Pay:**
   ```typescript
   netPay = grossPay + additions - deductions - advances
   ```

7. **Create Settlement Record:**
   ```typescript
   {
     driverId: driverId,
     loadIds: eligibleLoads.map(l => l.id),
     grossPay: calculatedGrossPay,
     deductions: calculatedDeductions,
     advances: calculatedAdvances,
     netPay: calculatedNetPay,
     periodStart: periodStart,
     periodEnd: periodEnd,
     status: 'PENDING',
     approvalStatus: 'PENDING'
   }
   ```

8. **Link Ledger Entries:**
   - Update all `LedgerEntry` records for these loads:
     - `LedgerEntry.settlementId = Settlement.id`
     - `LedgerEntry.status = SETTLED`

### 3.3 Settlement Approval Workflow

1. **Auto-Calculation:** System calculates settlement automatically
2. **Review:** Accounting reviews settlement (can adjust deductions/additions)
3. **Approval:** Manager approves settlement (`Settlement.approvalStatus = APPROVED`)
4. **Payment:** Generate ACH file (NACHA format) for direct deposit
5. **Mark Paid:** `Settlement.status = PAID`, `Settlement.paidDate = currentDate`

### 3.4 Negative Balance Handling

**Scenario:** Driver's deductions exceed gross pay (negative net pay)

**Logic:**
1. Create `DriverNegativeBalance` record:
   ```typescript
   {
     driverId: driverId,
     amount: Math.abs(negativeNetPay),
     originalSettlementId: settlementId,
     isApplied: false
   }
   ```
2. Set `Settlement.netPay = 0` (driver receives nothing)
3. On next settlement, apply negative balance:
   - `DriverNegativeBalance.appliedSettlementId = newSettlementId`
   - `DriverNegativeBalance.isApplied = true`
   - Deduct from new settlement's gross pay

---

## 4. Accounting: Invoice Generation from Load Data

### 4.1 Invoice Generation Trigger

**Trigger Condition:** Load status = `READY_TO_BILL` AND `isBillingHold = false`

**Automatic Actions:**
1. Create `Invoice` record:
   ```typescript
   {
     customerId: Load.customerId,
     loadIds: [Load.id],
     invoiceNumber: generateInvoiceNumber(),
     subtotal: Load.revenue,
     tax: calculateTax(Load.revenue, Customer.taxRate),
     total: subtotal + tax,
     balance: total,
     invoiceDate: currentDate,
     dueDate: currentDate + Customer.paymentTerms,
     status: 'DRAFT'
   }
   ```

2. Update Load:
   - `Load.status = INVOICED`
   - `Load.invoicedAt = currentTimestamp`

### 4.2 Invoice Data Source

**Single Source of Truth:** All invoice data derives from Load fields:

- **Line Items:** Generated from Load fields:
  - Line Haul: `Load.revenue - sum(accessorialCharges) - fuelSurcharge`
  - Fuel Surcharge: From `AccessorialCharge` where `type = FUEL_SURCHARGE`
  - Accessorials: From `AccessorialCharge[]` relation
  - Detention: From `AccessorialCharge` where `type = DETENTION` (if approved)

- **Totals:** Calculated from Load:
  - `Invoice.subtotal = Load.revenue`
  - `Invoice.tax = Load.revenue × Customer.taxRate`
  - `Invoice.total = subtotal + tax`

**Validation:** System prevents manual entry of invoice amounts; all values must trace back to Load data.

### 4.3 Consolidated Billing

**Scenario:** Customer requires weekly consolidated invoices (multiple loads per invoice)

**Logic:**
1. Group loads by `customerId` where:
   - `status = READY_TO_BILL`
   - `isBillingHold = false`
   - `deliveredAt` within billing period (e.g., same week)

2. Create single `Invoice`:
   ```typescript
   {
     customerId: customerId,
     loadIds: [load1.id, load2.id, load3.id, ...],
     subtotal: sum(allLoads.revenue),
     tax: sum(allLoads.revenue) × customerTaxRate,
     total: subtotal + tax
   }
   ```

3. Update all loads:
   - `Load.status = INVOICED`
   - `Load.invoicedAt = currentTimestamp`

### 4.4 Factoring Integration

**Scenario:** Customer uses factoring company for payment

**Logic:**
1. Check `Customer.isFactored = true`
2. Generate invoice PDF with "Notice of Assignment" overlay
3. Send invoice data to factoring company API (Triumph, RTS, etc.)
4. Update `Invoice`:
   - `Invoice.factoringStatus = SENT_TO_FACTOR`
   - `Invoice.factoringCompanyId = Customer.factoringCompanyId`
5. GL Entry: `Debit Factoring Reserve, Credit Sales`

### 4.5 Billing Hold Logic

**Purpose:** Decouple Accounts Receivable (invoicing) from Accounts Payable (settlement)

**Scenario:** Load is delivered, but customer disputes rate or accessorial charge

**Logic:**
1. Set `Load.isBillingHold = true`
2. Set `Load.billingHoldReason = "Rate dispute - awaiting revised rate con"`
3. **Block:** Load cannot transition to `READY_TO_BILL` (prevents invoicing)
4. **Allow:** Load can still transition to `DELIVERED` and create settlement (driver gets paid)
5. **Resolution:** Once dispute resolved, set `Load.isBillingHold = false`, then proceed to invoicing

---

## 5. Workflow Integration: The Complete Straight Line

### 5.1 End-to-End Flow

```
┌─────────┐
│  Order  │ (Customer creates order, rate confirmed)
└────┬────┘
     │
     ▼
┌─────────────┐
│   PENDING   │ (Load created, revenue set)
└──────┬──────┘
       │
       │ [Safety Gate + Fleet Gate Validation]
       │
       ▼
┌─────────────┐
│  ASSIGNED   │ (Driver + Truck assigned, driverPay calculated)
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ EN_ROUTE_PICKUP │ → AT_PICKUP → LOADED
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ EN_ROUTE_DELIVERY   │ → AT_DELIVERY
└────────┬────────────┘
         │
         ▼
┌─────────────┐
│  DELIVERED  │ (POD uploaded, readyForSettlement = true)
└──────┬──────┘
       │
       │ [Audit Gate Validation]
       │
       ▼
┌─────────────────┐
│ READY_TO_BILL    │ (Audit passed, financials locked)
└──────┬───────────┘
       │
       │ [Invoice Generation Trigger]
       │
       ▼
┌─────────────┐
│  INVOICED   │ (Invoice created from Load data)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    PAID     │ (Customer payment received)
└─────────────┘
```

### 5.2 Parallel Settlement Flow

```
┌─────────────┐
│  DELIVERED  │
└──────┬──────┘
       │
       │ [Settlement Trigger]
       │
       ▼
┌──────────────────┐
│  LedgerEntry     │ (Pay item created)
│  (PENDING_SETTLEMENT) │
└──────┬───────────┘
       │
       │ [Settlement Period Processing]
       │
       ▼
┌──────────────────┐
│  Settlement      │ (Weekly aggregation)
│  (PENDING)        │
└──────┬───────────┘
       │
       │ [Approval Workflow]
       │
       ▼
┌──────────────────┐
│  Settlement      │ (ACH file generated)
│  (PAID)          │
└──────────────────┘
```

### 5.3 Data Flow Rules

1. **Unidirectional:** Data flows forward only; no backward edits without audit trail
2. **Single Source:** Load is the source of truth; Invoice and Settlement derive from Load
3. **No Duplication:** Financial values exist once in Load; all other entities reference Load
4. **Audit Trail:** All status changes and financial modifications logged in `LoadStatusHistory` and `SettlementApproval`

---

## 6. Financial Integrity Rules

### 6.1 Revenue Integrity

- **Rule:** Revenue can only be set at Load creation or via approved Rate Confirmation change
- **Validation:** System prevents revenue modification after `READY_TO_BILL` status
- **Override:** Admin override required, creates audit log entry

### 6.2 Expense Integrity

- **Rule:** Driver pay calculated from Load data; no manual entry in Settlement
- **Validation:** `Settlement.grossPay` must equal sum of `Load.driverPay` for all loads in settlement
- **Override:** Accounting can adjust deductions/additions, but not base pay without approval

### 6.3 Margin Integrity

- **Rule:** System calculates margin automatically: `revenue - driverPay - totalExpenses`
- **Validation:** Negative margin loads require manager approval before dispatch
- **Reporting:** Margin reports aggregate from Load data; no separate margin table

---

## 7. Exception Handling

### 7.1 Repower (Split Load)

**Scenario:** Truck breaks down mid-route; second truck completes delivery

**Logic:**
1. Create `LoadSegment` for original driver (Origin → Breakdown Location)
2. Create `LoadSegment` for replacement driver (Breakdown Location → Destination)
3. Revenue stays on original `Load.id`
4. Driver pay calculated per segment:
   - `LoadSegment1.driverPay = miles1 × driver1Rate`
   - `LoadSegment2.driverPay = miles2 × driver2Rate`
5. Settlement processes each segment separately

### 7.2 Post-Payment Adjustments

**Scenario:** Driver paid, but later receives speeding ticket or cargo claim for that load

**Logic:**
1. **Do NOT edit** existing `Settlement` record
2. Create new `LedgerEntry` with `type = DEDUCTION` on next settlement:
   ```typescript
   {
     driverId: driverId,
     loadId: originalLoadId,
     type: 'DEDUCTION',
     amount: ticketAmount,
     description: 'Speeding ticket - Load {loadNumber}',
     status: 'PENDING_SETTLEMENT'
   }
   ```
3. Deduction applies to next available settlement period

### 7.3 Rate Disputes

**Scenario:** Customer disputes invoice amount after delivery

**Logic:**
1. Set `Load.isBillingHold = true` (if not already invoiced)
2. If already invoiced, create credit memo:
   - Create `Invoice` with negative amounts
   - Link to original invoice
3. Adjust `Load.revenue` (requires manager approval)
4. Recalculate margin and settlement if driver already paid

---

## 8. Technical Implementation Notes

### 8.1 Service Layer Architecture

**Services Required:**
- `LoadService` - Core load CRUD and status transitions
- `SafetyGateService` - Driver validation
- `FleetGateService` - Truck validation
- `DispatchValidationService` - Combined gate validation
- `SettlementCalculationService` - Settlement processing
- `InvoiceGenerationService` - Invoice creation from loads
- `AuditGateService` - Post-delivery validation

### 8.2 Database Constraints

- **Unique Constraints:**
  - `Load.loadNumber` (unique per company)
  - `Invoice.invoiceNumber` (unique)
  - `Settlement.settlementNumber` (unique)

- **Foreign Key Constraints:**
  - `Load.driverId → Driver.id` (nullable, but required for ASSIGNED+)
  - `Load.truckId → Truck.id` (nullable, but required for ASSIGNED+)
  - `LedgerEntry.loadId → Load.id` (required)
  - `Settlement.loadIds[]` - Array validation (all must exist)

### 8.3 Event-Driven Architecture

**Events to Emit:**
- `LoadStatusChanged` - When load status transitions
- `DriverAssigned` - When driver assigned (triggers safety gate)
- `TruckAssigned` - When truck assigned (triggers fleet gate)
- `LoadDelivered` - When load delivered (triggers settlement)
- `LoadReadyToBill` - When audit gate passes (triggers invoicing)
- `SettlementCalculated` - When settlement period processed
- `InvoiceGenerated` - When invoice created

---

## 9. Success Criteria

### 9.1 Functional Requirements

- ✅ Load serves as single source of truth for all financial data
- ✅ Safety Gate prevents dispatch of ineligible drivers (CDL/Medical Card expired)
- ✅ Fleet Gate prevents dispatch of non-compliant trucks
- ✅ Settlement automatically creates LedgerEntry when load delivered
- ✅ Invoice generation pulls all data from Load (no manual entry)
- ✅ Financial values locked after READY_TO_BILL status
- ✅ Negative balances handled correctly across settlements

### 9.2 Performance Requirements

- Dispatch validation (Safety + Fleet Gate) completes in < 500ms
- Settlement calculation for 100 loads completes in < 5 seconds
- Invoice generation for 50 loads completes in < 3 seconds

### 9.3 Data Integrity Requirements

- Zero tolerance for duplicate loads (same reference number)
- Zero tolerance for financial discrepancies between Load and Invoice
- Zero tolerance for settlement pay not matching Load.driverPay

---

## 10. Future Enhancements (Out of Scope for V2)

- Real-time GPS tracking integration
- Automated detention calculation with broker API
- Predictive maintenance scheduling
- AI-powered route optimization
- Mobile driver app for POD upload
- EDI integration for automated rate confirmations

---

## Appendix A: Status Enum Definitions

### LoadStatus
```typescript
enum LoadStatus {
  PENDING              // Load created, awaiting assignment
  ASSIGNED             // Driver + Truck assigned (gates passed)
  EN_ROUTE_PICKUP      // Driver en route to pickup
  AT_PICKUP            // Driver arrived at pickup
  LOADED               // Load picked up, en route to delivery
  EN_ROUTE_DELIVERY    // Driver en route to delivery
  AT_DELIVERY          // Driver arrived at delivery
  DELIVERED            // Load delivered, POD received
  BILLING_HOLD         // Blocked from invoicing (dispute, etc.)
  READY_TO_BILL        // Audit passed, ready for invoice
  INVOICED             // Invoice generated
  PAID                 // Customer payment received
  CANCELLED            // Load cancelled
}
```

### SettlementStatus
```typescript
enum SettlementStatus {
  PENDING    // Calculated, awaiting review
  APPROVED   // Manager approved, ready for payment
  PAID       // ACH file generated, payment processed
  DISPUTED   // Driver disputes settlement
}
```

### InvoiceStatus
```typescript
enum InvoiceStatus {
  DRAFT      // Created, not sent
  SENT       // Sent to customer/factor
  PARTIAL    // Partially paid
  PAID       // Fully paid
  OVERDUE    // Past due date, not paid
  CANCELLED  // Invoice cancelled
}
```

---

## Appendix B: Key Field Mappings

### Load → Invoice Mapping
- `Load.revenue` → `Invoice.subtotal`
- `Load.customerId` → `Invoice.customerId`
- `Load.id` → `Invoice.loadIds[]`
- `Load.deliveryDate` → `Invoice.invoiceDate` (default)

### Load → Settlement Mapping
- `Load.driverPay` → `LedgerEntry.amount`
- `Load.driverId` → `Settlement.driverId`
- `Load.id` → `Settlement.loadIds[]`
- `Load.deliveredAt` → Used for settlement period filtering

---

**End of PRD**








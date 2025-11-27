# Service Layer Pseudo-Code: Detention Clock & Billing Hold Logic

**Purpose:** Define where and how detention detection, billing hold, and audit gate logic should be implemented in the service layer.

**Last Updated:** 2025-01-27  
**Critical Business Rules:** US Trucking-specific detention and billing hold workflows

---

## Schema Changes Required

### Prisma Schema Updates

```prisma
// ============================================
// LOAD TABLE UPDATES
// ============================================

model Load {
  // ... existing fields ...
  
  // Billing Hold Fields
  isBillingHold          Boolean  @default(false) // NEW: Explicit billing hold flag
  billingHoldReason      String?  // NEW: Reason for billing hold
  detentionStartStrategy DetentionStartStrategy? // NEW: How detention clock starts
  
  // ... existing fields ...
}

enum DetentionStartStrategy {
  ARRIVAL      // Clock starts when driver arrives (legacy behavior)
  APPOINTMENT  // Clock starts at scheduled appointment time (US Trucking standard)
}

// ============================================
// LOAD STOP TABLE UPDATES
// ============================================

model LoadStop {
  // ... existing fields ...
  
  // Detention Calculation Fields
  billableDetentionMinutes Int?      @default(0) // NEW: Calculated billable detention time
  detentionClockStart      DateTime? // NEW: When the billable clock actually started
  
  // ... existing fields ...
}

// ============================================
// LOAD STATUS ENUM UPDATES
// ============================================

enum LoadStatus {
  PENDING
  ASSIGNED
  EN_ROUTE_PICKUP
  AT_PICKUP
  LOADED
  EN_ROUTE_DELIVERY
  AT_DELIVERY
  DELIVERED
  BILLING_HOLD      // NEW: Blocks invoicing, allows settlement
  READY_TO_BILL     // NEW: Passed audit gate, ready for invoice
  INVOICED
  PAID
  CANCELLED
}

// ============================================
// CUSTOMER TABLE UPDATES (if not exists)
// ============================================

model Customer {
  // ... existing fields ...
  
  detentionFreeTimeHours Float?  @default(2) // Customer-specific free time
  detentionRate          Float?  @default(50) // Customer-specific detention rate
  requiresRateConUpdate  Boolean @default(true) // Whether accessorials require Rate Con update
}
```

---

## 1. Detention Detection Service (FIXED: Early Arrival Logic)

### File: `lib/managers/DetentionManager.ts`

```typescript
/**
 * DetentionManager
 * 
 * Handles automatic detection and calculation of detention charges
 * when drivers exceed free time at pickup/delivery locations.
 * 
 * CRITICAL FIX: Handles "Early Arrival" trap - clock starts at Math.max(Arrival, Appointment)
 */
export class DetentionManager {
  private readonly DEFAULT_FREE_TIME_HOURS = 2;
  
  /**
   * MAIN ENTRY POINT: Called when LoadStop.actualDeparture is updated
   * 
   * Location: app/api/loads/[id]/stops/[stopId]/route.ts (PATCH handler)
   * Trigger: When driver updates stop departure time (mobile app or dispatch)
   */
  async checkDetentionOnDeparture(
    loadStopId: string,
    options?: {
      freeTimeHours?: number;
      customerId?: string;
    }
  ): Promise<DetentionCheckResult> {
    // STEP 1: Fetch stop with load, customer, and appointment times
    const stop = await prisma.loadStop.findUnique({
      where: { id: loadStopId },
      include: {
        load: {
          include: {
            customer: {
              select: {
                id: true,
                detentionFreeTimeHours: true,
                detentionRate: true,
              }
            },
            accessorialCharges: {
              where: {
                chargeType: 'DETENTION',
                status: { in: ['PENDING', 'APPROVED'] }
              }
            }
          }
        }
      }
    });

    // STEP 2: Validate we have both arrival and departure times
    if (!stop?.actualArrival || !stop?.actualDeparture) {
      return {
        detentionDetected: false,
        reason: 'Missing arrival or departure time'
      };
    }

    // STEP 3: Get scheduled appointment time (earliestArrival or latestArrival)
    // Use earliestArrival as the scheduled appointment time
    const scheduledAppointmentTime = stop.earliestArrival 
      ? new Date(stop.earliestArrival)
      : stop.latestArrival 
        ? new Date(stop.latestArrival)
        : null;

    const actualArrivalTime = new Date(stop.actualArrival);
    const actualDepartureTime = new Date(stop.actualDeparture);

    // STEP 4: CRITICAL FIX - Calculate billable clock start time
    // Rule: Clock starts at Math.max(ActualArrival, ScheduledAppointment)
    // This prevents false billing when drivers arrive early
    let billableClockStart: Date;
    let clockStartReason: string;
    let driverLate: boolean = false;

    if (scheduledAppointmentTime) {
      // Compare actual arrival vs scheduled appointment
      if (actualArrivalTime > scheduledAppointmentTime) {
        // Driver is LATE - clock starts at actual arrival
        billableClockStart = actualArrivalTime;
        clockStartReason = 'ARRIVAL_LATE';
        driverLate = true;
      } else {
        // Driver is EARLY or ON TIME - clock starts at appointment time
        billableClockStart = scheduledAppointmentTime;
        clockStartReason = 'APPOINTMENT';
      }
    } else {
      // No appointment time set - fallback to arrival time (legacy behavior)
      billableClockStart = actualArrivalTime;
      clockStartReason = 'ARRIVAL_NO_APPOINTMENT';
    }

    // STEP 5: Calculate detention hours from billable clock start
    const totalHours = 
      (actualDepartureTime.getTime() - billableClockStart.getTime()) / (1000 * 60 * 60);
    
    // Get free time threshold (customer-specific or default)
    const freeTimeHours = 
      options?.freeTimeHours || 
      stop.load.customer.detentionFreeTimeHours || 
      this.DEFAULT_FREE_TIME_HOURS;

    // Calculate billable detention (excess beyond free time)
    const detentionHours = Math.max(0, totalHours - freeTimeHours);
    const billableDetentionMinutes = Math.round(detentionHours * 60);

    // STEP 6: If detention detected, create charge and alert
    if (detentionHours > 0) {
      // Check if detention charge already exists (prevent duplicates)
      if (stop.load.accessorialCharges.length > 0) {
        return {
          detentionDetected: true,
          detentionHours,
          billableDetentionMinutes,
          existingCharge: true,
          chargeId: stop.load.accessorialCharges[0].id,
          driverLate,
          clockStartReason
        };
      }

      // Get detention rate (customer-specific or default)
      const detentionRate = stop.load.customer.detentionRate || 50; // $50/hour default

      // STEP 7: Update LoadStop with detention calculation details
      await prisma.loadStop.update({
        where: { id: loadStopId },
        data: {
          billableDetentionMinutes,
          detentionClockStart: billableClockStart,
        }
      });

      // STEP 8: Create pending accessorial charge
      const charge = await prisma.accessorialCharge.create({
        data: {
          companyId: stop.load.companyId,
          loadId: stop.loadId,
          chargeType: 'DETENTION',
          detentionHours,
          detentionRate,
          amount: detentionHours * detentionRate,
          status: 'PENDING', // REQUIRES APPROVAL
          description: this.buildDetentionDescription(
            detentionHours,
            billableClockStart,
            actualDepartureTime,
            clockStartReason,
            driverLate,
            stop
          ),
          notes: this.buildDetentionNotes(
            actualArrivalTime,
            scheduledAppointmentTime,
            billableClockStart,
            actualDepartureTime,
            driverLate
          ),
        }
      });

      // STEP 9: Alert dispatch (with late driver warning if applicable)
      await this.notifyDispatch(stop.load, detentionHours, stop, driverLate, clockStartReason);

      // STEP 10: Set billing hold if load is delivered (AR hold only, not AP)
      if (stop.load.status === 'DELIVERED' || stop.load.status === 'READY_TO_BILL') {
        await this.setBillingHold(stop.loadId, {
          reason: 'Detention charge detected',
          accessorialChargeId: charge.id,
          requiresRateConUpdate: true
        });
      }

      return {
        detentionDetected: true,
        detentionHours,
        billableDetentionMinutes,
        chargeId: charge.id,
        billingHoldSet: true,
        driverLate,
        clockStartReason,
        billableClockStart: billableClockStart.toISOString()
      };
    }

    // STEP 11: Update LoadStop even if no detention (for audit trail)
    await prisma.loadStop.update({
      where: { id: stopId },
      data: {
        billableDetentionMinutes: 0,
        detentionClockStart: billableClockStart,
      }
    });

    return {
      detentionDetected: false,
      reason: 'Within free time threshold',
      billableClockStart: billableClockStart.toISOString(),
      driverLate
    };
  }

  /**
   * HELPER: Build detention description
   */
  private buildDetentionDescription(
    detentionHours: number,
    clockStart: Date,
    departure: Date,
    clockStartReason: string,
    driverLate: boolean,
    stop: LoadStop
  ): string {
    const location = stop.company || stop.address;
    const lateWarning = driverLate ? ' [DRIVER LATE - AT RISK]' : '';
    
    return `Detention: ${detentionHours.toFixed(2)} hours at ${location}${lateWarning}`;
  }

  /**
   * HELPER: Build detailed detention notes
   */
  private buildDetentionNotes(
    actualArrival: Date,
    scheduledAppointment: Date | null,
    billableClockStart: Date,
    actualDeparture: Date,
    driverLate: boolean
  ): string {
    let notes = `Auto-detected detention:\n`;
    notes += `- Actual Arrival: ${actualArrival.toISOString()}\n`;
    
    if (scheduledAppointment) {
      notes += `- Scheduled Appointment: ${scheduledAppointment.toISOString()}\n`;
      notes += `- Billable Clock Start: ${billableClockStart.toISOString()} `;
      notes += `(${driverLate ? 'Driver Late - Clock Started at Arrival' : 'Driver Early - Clock Started at Appointment'})\n`;
    } else {
      notes += `- Billable Clock Start: ${billableClockStart.toISOString()} (No Appointment Set)\n`;
    }
    
    notes += `- Actual Departure: ${actualDeparture.toISOString()}\n`;
    
    if (driverLate) {
      notes += `\n⚠️ WARNING: Driver arrived LATE. Detention may be at risk if broker disputes.`;
    }
    
    return notes;
  }

  /**
   * HELPER: Notify dispatch when detention detected
   */
  private async notifyDispatch(
    load: Load,
    detentionHours: number,
    stop: LoadStop,
    driverLate: boolean,
    clockStartReason: string
  ): Promise<void> {
    await notifyDetentionDetected({
      loadId: load.id,
      loadNumber: load.loadNumber,
      detentionHours,
      location: stop.company || stop.address,
      customerName: load.customer.name,
      estimatedCharge: detentionHours * (load.customer.detentionRate || 50),
      driverLate,
      clockStartReason,
      requiresAttention: driverLate // Flag for dispatch review if driver was late
    });
  }

  /**
   * HELPER: Set billing hold on load (AR only, not AP)
   */
  private async setBillingHold(
    loadId: string,
    context: {
      reason: string;
      accessorialChargeId: string;
      requiresRateConUpdate: boolean;
    }
  ): Promise<void> {
    // Set billing hold flag (blocks invoicing, allows settlement)
    await prisma.load.update({
      where: { id: loadId },
      data: {
        isBillingHold: true, // NEW: Explicit flag
        billingHoldReason: context.reason, // NEW: Reason field
        accountingSyncStatus: 'REQUIRES_REVIEW',
        dispatchNotes: `BILLING HOLD (AR): ${context.reason} - Rate Con update required before invoicing.\n` +
                      `NOTE: Driver settlement (AP) can proceed independently.\n` +
                      `${new Date().toISOString()}`
      }
    });

    // Notify accounting department
    await notifyBillingHold({
      loadId,
      reason: context.reason,
      accessorialChargeId: context.accessorialChargeId,
      requiresRateConUpdate: context.requiresRateConUpdate,
      blocksInvoicing: true,
      allowsSettlement: true // CRITICAL: Settlement can proceed
    });
  }
}
```

---

## 2. Billing Hold Service (FIXED: Decouple AR from AP)

### File: `lib/managers/BillingHoldManager.ts`

```typescript
/**
 * BillingHoldManager
 * 
 * Manages billing hold status when Rate Con updates are required
 * due to accessorial charges (Lumper, Detention, etc.)
 * 
 * CRITICAL FIX: Billing hold blocks Customer Invoicing (AR) but allows Driver Settlement (AP)
 */
export class BillingHoldManager {
  
  /**
   * MAIN ENTRY POINT: Called when AccessorialCharge is created
   * 
   * Location: app/api/accessorial-charges/route.ts (POST handler)
   * Trigger: When driver/dispatcher creates lumper or detention charge
   */
  async checkAndSetBillingHold(
    accessorialChargeId: string
  ): Promise<BillingHoldResult> {
    // STEP 1: Fetch charge with load and rate confirmation
    const charge = await prisma.accessorialCharge.findUnique({
      where: { id: accessorialChargeId },
      include: {
        load: {
          include: {
            rateConfirmation: true,
            customer: {
              select: {
                name: true,
                requiresRateConUpdate: true
              }
            }
          }
        }
      }
    });

    if (!charge) {
      return { billingHoldSet: false, reason: 'Charge not found' };
    }

    // STEP 2: Check if this charge type requires Rate Con update
    const requiresRateConUpdate = 
      ['LUMPER', 'DETENTION'].includes(charge.chargeType) &&
      charge.load.customer.requiresRateConUpdate !== false; // Default true

    if (!requiresRateConUpdate) {
      return { billingHoldSet: false, reason: 'Charge type does not require Rate Con update' };
    }

    // STEP 3: Check if load is in a state that can be put on hold
    const canSetHold = ['DELIVERED', 'READY_TO_BILL'].includes(charge.load.status);
    
    if (!canSetHold) {
      return { 
        billingHoldSet: false, 
        reason: `Load status ${charge.load.status} does not require billing hold` 
      };
    }

    // STEP 4: Set billing hold (AR only - does NOT block settlement)
    await prisma.load.update({
      where: { id: charge.loadId },
      data: {
        isBillingHold: true, // NEW: Explicit flag
        billingHoldReason: `${charge.chargeType} charge requires Rate Con update`, // NEW: Reason
        accountingSyncStatus: 'REQUIRES_REVIEW',
        dispatchNotes: this.buildBillingHoldNote(charge),
        // CRITICAL: Do NOT change status to BILLING_HOLD if load is already READY_TO_BILL
        // Status remains as-is, only isBillingHold flag is set
        // This allows settlement to proceed while invoice is blocked
      }
    });

    // STEP 5: Notify accounting department (AR team)
    await this.notifyAccounting(charge);

    return {
      billingHoldSet: true,
      loadId: charge.loadId,
      loadNumber: charge.load.loadNumber,
      reason: `${charge.chargeType} charge requires Rate Con update`,
      blocksInvoicing: true,
      allowsSettlement: true // CRITICAL: Settlement can proceed
    };
  }

  /**
   * MAIN ENTRY POINT: Called when RateConfirmation is updated
   * 
   * Location: app/api/rate-confirmations/[id]/route.ts (PATCH handler)
   * Trigger: When accounting updates Rate Con with new total including accessorials
   */
  async clearBillingHold(
    loadId: string,
    context: {
      rateConfirmationId: string;
      updatedBy: string;
      newTotalRate: number;
    }
  ): Promise<BillingHoldClearResult> {
    // STEP 1: Fetch load with pending accessorial charges
    const load = await prisma.load.findUnique({
      where: { id: loadId },
      include: {
        accessorialCharges: {
          where: {
            status: 'PENDING',
            chargeType: { in: ['LUMPER', 'DETENTION'] }
          }
        },
        rateConfirmation: true
      }
    });

    if (!load || !load.isBillingHold) {
      return { 
        cleared: false, 
        reason: 'Load is not on billing hold' 
      };
    }

    // STEP 2: Verify Rate Con includes accessorial charges
    const totalAccessorials = load.accessorialCharges.reduce(
      (sum, charge) => sum + charge.amount, 
      0
    );
    
    const expectedTotal = 
      (load.rateConfirmation?.baseRate || 0) + 
      (load.rateConfirmation?.fuelSurcharge || 0) + 
      totalAccessorials;

    // STEP 3: Check if Rate Con total matches expected total (with tolerance)
    const tolerance = 0.01; // $0.01 tolerance for rounding
    const rateConTotal = context.newTotalRate;
    
    if (Math.abs(rateConTotal - expectedTotal) > tolerance) {
      return {
        cleared: false,
        reason: `Rate Con total ($${rateConTotal}) does not match expected total ($${expectedTotal.toFixed(2)})`,
        expectedTotal,
        actualTotal: rateConTotal
      };
    }

    // STEP 4: Approve pending accessorial charges
    await prisma.accessorialCharge.updateMany({
      where: {
        loadId,
        status: 'PENDING',
        chargeType: { in: ['LUMPER', 'DETENTION'] }
      },
      data: {
        status: 'APPROVED',
        approvedById: context.updatedBy,
        approvedAt: new Date()
      }
    });

    // STEP 5: Clear billing hold - move to READY_TO_BILL
    await prisma.load.update({
      where: { id: loadId },
      data: {
        isBillingHold: false, // Clear the flag
        billingHoldReason: null, // Clear the reason
        status: 'READY_TO_BILL', // Move to ready state
        dispatchNotes: `Billing hold cleared: Rate Con updated to include accessorials. Total: $${rateConTotal}\n${new Date().toISOString()}`,
        accountingSyncStatus: 'PENDING_SYNC'
      }
    });

    // STEP 6: Notify dispatch that hold is cleared
    await notifyBillingHoldCleared({
      loadId,
      loadNumber: load.loadNumber,
      rateConTotal: rateConTotal
    });

    return {
      cleared: true,
      loadId,
      newStatus: 'READY_TO_BILL',
      approvedCharges: load.accessorialCharges.length
    };
  }

  /**
   * HELPER: Build billing hold note
   */
  private buildBillingHoldNote(charge: AccessorialCharge): string {
    return `BILLING HOLD (AR ONLY): ${charge.chargeType} charge ($${charge.amount.toFixed(2)}) added.\n` +
           `Rate Con update required before invoicing.\n` +
           `NOTE: Driver settlement (AP) can proceed independently.\n` +
           `Charge ID: ${charge.id}\n` +
           `${new Date().toISOString()}`;
  }

  /**
   * HELPER: Notify accounting department (AR team only)
   */
  private async notifyAccounting(charge: AccessorialCharge): Promise<void> {
    await notifyBillingHold({
      loadId: charge.loadId,
      loadNumber: charge.load.loadNumber,
      reason: `${charge.chargeType} charge requires Rate Con update`,
      accessorialChargeId: charge.id,
      customerName: charge.load.customer.name,
      chargeAmount: charge.amount,
      requiresAction: true,
      blocksInvoicing: true,
      allowsSettlement: true // CRITICAL: Settlement can proceed
    });
  }
}
```

---

## 3. Settlement Service (NEW: Ensure AP Can Proceed)

### File: `lib/managers/SettlementManager.ts` (UPDATE EXISTING)

```typescript
/**
 * SettlementManager - UPDATED
 * 
 * CRITICAL FIX: Settlement (AP) can proceed even when load is on billing hold (AR)
 */
export class SettlementManager {
  // ... existing code ...

  /**
   * Check if load is eligible for settlement
   * 
   * CRITICAL: Billing hold does NOT block settlement
   */
  async isLoadEligibleForSettlement(loadId: string): Promise<SettlementEligibilityResult> {
    const load = await prisma.load.findUnique({
      where: { id: loadId },
      include: {
        driver: true,
        accessorialCharges: {
          where: {
            chargeType: { in: ['LUMPER', 'DETENTION'] },
            status: 'PENDING'
          }
        }
      }
    });

    if (!load) {
      return { eligible: false, reason: 'Load not found' };
    }

    // Check 1: Load must be delivered
    if (load.status !== 'DELIVERED' && 
        load.status !== 'READY_TO_BILL' && 
        load.status !== 'BILLING_HOLD' && // CRITICAL: Allow settlement even on hold
        load.status !== 'INVOICED') {
      return { 
        eligible: false, 
        reason: `Load status ${load.status} does not allow settlement` 
      };
    }

    // Check 2: Driver must be assigned
    if (!load.driverId) {
      return { eligible: false, reason: 'No driver assigned' };
    }

    // Check 3: Driver pay must be calculated
    if (!load.driverPay || load.driverPay === 0) {
      return { eligible: false, reason: 'Driver pay not calculated' };
    }

    // Check 4: Billing hold does NOT block settlement
    // This is the critical fix - AR and AP are decoupled
    const warnings: string[] = [];
    if (load.isBillingHold) {
      warnings.push(
        `Load is on billing hold (${load.billingHoldReason}). ` +
        `Settlement can proceed, but invoice is blocked until Rate Con is updated.`
      );
    }

    // Check 5: Pending accessorials don't block settlement
    // Driver gets base pay; accessorials added later when approved
    if (load.accessorialCharges.length > 0) {
      warnings.push(
        `Load has ${load.accessorialCharges.length} pending accessorial charge(s). ` +
        `Driver will receive base pay; accessorials will be added to next settlement when approved.`
      );
    }

    return {
      eligible: true,
      warnings: warnings.length > 0 ? warnings : undefined,
      canProceedWithHold: load.isBillingHold
    };
  }

  /**
   * Calculate driver settlement
   * 
   * CRITICAL: Only includes approved accessorials, not pending ones
   */
  async calculateSettlement(loadId: string): Promise<SettlementCalculation> {
    const load = await prisma.load.findUnique({
      where: { id: loadId },
      include: {
        driver: true,
        accessorialCharges: {
          where: {
            status: 'APPROVED' // Only approved accessorials included
          }
        }
      }
    });

    if (!load) {
      throw new Error('Load not found');
    }

    // Base driver pay (always included)
    const basePay = load.driverPay || 0;

    // Approved accessorial reimbursements (only if approved)
    const approvedReimbursements = load.accessorialCharges
      .filter(charge => 
        charge.chargeType === 'LUMPER' && 
        charge.status === 'APPROVED'
      )
      .reduce((sum, charge) => sum + charge.amount, 0);

    // Total settlement amount
    const totalSettlement = basePay + approvedReimbursements;

    return {
      loadId,
      basePay,
      approvedReimbursements,
      totalSettlement,
      pendingAccessorials: load.accessorialCharges.filter(c => c.status === 'PENDING').length,
      note: load.isBillingHold 
        ? 'Settlement calculated despite billing hold. Invoice blocked until Rate Con updated.'
        : undefined
    };
  }
}
```

---

## 4. Audit Gate Service (UPDATE EXISTING)

### File: `lib/managers/LoadCompletionManager.ts` (UPDATE EXISTING)

```typescript
/**
 * LoadCompletionManager - UPDATED
 * 
 * Adds audit gate logic before load moves to READY_TO_BILL
 * CRITICAL: Billing hold does not prevent audit gate from passing
 */
export class LoadCompletionManager {
  // ... existing code ...

  /**
   * MAIN ENTRY POINT: Called when load status changes to DELIVERED
   * 
   * Location: app/api/loads/[id]/route.ts (PATCH handler)
   * Trigger: When load status is updated to DELIVERED
   */
  async processAuditGate(loadId: string): Promise<AuditGateResult> {
    // STEP 1: Fetch load with all required data
    const load = await prisma.load.findUnique({
      where: { id: loadId },
      include: {
        documents: {
          where: {
            type: { in: ['POD', 'BOL'] }
          }
        },
        rateConfirmation: true,
        accessorialCharges: {
          where: {
            status: 'PENDING',
            chargeType: { in: ['LUMPER', 'DETENTION'] }
          }
        }
      }
    });

    if (!load) {
      return { passed: false, errors: ['Load not found'] };
    }

    // STEP 2: Run audit gate checks
    const auditChecks = await this.runAuditChecks(load);

    // STEP 3: If checks fail, set REQUIRES_REVIEW
    if (!auditChecks.passed) {
      await prisma.load.update({
        where: { id: loadId },
        data: {
          accountingSyncStatus: 'REQUIRES_REVIEW',
          dispatchNotes: `AUDIT GATE FAILED:\n${auditChecks.errors.join('\n')}\n${new Date().toISOString()}`
        }
      });

      return auditChecks;
    }

    // STEP 4: Check for pending accessorial charges
    // CRITICAL FIX: Set billing hold flag, but don't block audit gate
    if (load.accessorialCharges.length > 0) {
      const billingHoldManager = new BillingHoldManager();
      await billingHoldManager.checkAndSetBillingHold(load.accessorialCharges[0].id);
      
      // Audit gate can still pass - billing hold only blocks invoicing
      // Status can be READY_TO_BILL with isBillingHold = true
    }

    // STEP 5: Lock driver pay (expense lock)
    await this.lockDriverPay(loadId);

    // STEP 6: Pass audit gate - move to READY_TO_BILL
    // CRITICAL: Even if billing hold is set, audit gate passes
    await prisma.load.update({
      where: { id: loadId },
      data: {
        status: 'READY_TO_BILL',
        accountingSyncStatus: load.accessorialCharges.length > 0 
          ? 'REQUIRES_REVIEW' 
          : 'PENDING_SYNC',
        dispatchNotes: `Audit gate passed. Load ready for invoicing${load.accessorialCharges.length > 0 ? ' (pending Rate Con update)' : ''}.\n${new Date().toISOString()}`
      }
    });

    return {
      passed: true,
      status: 'READY_TO_BILL',
      warnings: [
        ...auditChecks.warnings,
        ...(load.accessorialCharges.length > 0 
          ? ['Billing hold set due to pending accessorials - invoice blocked, settlement allowed'] 
          : [])
      ]
    };
  }

  // ... rest of existing code (runAuditChecks, lockDriverPay) ...
}
```

---

## 5. Integration Points (API Routes)

### File: `app/api/invoices/route.ts` (UPDATE EXISTING)

```typescript
/**
 * POST /api/invoices
 * Create invoice
 * 
 * CRITICAL FIX: Check isBillingHold flag, not status
 */
export async function POST(request: NextRequest) {
  // ... existing validation ...

  // 🔥 UPDATED: Check for billing hold flag (not status)
  const load = await prisma.load.findUnique({
    where: { id: loadId },
    include: {
      accessorialCharges: {
        where: {
          status: 'PENDING',
          chargeType: { in: ['LUMPER', 'DETENTION'] }
        }
      }
    }
  });

  // CRITICAL: Check isBillingHold flag (blocks AR/invoicing)
  if (load?.isBillingHold) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'BILLING_HOLD',
          message: `Cannot create invoice: Load is on billing hold. ${load.billingHoldReason || 'Rate Con update required.'}`,
          pendingCharges: load.accessorialCharges,
          reason: 'Accessorial charges require Rate Con update before invoicing',
          note: 'Driver settlement (AP) can proceed independently'
        }
      },
      { status: 400 }
    );
  }

  if (load?.status !== 'READY_TO_BILL' && load?.status !== 'DELIVERED') {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: `Cannot create invoice: Load status is ${load?.status}. Load must be READY_TO_BILL.`
        }
      },
      { status: 400 }
    );
  }

  // ... continue with invoice creation ...
}
```

### File: `app/api/settlements/route.ts` (UPDATE EXISTING)

```typescript
/**
 * POST /api/settlements
 * Create driver settlement
 * 
 * CRITICAL FIX: Billing hold does NOT block settlement
 */
export async function POST(request: NextRequest) {
  // ... existing validation ...

  const { loadIds } = await request.json();

  // Check each load for settlement eligibility
  const settlementManager = new SettlementManager();
  const eligibilityResults = await Promise.all(
    loadIds.map(loadId => settlementManager.isLoadEligibleForSettlement(loadId))
  );

  // Filter out ineligible loads
  const eligibleLoads = loadIds.filter((_, index) => 
    eligibilityResults[index].eligible
  );

  const ineligibleLoads = loadIds.filter((_, index) => 
    !eligibilityResults[index].eligible
  );

  // CRITICAL: Warn about billing holds but allow settlement
  const billingHoldLoads = eligibleLoads.filter(loadId => {
    const result = eligibilityResults[loadIds.indexOf(loadId)];
    return result.canProceedWithHold;
  });

  if (billingHoldLoads.length > 0) {
    // Log warning but proceed
    console.warn(`Settling ${billingHoldLoads.length} load(s) on billing hold. Invoice blocked, settlement allowed.`);
  }

  // Calculate settlements for eligible loads
  const settlements = await Promise.all(
    eligibleLoads.map(loadId => settlementManager.calculateSettlement(loadId))
  );

  // ... create settlement records ...

  return NextResponse.json({
    success: true,
    data: {
      settlements,
      warnings: billingHoldLoads.length > 0 
        ? [`${billingHoldLoads.length} load(s) on billing hold - settlement allowed, invoice blocked`]
        : undefined,
      ineligibleLoads: ineligibleLoads.length > 0 ? ineligibleLoads : undefined
    }
  });
}
```

---

## 6. Key Business Rules Summary

### Detention Clock Logic

1. **Billable Clock Start:** `Math.max(ActualArrival, ScheduledAppointment)`
   - If driver arrives early: Clock starts at appointment time
   - If driver arrives late: Clock starts at arrival time (flag as "At Risk")
   - If no appointment: Clock starts at arrival time (legacy behavior)

2. **Early Arrival Protection:** Prevents false billing when drivers arrive early

3. **Late Driver Flag:** When `ActualArrival > ScheduledAppointment`, flag detention as "At Risk"

### Billing Hold Workflow

1. **AR vs AP Decoupling:**
   - `isBillingHold = true` → Blocks **Customer Invoicing (AR)**
   - `isBillingHold = true` → **ALLOWS Driver Settlement (AP)**
   - Drivers get base pay even if invoice is held

2. **Settlement Logic:**
   - Base driver pay: Always included
   - Approved accessorials: Included in settlement
   - Pending accessorials: Added to next settlement when approved

3. **Status vs Flag:**
   - `isBillingHold` flag: Controls invoicing
   - `status`: Can be `READY_TO_BILL` even with `isBillingHold = true`

### Schema Fields Usage

- `Load.isBillingHold`: Boolean flag that blocks invoicing
- `Load.billingHoldReason`: String explaining why hold was set
- `Load.detentionStartStrategy`: Enum for how detention clock starts
- `LoadStop.billableDetentionMinutes`: Calculated detention time
- `LoadStop.detentionClockStart`: When billable clock actually started

---

**End of Pseudo-Code Documentation**

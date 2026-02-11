/**
 * DetentionManager
 * 
 * Handles automatic detection and calculation of detention charges
 * when drivers exceed free time at pickup/delivery locations.
 * 
 * CRITICAL FIX: Handles "Early Arrival" trap - clock starts at Math.max(Arrival, Appointment)
 * 
 * NOTE: This file contains @ts-ignore comments for new Prisma fields that will be resolved
 * after running the migration to add detentionFreeTimeHours and detentionRate to Customer model.
 */
import { prisma } from '@/lib/prisma';
import { notifyDetentionDetected, notifyBillingHold } from '@/lib/notifications/triggers';
import { getTelegramNotificationService } from '../services/TelegramNotificationService';

interface DetentionCheckResult {
  detentionDetected: boolean;
  detentionHours?: number;
  billableDetentionMinutes?: number;
  chargeId?: string;
  billingHoldSet?: boolean;
  driverLate?: boolean;
  clockStartReason?: string;
  billableClockStart?: string;
  existingCharge?: boolean;
  reason?: string;
}

export class DetentionManager {
  private readonly DEFAULT_FREE_TIME_HOURS = 2;
  private readonly DEFAULT_DETENTION_RATE = 50; // $50/hour

  /**
   * Get system configuration for detention settings
   */
  private async getSystemConfig(companyId: string) {
    try {
      // Use type assertion until Prisma client is regenerated after migration
      const config = await (prisma as any).systemConfig?.findUnique({
        where: { companyId },
        select: {
          defaultDetentionRate: true,
          defaultFreeTimeMinutes: true,
        },
      });

      return {
        detentionRate: config?.defaultDetentionRate || this.DEFAULT_DETENTION_RATE,
        freeTimeMinutes: config?.defaultFreeTimeMinutes || (this.DEFAULT_FREE_TIME_HOURS * 60),
        freeTimeHours: (config?.defaultFreeTimeMinutes || (this.DEFAULT_FREE_TIME_HOURS * 60)) / 60,
      };
    } catch (error) {
      // Fallback to defaults if SystemConfig table doesn't exist yet
      return {
        detentionRate: this.DEFAULT_DETENTION_RATE,
        freeTimeMinutes: this.DEFAULT_FREE_TIME_HOURS * 60,
        freeTimeHours: this.DEFAULT_FREE_TIME_HOURS,
      };
    }
  }

  /**
   * Alias for checkDetentionOnDeparture - provides consistent API
   */
  async calculate(
    loadStopId: string,
    options?: {
      freeTimeHours?: number;
      customerId?: string;
    }
  ): Promise<DetentionCheckResult> {
    return this.checkDetentionOnDeparture(loadStopId, options);
  }

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
    // @ts-ignore - Prisma types will be updated after migration for new Customer fields
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
    }) as any; // Type assertion to work around Prisma type inference issues

    if (!stop || !stop.load) {
      return {
        detentionDetected: false,
        reason: 'Stop or load not found'
      };
    }

    // Type narrowing - ensure load and customer exist
    const load = stop.load as typeof stop.load & {
      customer: {
        id: string;
        detentionFreeTimeHours?: number | null;
        detentionRate?: number | null;
      };
    };
    if (!load.customer) {
      return {
        detentionDetected: false,
        reason: 'Customer not found for load'
      };
    }

    // STEP 2: Validate we have both arrival and departure times
    if (!stop.actualArrival || !stop.actualDeparture) {
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

    // Get system config for default values
    const systemConfig = await this.getSystemConfig(load.companyId);

    // Get free time threshold (customer-specific or system default)
    // Use type assertion for new fields until Prisma types are fully updated
    const customer = load.customer as typeof load.customer & {
      detentionFreeTimeHours?: number | null;
      detentionRate?: number | null;
    };
    const freeTimeHours =
      options?.freeTimeHours ||
      customer.detentionFreeTimeHours ||
      systemConfig.freeTimeHours;

    // Calculate billable detention (excess beyond free time)
    const detentionHours = Math.max(0, totalHours - freeTimeHours);
    const billableDetentionMinutes = Math.round(detentionHours * 60);

    // STEP 6: Update LoadStop with detention calculation details (even if no detention)
    await prisma.loadStop.update({
      where: { id: loadStopId },
      data: {
        billableDetentionMinutes: billableDetentionMinutes || 0,
        detentionClockStart: billableClockStart,
      },
    });

    // STEP 7: If detention detected, create charge and alert
    if (detentionHours > 0) {
      // Check if detention charge already exists (prevent duplicates)
      if (load.accessorialCharges.length > 0) {
        return {
          detentionDetected: true,
          detentionHours,
          billableDetentionMinutes,
          existingCharge: true,
          chargeId: load.accessorialCharges[0].id,
          driverLate,
          clockStartReason,
          billableClockStart: billableClockStart.toISOString()
        };
      }

      // Get detention rate (customer-specific or system default)
      const detentionRate = customer.detentionRate || systemConfig.detentionRate;

      // STEP 8: Create pending accessorial charge
      const charge = await prisma.accessorialCharge.create({
        data: {
          companyId: load.companyId,
          loadId: load.id,
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
      await this.notifyDispatch(load, detentionHours, stop, driverLate, clockStartReason);

      // STEP 10: Set billing hold if load is delivered (AR hold only, not AP)
      const loadStatus = load.status;
      if (loadStatus === 'DELIVERED' || loadStatus === 'READY_TO_BILL') {
        const billingHoldReason = this.buildBillingHoldReason(driverLate, detentionHours);
        await this.setBillingHold(load.id, {
          reason: billingHoldReason,
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

    return {
      detentionDetected: false,
      reason: 'Within free time threshold',
      billableClockStart: billableClockStart.toISOString(),
      driverLate
    };
  }

  /**
   * Real-time handler for geofence entry events.
   * Triggered by LoadLocationTrackingService or Mobile App.
   */
  async handleGeofenceEntry(
    loadStopId: string,
    arrivalDate: Date = new Date()
  ): Promise<void> {
    const stop = await prisma.loadStop.findUnique({
      where: { id: loadStopId },
      include: {
        load: {
          include: {
            driver: {
              include: { user: { select: { firstName: true, lastName: true } } }
            }
          }
        }
      }
    });

    if (!stop?.load) return;

    // Calculate the billable clock start (max of arrival and appointment)
    const scheduledTime = stop.earliestArrival || stop.latestArrival;
    const billableClockStart = scheduledTime
      ? new Date(Math.max(arrivalDate.getTime(), new Date(scheduledTime).getTime()))
      : arrivalDate;

    // Update stop with arrival data
    await prisma.loadStop.update({
      where: { id: loadStopId },
      data: {
        actualArrival: arrivalDate,
        detentionClockStart: billableClockStart,
      }
    });

    // Notify via Telegram
    const notificationService = getTelegramNotificationService();
    const driverName = `${stop.load.driver?.user?.firstName || ''} ${stop.load.driver?.user?.lastName || ''}`.trim();

    await notificationService.notifyDetentionStart({
      loadNumber: stop.load.loadNumber,
      location: stop.company || stop.address,
      driverName: driverName || 'Unknown Driver'
    });

    console.log(`[DetentionManager] Geofence entry handled for stop ${loadStopId}. Clock starts at ${billableClockStart.toISOString()}`);
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
    stop: any
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
   * HELPER: Build billing hold reason with late arrival flag
   */
  private buildBillingHoldReason(driverLate: boolean, detentionHours: number): string {
    let reason = `Detention charge detected (${detentionHours.toFixed(2)} hours)`;

    if (driverLate) {
      reason += ' - ⚠️ DRIVER LATE: Detention may be at risk if broker disputes. Rate Con update required.';
    } else {
      reason += ' - Rate Con update required.';
    }

    return reason;
  }

  /**
   * HELPER: Notify dispatch when detention detected
   */
  private async notifyDispatch(
    load: any,
    detentionHours: number,
    stop: any,
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
        billingHoldReason: context.reason, // NEW: Reason field (includes late arrival flag)
        accountingSyncStatus: 'REQUIRES_REVIEW',
        dispatchNotes: `BILLING HOLD (AR): ${context.reason} - Rate Con update required before invoicing.\n` +
          `NOTE: Driver settlement (AP) can proceed independently.\n` +
          `${new Date().toISOString()}`
      },
    });

    // Notify accounting department
    await notifyBillingHold({
      loadId,
      loadNumber: (await prisma.load.findUnique({ where: { id: loadId }, select: { loadNumber: true } }))?.loadNumber || '',
      reason: context.reason,
      accessorialChargeId: context.accessorialChargeId,
      requiresRateConUpdate: context.requiresRateConUpdate,
      blocksInvoicing: true,
      allowsSettlement: true // CRITICAL: Settlement can proceed
    });
  }
}


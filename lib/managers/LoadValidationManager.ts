/**
 * LoadValidationManager
 *
 * Pre-creation validation for loads:
 * - Customer credit check (outstanding balance vs credit limit)
 * - Equipment vs commodity compatibility
 * - Driver hazmat certification verification
 * - Route accessibility (special permit states)
 * - Duplicate load detection
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
import { InvoiceStatus, EquipmentType } from '@prisma/client';

// ----- Types -----

export interface PreCreationInput {
  customerId: string;
  companyId: string;
  driverId?: string | null;
  equipmentType: EquipmentType;
  commodity?: string | null;
  hazmat?: boolean;
  pickupCity?: string | null;
  pickupState?: string | null;
  deliveryCity?: string | null;
  deliveryState?: string | null;
  pickupDate?: Date | string | null;
  revenue?: number;
}

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

export interface DuplicateResult {
  hasDuplicates: boolean;
  matchingLoadNumbers: string[];
}

// ----- Constants -----

/** States requiring oversize/overweight permits for standard loads */
const PERMIT_REQUIRED_STATES: Record<string, string> = {
  NY: 'New York City requires special entry permits for commercial vehicles',
  CA: 'California requires CARB compliance for trucks entering the state',
  OR: 'Oregon requires weight-distance tax permits for heavy trucks',
  NM: 'New Mexico requires weight-distance tax permits for heavy trucks',
  KY: 'Kentucky requires weight-distance tax permits (KYU)',
};

/** Commodities that typically require hazmat endorsement */
const HAZMAT_KEYWORDS = [
  'hazmat', 'hazardous', 'flammable', 'explosive', 'corrosive',
  'toxic', 'radioactive', 'oxidizer', 'poison', 'compressed gas',
  'chemical', 'petroleum', 'gasoline', 'propane', 'ammonia',
];

/** Equipment types suited for temperature-controlled commodities */
const TEMP_CONTROLLED_EQUIPMENT: EquipmentType[] = ['REEFER'];

/** Commodities requiring temperature-controlled equipment */
const TEMP_CONTROLLED_KEYWORDS = [
  'frozen', 'refrigerated', 'chilled', 'perishable', 'produce',
  'dairy', 'meat', 'seafood', 'pharmaceutical', 'vaccine',
  'ice cream', 'fresh', 'cold chain',
];

/** Equipment types suited for oversized/heavy loads */
const FLATBED_EQUIPMENT: EquipmentType[] = ['FLATBED', 'STEP_DECK', 'LOWBOY'];

/** Commodities typically requiring flatbed equipment */
const FLATBED_KEYWORDS = [
  'lumber', 'steel', 'machinery', 'equipment', 'pipe',
  'construction', 'beam', 'coil', 'concrete', 'transformer',
];

// ----- Manager -----

export class LoadValidationManager {
  /**
   * Run all pre-creation validations for a new load.
   * Returns warnings (non-blocking) and errors (blocking).
   */
  static async validatePreCreation(input: PreCreationInput): Promise<ValidationResult> {
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      const checks = await Promise.allSettled([
        this.checkCustomerCredit(input.customerId, input.revenue),
        this.checkEquipmentCommodity(input.equipmentType, input.commodity),
        this.checkDriverHazmat(input.driverId, input.hazmat, input.commodity),
        this.checkRouteAccessibility(input.pickupState, input.deliveryState),
      ]);

      for (const result of checks) {
        if (result.status === 'fulfilled') {
          warnings.push(...result.value.warnings);
          errors.push(...result.value.errors);
        } else {
          logger.error('Pre-creation check failed', {
            reason: result.reason instanceof Error ? result.reason.message : String(result.reason),
          });
        }
      }
    } catch (error) {
      logger.error('LoadValidationManager.validatePreCreation failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return {
      valid: errors.length === 0,
      warnings,
      errors,
    };
  }

  /**
   * Check if customer has outstanding balance exceeding credit limit.
   */
  static async checkCustomerCredit(
    customerId: string,
    loadRevenue?: number
  ): Promise<ValidationResult> {
    const warnings: string[] = [];
    const errors: string[] = [];

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        name: true,
        creditLimit: true,
        creditHold: true,
        creditHoldReason: true,
        creditAlertThreshold: true,
      },
    });

    if (!customer) {
      errors.push('Customer not found');
      return { valid: false, warnings, errors };
    }

    // Hard block: customer on credit hold
    if (customer.creditHold) {
      errors.push(
        `Customer "${customer.name}" is on credit hold${customer.creditHoldReason ? `: ${customer.creditHoldReason}` : ''}`
      );
    }

    // Soft check: outstanding balance vs credit limit
    if (customer.creditLimit && customer.creditLimit > 0) {
      const agg = await prisma.invoice.aggregate({
        where: {
          customerId,
          status: {
            in: [InvoiceStatus.DRAFT, InvoiceStatus.SENT, InvoiceStatus.PARTIAL, InvoiceStatus.OVERDUE],
          },
          balance: { gt: 0 },
        },
        _sum: { balance: true },
      });

      const outstanding = agg._sum?.balance || 0;
      const projectedBalance = outstanding + (loadRevenue || 0);
      const percentUsed = (projectedBalance / customer.creditLimit) * 100;
      const threshold = customer.creditAlertThreshold || 80;

      if (projectedBalance > customer.creditLimit) {
        warnings.push(
          `Customer "${customer.name}" will exceed credit limit. ` +
          `Projected balance: $${projectedBalance.toFixed(2)} / $${customer.creditLimit.toFixed(2)} limit`
        );
      } else if (percentUsed >= threshold) {
        warnings.push(
          `Customer "${customer.name}" is at ${percentUsed.toFixed(0)}% of credit limit ` +
          `($${projectedBalance.toFixed(2)} / $${customer.creditLimit.toFixed(2)})`
        );
      }
    }

    return { valid: errors.length === 0, warnings, errors };
  }

  /**
   * Check if the selected equipment type is compatible with the commodity.
   */
  static async checkEquipmentCommodity(
    equipmentType: EquipmentType,
    commodity?: string | null
  ): Promise<ValidationResult> {
    const warnings: string[] = [];
    const errors: string[] = [];

    if (!commodity) return { valid: true, warnings, errors };

    const commodityLower = commodity.toLowerCase();

    // Check: temperature-controlled commodity on non-reefer equipment
    const needsTemp = TEMP_CONTROLLED_KEYWORDS.some((kw) => commodityLower.includes(kw));
    if (needsTemp && !TEMP_CONTROLLED_EQUIPMENT.includes(equipmentType)) {
      warnings.push(
        `Commodity "${commodity}" typically requires refrigerated equipment, ` +
        `but equipment type is ${equipmentType.replace(/_/g, ' ')}`
      );
    }

    // Check: flatbed commodity on enclosed trailer
    const needsFlatbed = FLATBED_KEYWORDS.some((kw) => commodityLower.includes(kw));
    if (needsFlatbed && !FLATBED_EQUIPMENT.includes(equipmentType)) {
      warnings.push(
        `Commodity "${commodity}" may require flatbed-style equipment, ` +
        `but equipment type is ${equipmentType.replace(/_/g, ' ')}`
      );
    }

    return { valid: true, warnings, errors };
  }

  /**
   * Verify driver has hazmat endorsement if load carries hazmat cargo.
   */
  static async checkDriverHazmat(
    driverId?: string | null,
    hazmat?: boolean,
    commodity?: string | null
  ): Promise<ValidationResult> {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Determine if hazmat is involved
    const isHazmat = hazmat || (commodity && HAZMAT_KEYWORDS.some(
      (kw) => commodity.toLowerCase().includes(kw)
    ));

    if (!isHazmat || !driverId) return { valid: true, warnings, errors };

    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      select: {
        driverNumber: true,
        endorsements: true,
        user: { select: { firstName: true, lastName: true } },
      },
    });

    if (!driver) {
      warnings.push('Assigned driver not found — cannot verify hazmat endorsement');
      return { valid: true, warnings, errors };
    }

    const hasHazmatEndorsement = driver.endorsements.some(
      (e) => e.toUpperCase() === 'H' || e.toUpperCase() === 'X'
    );

    if (!hasHazmatEndorsement) {
      const driverName = driver.user
        ? `${driver.user.firstName} ${driver.user.lastName}`
        : `Driver #${driver.driverNumber}`;

      errors.push(
        `${driverName} does not have a Hazmat endorsement (H or X). ` +
        `Current endorsements: ${driver.endorsements.length > 0 ? driver.endorsements.join(', ') : 'none'}`
      );
    }

    return { valid: errors.length === 0, warnings, errors };
  }

  /**
   * Check if origin/destination states require special permits or compliance.
   */
  static async checkRouteAccessibility(
    pickupState?: string | null,
    deliveryState?: string | null
  ): Promise<ValidationResult> {
    const warnings: string[] = [];
    const errors: string[] = [];

    const states = [pickupState, deliveryState].filter(Boolean) as string[];

    for (const state of states) {
      const stateUpper = state.toUpperCase().trim();
      if (PERMIT_REQUIRED_STATES[stateUpper]) {
        warnings.push(PERMIT_REQUIRED_STATES[stateUpper]);
      }
    }

    return { valid: true, warnings, errors };
  }

  /**
   * Detect potential duplicate loads based on customer, route, and pickup date.
   * Matches loads with the same customer + origin city/state + destination city/state
   * on the same day.
   */
  static async detectDuplicates(
    companyId: string,
    customerId: string,
    originCity?: string | null,
    originState?: string | null,
    destinationCity?: string | null,
    destinationState?: string | null,
    pickupDate?: Date | string | null
  ): Promise<DuplicateResult> {
    try {
      if (!originCity && !originState && !destinationCity && !destinationState) {
        return { hasDuplicates: false, matchingLoadNumbers: [] };
      }

      const where: Record<string, unknown> = {
        companyId,
        customerId,
        deletedAt: null,
      };

      if (originCity) where.pickupCity = { equals: originCity, mode: 'insensitive' };
      if (originState) where.pickupState = { equals: originState, mode: 'insensitive' };
      if (destinationCity) where.deliveryCity = { equals: destinationCity, mode: 'insensitive' };
      if (destinationState) where.deliveryState = { equals: destinationState, mode: 'insensitive' };

      // Match same day if pickupDate provided
      if (pickupDate) {
        const date = new Date(pickupDate);
        if (!isNaN(date.getTime())) {
          const dayStart = new Date(date);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(date);
          dayEnd.setHours(23, 59, 59, 999);
          where.pickupDate = { gte: dayStart, lte: dayEnd };
        }
      }

      const matches = await prisma.load.findMany({
        where: where as any,
        select: { loadNumber: true },
        take: 10,
      });

      return {
        hasDuplicates: matches.length > 0,
        matchingLoadNumbers: matches.map((m) => m.loadNumber),
      };
    } catch (error) {
      logger.error('LoadValidationManager.detectDuplicates failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return { hasDuplicates: false, matchingLoadNumbers: [] };
    }
  }
}

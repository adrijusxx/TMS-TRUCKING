/**
 * LoadCreationManager - Handles load creation logic
 * Extracted from app/api/loads/route.ts to comply with 400-line limit
 */

import { Session } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { CreateLoadInput } from '@/lib/validations/load';
import { McStateManager } from '@/lib/managers/McStateManager';
import { calculateDriverPay } from '@/lib/utils/calculateDriverPay';

/**
 * Safely parse a date value - returns null if invalid
 * Fixes: "Invalid value for argument `pickupDate`: Provided Date object is invalid"
 */
export function safeParseDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;

  // If already a valid Date
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  // If string, try to parse
  if (typeof value === 'string') {
    // Empty string check
    if (value.trim() === '') return null;

    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

export interface LoadCreationResult {
  success: boolean;
  data?: unknown;
  error?: {
    code: string;
    message: string;
  };
}

export interface LocationFields {
  pickupLocation: string | null;
  pickupAddress: string | null;
  pickupCity: string | null;
  pickupState: string | null;
  pickupZip: string | null;
  deliveryLocation: string | null;
  deliveryAddress: string | null;
  deliveryCity: string | null;
  deliveryState: string | null;
  deliveryZip: string | null;
}

export interface DateFields {
  pickupDate: Date | null;
  deliveryDate: Date | null;
  pickupTimeStart: Date | null;
  pickupTimeEnd: Date | null;
  deliveryTimeStart: Date | null;
  deliveryTimeEnd: Date | null;
}

/**
 * Extract location and date fields from multi-stop or single-stop load
 */
export function extractLocationAndDateFields(
  validated: CreateLoadInput
): { location: LocationFields; dates: DateFields } {
  const location: LocationFields = {
    pickupLocation: null,
    pickupAddress: null,
    pickupCity: null,
    pickupState: null,
    pickupZip: null,
    deliveryLocation: null,
    deliveryAddress: null,
    deliveryCity: null,
    deliveryState: null,
    deliveryZip: null,
  };

  const dates: DateFields = {
    pickupDate: null,
    deliveryDate: null,
    pickupTimeStart: null,
    pickupTimeEnd: null,
    deliveryTimeStart: null,
    deliveryTimeEnd: null,
  };

  if (validated.stops && validated.stops.length > 0) {
    // Multi-stop load
    const pickups = validated.stops
      .filter(s => s.stopType === 'PICKUP')
      .sort((a, b) => a.sequence - b.sequence);
    const deliveries = validated.stops
      .filter(s => s.stopType === 'DELIVERY')
      .sort((a, b) => a.sequence - b.sequence);

    if (pickups.length > 0) {
      const firstPickup = pickups[0];
      location.pickupLocation = firstPickup.company || null;
      location.pickupAddress = firstPickup.address || null;
      location.pickupCity = firstPickup.city || null;
      location.pickupState = firstPickup.state || null;
      location.pickupZip = firstPickup.zip || null;
      // Use safeParseDate to avoid "Invalid Date" errors
      dates.pickupDate = safeParseDate(firstPickup.earliestArrival);
      dates.pickupTimeStart = safeParseDate(firstPickup.earliestArrival);
      dates.pickupTimeEnd = safeParseDate(firstPickup.latestArrival);
    }

    if (deliveries.length > 0) {
      const lastDelivery = deliveries[deliveries.length - 1];
      location.deliveryLocation = lastDelivery.company || null;
      location.deliveryAddress = lastDelivery.address || null;
      location.deliveryCity = lastDelivery.city || null;
      location.deliveryState = lastDelivery.state || null;
      location.deliveryZip = lastDelivery.zip || null;
      // Use safeParseDate to avoid "Invalid Date" errors
      dates.deliveryDate = safeParseDate(lastDelivery.latestArrival);
      dates.deliveryTimeStart = safeParseDate(lastDelivery.earliestArrival);
      dates.deliveryTimeEnd = safeParseDate(lastDelivery.latestArrival);
    }
  } else {
    // Single-stop load - use safeParseDate for all date fields
    location.pickupLocation = validated.pickupLocation || null;
    location.pickupAddress = validated.pickupAddress || null;
    location.pickupCity = validated.pickupCity || null;
    location.pickupState = validated.pickupState || null;
    location.pickupZip = validated.pickupZip || null;
    location.deliveryLocation = validated.deliveryLocation || null;
    location.deliveryAddress = validated.deliveryAddress || null;
    location.deliveryCity = validated.deliveryCity || null;
    location.deliveryState = validated.deliveryState || null;
    location.deliveryZip = validated.deliveryZip || null;

    dates.pickupDate = safeParseDate(validated.pickupDate);
    dates.deliveryDate = safeParseDate(validated.deliveryDate);
    dates.pickupTimeStart = safeParseDate(validated.pickupTimeStart);
    dates.pickupTimeEnd = safeParseDate(validated.pickupTimeEnd);
    dates.deliveryTimeStart = safeParseDate(validated.deliveryTimeStart);
    dates.deliveryTimeEnd = safeParseDate(validated.deliveryTimeEnd);
  }

  return { location, dates };
}

/**
 * Determine MC number assignment for new load
 */
export async function determineMcNumberAssignment(
  session: Session,
  bodyMcNumberId: string | undefined,
  request?: any
): Promise<{ mcNumberId: string | null; error?: LoadCreationResult }> {
  const isAdmin = session.user.role === 'ADMIN';
  const userMcAccess = McStateManager.getMcAccess(session);
  let assignedMcNumberId: string | null = null;

  console.log('[LoadCreationManager] determineMcNumberAssignment called:', {
    bodyMcNumberId,
    isAdmin,
    userMcAccess,
    hasRequest: !!request,
  });

  if (bodyMcNumberId) {
    // User provided mcNumberId - validate access
    if (await McStateManager.canAccessMc(session, bodyMcNumberId)) {
      assignedMcNumberId = bodyMcNumberId;
      console.log('[LoadCreationManager] Using bodyMcNumberId:', assignedMcNumberId);
    } else {
      return {
        mcNumberId: null,
        error: {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have access to the selected MC number',
          },
        },
      };
    }
  } else {
    // No mcNumberId provided - use active selection from dropdown (via cookies)
    // This respects the user's current MC filter selection
    assignedMcNumberId = await McStateManager.determineActiveCreationMc(session, request);
    console.log('[LoadCreationManager] determineActiveCreationMc returned:', assignedMcNumberId);

    // If still no MC, fall back to user's default or company default
    if (!assignedMcNumberId) {
      assignedMcNumberId = (session.user as { mcNumberId?: string }).mcNumberId || null;
      console.log('[LoadCreationManager] Fell back to user.mcNumberId:', assignedMcNumberId);
    }

    // Validate default MC is accessible
    if (assignedMcNumberId && !(await McStateManager.canAccessMc(session, assignedMcNumberId))) {
      if (userMcAccess.length > 0) {
        assignedMcNumberId = userMcAccess[0];
      } else if (isAdmin) {
        const defaultMc = await prisma.mcNumber.findFirst({
          where: {
            companyId: session.user.companyId!,
            isDefault: true,
            deletedAt: null,
          },
        });
        assignedMcNumberId = defaultMc?.id || null;
      } else {
        return {
          mcNumberId: null,
          error: {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'No accessible MC number found. Please contact an administrator.',
            },
          },
        };
      }
    } else if (!assignedMcNumberId && userMcAccess.length > 0) {
      assignedMcNumberId = userMcAccess[0];
    } else if (!assignedMcNumberId && isAdmin) {
      const defaultMc = await prisma.mcNumber.findFirst({
        where: {
          companyId: session.user.companyId!,
          isDefault: true,
          deletedAt: null,
        },
      });
      assignedMcNumberId = defaultMc?.id || null;
    }
  }

  console.log('[LoadCreationManager] Final assignedMcNumberId:', assignedMcNumberId);
  return { mcNumberId: assignedMcNumberId };
}

/**
 * Validate driver and calculate driver pay
 */
export async function validateDriverAndCalculatePay(
  driverId: string,
  fallbackMcNumberId?: string | null
): Promise<{ driverPay: number | null; error?: LoadCreationResult; driver?: unknown }> {
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    select: {
      mcNumberId: true,
      payType: true,
      payRate: true,
    },
  });

  if (!driver) {
    return {
      driverPay: null,
      error: {
        success: false,
        error: {
          code: 'INVALID_DRIVER',
          message: 'Driver not found',
        },
      },
    };
  }

  if (!driver.mcNumberId) {
    if (!fallbackMcNumberId) {
      return {
        driverPay: null,
        error: {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Selected driver must have an MC number assigned. Please assign an MC number to the driver first.',
          },
        },
      };
    }
    // If fallbackMcNumberId provided, we allow it (driver assumes Load's MC context)
  }

  return { driverPay: null, driver };
}

/**
 * Calculate driver pay based on driver's pay configuration
 */
export function computeDriverPay(
  driver: { payType: string | null; payRate: number | null },
  loadData: { totalMiles?: number | null; loadedMiles?: number | null; emptyMiles?: number | null; revenue?: number | null }
): number | null {
  if (driver.payType && driver.payRate !== null && driver.payRate !== undefined) {
    return calculateDriverPay(
      { payType: driver.payType as any, payRate: driver.payRate },
      {
        totalMiles: loadData.totalMiles ?? null,
        loadedMiles: loadData.loadedMiles ?? null,
        emptyMiles: loadData.emptyMiles ?? null,
        revenue: loadData.revenue ?? null,
      }
    );
  }
  return null;
}

/**
 * Build the Prisma create data for a load
 */
export function buildLoadCreateData(
  validated: CreateLoadInput,
  session: Session,
  location: LocationFields,
  dates: DateFields,
  assignedMcNumberId: string | null,
  calculatedDriverPay: number | null
): Record<string, unknown> {
  const { stops, loadedMiles, emptyMiles, totalMiles, ...loadData } = validated;

  const loadCreateData: Record<string, unknown> = {
    ...loadData,
    // Location fields
    pickupLocation: location.pickupLocation || loadData.pickupLocation || null,
    pickupAddress: location.pickupAddress || loadData.pickupAddress || null,
    pickupCity: location.pickupCity || loadData.pickupCity || null,
    pickupState: location.pickupState || loadData.pickupState || null,
    pickupZip: location.pickupZip || loadData.pickupZip || null,
    deliveryLocation: location.deliveryLocation || loadData.deliveryLocation || null,
    deliveryAddress: location.deliveryAddress || loadData.deliveryAddress || null,
    deliveryCity: location.deliveryCity || loadData.deliveryCity || null,
    deliveryState: location.deliveryState || loadData.deliveryState || null,
    deliveryZip: location.deliveryZip || loadData.deliveryZip || null,
    // Date fields
    pickupDate: dates.pickupDate,
    deliveryDate: dates.deliveryDate,
    pickupTimeStart: dates.pickupTimeStart,
    pickupTimeEnd: dates.pickupTimeEnd,
    deliveryTimeStart: dates.deliveryTimeStart,
    deliveryTimeEnd: dates.deliveryTimeEnd,
    // Miles
    loadedMiles: loadedMiles ?? null,
    emptyMiles: emptyMiles ?? null,
    totalMiles: totalMiles ?? (loadedMiles != null && emptyMiles != null ? loadedMiles + emptyMiles : null),
    // Company and status
    companyId: session.user.companyId,
    status: 'PENDING',
    // Assignments
    driverId: loadData.driverId || null,
    truckId: loadData.truckId || null,
    trailerId: loadData.trailerId || null,
    mcNumberId: assignedMcNumberId,
    // Numeric fields
    weight: loadData.weight || 0,
    revenue: loadData.revenue || 0,
    fuelAdvance: loadData.fuelAdvance || 0,
    expenses: 0,
    driverPay: calculatedDriverPay ?? (loadData.driverPay ?? 0),
    hazmat: loadData.hazmat || false,
    // Contact fields
    pickupCompany: loadData.pickupCompany || null,
    pickupContact: loadData.pickupContact || null,
    pickupPhone: loadData.pickupPhone || null,
    pickupNotes: loadData.pickupNotes || null,
    deliveryCompany: loadData.deliveryCompany || null,
    deliveryContact: loadData.deliveryContact || null,
    deliveryPhone: loadData.deliveryPhone || null,
    deliveryNotes: loadData.deliveryNotes || null,
    // Specifications
    pallets: loadData.pallets || null,
    temperature: loadData.temperature || null,
    hazmatClass: loadData.hazmatClass || null,
    // Financial
    serviceFee: loadData.serviceFee || null,
    revenuePerMile: loadData.revenuePerMile || null,
    // Additional assignments
    coDriverId: loadData.coDriverId || null,
    dispatcherId: loadData.dispatcherId || null,
    tripId: loadData.tripId || null,
    shipmentId: loadData.shipmentId || null,
  };

  // Add stops if provided - use safeParseDate to avoid "Invalid Date" errors
  if (stops && stops.length > 0) {
    loadCreateData.stops = {
      create: stops.map((stop) => ({
        stopType: stop.stopType,
        sequence: stop.sequence,
        company: stop.company || null,
        address: stop.address,
        city: stop.city,
        state: stop.state,
        zip: stop.zip,
        phone: stop.phone || null,
        earliestArrival: safeParseDate(stop.earliestArrival),
        latestArrival: safeParseDate(stop.latestArrival),
        contactName: stop.contactName || null,
        contactPhone: stop.contactPhone || null,
        items: stop.items ? stop.items : null,
        totalPieces: stop.totalPieces || null,
        totalWeight: stop.totalWeight || null,
        notes: stop.notes || null,
        specialInstructions: stop.specialInstructions || null,
      })),
    };
  }

  return loadCreateData;
}

/**
 * Check if load number already exists
 */
export async function checkLoadNumberExists(
  loadNumber: string,
  companyId: string
): Promise<boolean> {
  const existingLoad = await prisma.load.findFirst({
    where: {
      loadNumber,
      companyId,
      deletedAt: null,
    },
  });
  return !!existingLoad;
}


/**
 * Automated Load Status Updates
 *
 * Automatically updates load statuses based on dates and conditions.
 *
 * Guards:
 *  - Skips loads imported within the last 24 hours (let user review first)
 *  - Skips loads with pickup dates > 7 days in the past (stale/historical)
 *  - Only advances loads that have a driver assigned
 *  - Uses correct location per status phase (pickup vs delivery)
 */

import { prisma } from '../prisma';
import { createActivityLog } from '../activity-log';
import { LoadStatus } from '@prisma/client';

/** Max days past pickup date before we consider a load stale and stop auto-updating */
const STALE_THRESHOLD_DAYS = 7;

/** Min hours after import before auto-updates kick in */
const IMPORT_COOLDOWN_HOURS = 24;

/**
 * Automatically update load statuses based on pickup/delivery dates
 */
export async function autoUpdateLoadStatuses(companyId: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Loads eligible for date-based auto-updates
  const loadsToUpdate = await prisma.load.findMany({
    where: {
      companyId,
      deletedAt: null,
      // Must have a driver assigned — unassigned loads shouldn't auto-progress
      driverId: { not: null },
      status: {
        in: ['ASSIGNED', 'EN_ROUTE_PICKUP', 'AT_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY'],
      },
    },
    include: {
      driver: true,
      truck: true,
    },
  });

  const updates: Array<{ id: string; oldStatus: LoadStatus; newStatus: LoadStatus }> = [];

  for (const load of loadsToUpdate) {
    // Skip loads without required dates
    if (!load.pickupDate || !load.deliveryDate) continue;

    const pickupDate = new Date(load.pickupDate);
    const deliveryDate = new Date(load.deliveryDate);
    const pickupDateOnly = new Date(
      pickupDate.getFullYear(),
      pickupDate.getMonth(),
      pickupDate.getDate()
    );
    const deliveryDateOnly = new Date(
      deliveryDate.getFullYear(),
      deliveryDate.getMonth(),
      deliveryDate.getDate()
    );

    // Guard: Skip loads with stale pickup dates (> STALE_THRESHOLD_DAYS in the past)
    // These are likely historical loads that shouldn't be auto-updated
    const daysSincePickup = Math.floor(
      (today.getTime() - pickupDateOnly.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSincePickup > STALE_THRESHOLD_DAYS) continue;

    // Guard: Skip recently imported loads (give user time to review/correct)
    const hoursSinceCreation = (now.getTime() - new Date(load.createdAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation < IMPORT_COOLDOWN_HOURS) continue;

    // Guard: Delivery date must be >= pickup date (sanity check)
    if (deliveryDateOnly < pickupDateOnly) continue;

    let newStatus: LoadStatus | null = null;

    // Auto-update based on dates — one step at a time
    if (load.status === 'ASSIGNED') {
      // If pickup date is today or past, mark as en route to pickup
      if (pickupDateOnly <= today) {
        newStatus = 'EN_ROUTE_PICKUP';
      }
    } else if (load.status === 'EN_ROUTE_PICKUP') {
      // If pickup date is past, mark as at pickup
      if (pickupDateOnly < today) {
        newStatus = 'AT_PICKUP';
      }
    } else if (load.status === 'AT_PICKUP') {
      // If pickup date is past, assume loaded
      if (pickupDateOnly < today) {
        newStatus = 'LOADED';
      }
    } else if (load.status === 'LOADED') {
      // If delivery date is today or past, mark as en route to delivery
      if (deliveryDateOnly <= today) {
        newStatus = 'EN_ROUTE_DELIVERY';
      }
    } else if (load.status === 'EN_ROUTE_DELIVERY') {
      // If delivery date is past, mark as at delivery
      if (deliveryDateOnly < today) {
        newStatus = 'AT_DELIVERY';
      }
    }

    if (newStatus && newStatus !== load.status) {
      await prisma.load.update({
        where: { id: load.id },
        data: { status: newStatus },
      });

      // Use the correct location based on the status phase
      const isPickupPhase = ['EN_ROUTE_PICKUP', 'AT_PICKUP', 'LOADED'].includes(newStatus);
      const location = isPickupPhase
        ? `${load.pickupCity}, ${load.pickupState}`
        : `${load.deliveryCity}, ${load.deliveryState}`;

      // Create status history
      await prisma.loadStatusHistory.create({
        data: {
          loadId: load.id,
          status: newStatus,
          location,
          notes: 'Automated status update based on dates',
          createdBy: 'system',
        },
      });

      // Create activity log
      await createActivityLog({
        companyId,
        action: 'STATUS_CHANGE',
        entityType: 'Load',
        entityId: load.id,
        description: `Load ${load.loadNumber} status automatically updated from ${load.status} to ${newStatus}`,
        metadata: {
          oldStatus: load.status,
          newStatus,
          reason: 'automated_date_based_update',
        },
      });

      updates.push({
        id: load.id,
        oldStatus: load.status,
        newStatus,
      });
    }
  }

  return {
    updated: updates.length,
    updates,
  };
}

/**
 * Find loads that should be invoiced (delivered but not invoiced)
 */
export async function findLoadsReadyForInvoicing(companyId: string) {
  const loads = await prisma.load.findMany({
    where: {
      companyId,
      status: {
        in: ['DELIVERED'],
      },
      deletedAt: null,
    },
    include: {
      customer: true,
    },
  });

  // Filter out loads that are already in invoices
  const invoices = await prisma.invoice.findMany({
    where: {
      customer: {
        companyId,
      },
    },
    select: {
      loadIds: true,
    },
  });

  const invoicedLoadIds = new Set(
    invoices.flatMap((inv) => inv.loadIds)
  );

  return loads.filter((load) => !invoicedLoadIds.has(load.id));
}

/**
 * Find loads ready for settlement (delivered loads for a driver)
 */
export async function findLoadsReadyForSettlement(
  companyId: string,
  driverId: string,
  startDate?: Date,
  endDate?: Date
) {
  const where: any = {
    companyId,
    driverId,
    status: {
      in: ['DELIVERED', 'INVOICED', 'PAID'],
    },
    deletedAt: null,
  };

  if (startDate || endDate) {
    where.deliveredAt = {};
    if (startDate) where.deliveredAt.gte = startDate;
    if (endDate) where.deliveredAt.lte = endDate;
  }

  const loads = await prisma.load.findMany({
    where,
    orderBy: {
      deliveredAt: 'asc',
    },
  });

  // Filter out loads already in settlements
  const settlements = await prisma.settlement.findMany({
    where: {
      driverId,
    },
    select: {
      loadIds: true,
    },
  });

  const settledLoadIds = new Set(
    settlements.flatMap((settlement) => settlement.loadIds)
  );

  return loads.filter((load) => !settledLoadIds.has(load.id));
}

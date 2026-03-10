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

  // Only select fields needed for status determination — no joins
  const loadsToUpdate = await prisma.load.findMany({
    where: {
      companyId,
      deletedAt: null,
      driverId: { not: null },
      status: {
        in: ['ASSIGNED', 'EN_ROUTE_PICKUP', 'AT_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY'],
      },
    },
    select: {
      id: true,
      status: true,
      loadNumber: true,
      pickupDate: true,
      deliveryDate: true,
      pickupCity: true,
      pickupState: true,
      deliveryCity: true,
      deliveryState: true,
      createdAt: true,
    },
  });

  // Determine which loads need status changes (pure logic, no DB calls)
  const pending: Array<{
    id: string;
    loadNumber: string;
    oldStatus: LoadStatus;
    newStatus: LoadStatus;
    location: string;
  }> = [];

  for (const load of loadsToUpdate) {
    if (!load.pickupDate || !load.deliveryDate) continue;

    const pickupDate = new Date(load.pickupDate);
    const deliveryDate = new Date(load.deliveryDate);
    const pickupDateOnly = new Date(pickupDate.getFullYear(), pickupDate.getMonth(), pickupDate.getDate());
    const deliveryDateOnly = new Date(deliveryDate.getFullYear(), deliveryDate.getMonth(), deliveryDate.getDate());

    const daysSincePickup = Math.floor(
      (today.getTime() - pickupDateOnly.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSincePickup > STALE_THRESHOLD_DAYS) continue;

    const hoursSinceCreation = (now.getTime() - new Date(load.createdAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation < IMPORT_COOLDOWN_HOURS) continue;

    if (deliveryDateOnly < pickupDateOnly) continue;

    const newStatus = determineNewStatus(load.status as LoadStatus, pickupDateOnly, deliveryDateOnly, today);
    if (!newStatus) continue;

    const isPickupPhase = ['EN_ROUTE_PICKUP', 'AT_PICKUP', 'LOADED'].includes(newStatus);
    const location = isPickupPhase
      ? `${load.pickupCity}, ${load.pickupState}`
      : `${load.deliveryCity}, ${load.deliveryState}`;

    pending.push({ id: load.id, loadNumber: load.loadNumber, oldStatus: load.status as LoadStatus, newStatus, location });
  }

  if (pending.length === 0) {
    return { updated: 0, updates: [] };
  }

  // Batch all writes in a single transaction to minimize DB round-trips
  await prisma.$transaction(
    pending.flatMap((p) => [
      prisma.load.update({ where: { id: p.id }, data: { status: p.newStatus } }),
      prisma.loadStatusHistory.create({
        data: {
          loadId: p.id,
          status: p.newStatus,
          location: p.location,
          notes: 'Automated status update based on dates',
          createdBy: 'system',
        },
      }),
      prisma.activityLog.create({
        data: {
          companyId,
          action: 'STATUS_CHANGE',
          entityType: 'Load',
          entityId: p.id,
          description: `Load ${p.loadNumber} status automatically updated from ${p.oldStatus} to ${p.newStatus}`,
          metadata: {
            oldStatus: p.oldStatus,
            newStatus: p.newStatus,
            reason: 'automated_date_based_update',
          },
        },
      }),
    ])
  );

  return {
    updated: pending.length,
    updates: pending.map((p) => ({ id: p.id, oldStatus: p.oldStatus, newStatus: p.newStatus })),
  };
}

/** Determine the next status based on current status and dates */
function determineNewStatus(
  status: LoadStatus,
  pickupDate: Date,
  deliveryDate: Date,
  today: Date
): LoadStatus | null {
  switch (status) {
    case 'ASSIGNED':
      return pickupDate <= today ? 'EN_ROUTE_PICKUP' : null;
    case 'EN_ROUTE_PICKUP':
      return pickupDate < today ? 'AT_PICKUP' : null;
    case 'AT_PICKUP':
      return pickupDate < today ? 'LOADED' : null;
    case 'LOADED':
      return deliveryDate <= today ? 'EN_ROUTE_DELIVERY' : null;
    case 'EN_ROUTE_DELIVERY':
      return deliveryDate < today ? 'AT_DELIVERY' : null;
    default:
      return null;
  }
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

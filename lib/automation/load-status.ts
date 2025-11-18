/**
 * Automated Load Status Updates
 * 
 * Automatically updates load statuses based on dates and conditions
 */

import { prisma } from '../prisma';
import { createActivityLog } from '../activity-log';
import { LoadStatus } from '@prisma/client';

/**
 * Automatically update load statuses based on pickup/delivery dates
 */
export async function autoUpdateLoadStatuses(companyId: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Find loads that need status updates
  const loadsToUpdate = await prisma.load.findMany({
    where: {
      companyId,
      deletedAt: null,
      status: {
        in: ['PENDING', 'ASSIGNED', 'EN_ROUTE_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY'],
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

    let newStatus: LoadStatus | null = null;

    // Auto-update based on dates
    if (load.status === 'PENDING' || load.status === 'ASSIGNED') {
      // If pickup date is today or past, and load is assigned, mark as en route to pickup
      if (load.driverId && pickupDateOnly <= today) {
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

      // Create status history
      await prisma.loadStatusHistory.create({
        data: {
          loadId: load.id,
          status: newStatus,
          location: `${load.deliveryCity}, ${load.deliveryState}`,
          notes: 'Automated status update based on dates',
          createdBy: 'system', // System user for automated updates
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


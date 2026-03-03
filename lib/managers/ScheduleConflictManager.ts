/**
 * ScheduleConflictManager
 *
 * Detects pickup/delivery time conflicts when assigning a new load to a driver.
 * Returns overlapping loads with their time ranges so the dispatcher can decide.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
import { format } from 'date-fns';

export interface ScheduleConflict {
  loadId: string;
  loadNumber: string;
  pickupDate: string;
  deliveryDate: string;
  pickupLocation: string;
  deliveryLocation: string;
  status: string;
}

export interface ConflictCheckResult {
  hasConflicts: boolean;
  conflicts: ScheduleConflict[];
}

export class ScheduleConflictManager {
  /**
   * Detect time overlaps between a proposed new load and the driver's existing loads.
   *
   * A conflict exists when:
   *   existingLoad.pickupDate < newDeliveryTime AND existingLoad.deliveryDate > newPickupTime
   * This is the standard interval overlap check.
   */
  static async detectConflicts(
    driverId: string,
    newPickupTime: Date,
    newDeliveryTime?: Date
  ): Promise<ConflictCheckResult> {
    try {
      // Default delivery time to 24h after pickup if not specified
      const effectiveDelivery = newDeliveryTime || new Date(newPickupTime.getTime() + 24 * 60 * 60 * 1000);

      const overlappingLoads = await prisma.load.findMany({
        where: {
          driverId,
          deletedAt: null,
          status: {
            notIn: ['CANCELLED', 'DELIVERED', 'INVOICED', 'PAID'],
          },
          // Interval overlap: existing.pickup < new.delivery AND existing.delivery > new.pickup
          pickupDate: {
            lt: effectiveDelivery,
          },
          deliveryDate: {
            gt: newPickupTime,
          },
        },
        select: {
          id: true,
          loadNumber: true,
          pickupDate: true,
          deliveryDate: true,
          pickupCity: true,
          pickupState: true,
          deliveryCity: true,
          deliveryState: true,
          status: true,
        },
        orderBy: { pickupDate: 'asc' },
        take: 10, // Limit to prevent large result sets
      });

      const conflicts: ScheduleConflict[] = overlappingLoads.map((load) => ({
        loadId: load.id,
        loadNumber: load.loadNumber,
        pickupDate: load.pickupDate
          ? format(new Date(load.pickupDate), 'MMM d, h:mm a')
          : 'N/A',
        deliveryDate: load.deliveryDate
          ? format(new Date(load.deliveryDate), 'MMM d, h:mm a')
          : 'N/A',
        pickupLocation: [load.pickupCity, load.pickupState].filter(Boolean).join(', ') || 'Unknown',
        deliveryLocation: [load.deliveryCity, load.deliveryState].filter(Boolean).join(', ') || 'Unknown',
        status: load.status,
      }));

      if (conflicts.length > 0) {
        logger.warn('[ScheduleConflictManager] Conflicts detected', {
          driverId,
          newPickup: newPickupTime.toISOString(),
          newDelivery: effectiveDelivery.toISOString(),
          conflictCount: conflicts.length,
        });
      }

      return {
        hasConflicts: conflicts.length > 0,
        conflicts,
      };
    } catch (error) {
      logger.error('[ScheduleConflictManager] Error detecting conflicts', {
        driverId,
        error: error instanceof Error ? error.message : String(error),
      });
      // On error, return no conflicts to avoid blocking dispatch operations
      return { hasConflicts: false, conflicts: [] };
    }
  }
}

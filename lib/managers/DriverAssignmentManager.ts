import type { PrismaClient, Driver } from '@prisma/client';

interface AssignEquipmentOptions {
  newTruckId?: string | null;
  newTrailerId?: string | null;
  newDispatcherId?: string | null;
  reason?: string;
}

export class DriverAssignmentManager {
  /**
   * Assign truck, trailer, and/or dispatcher to a driver.
   * Creates history records and triggers load splits on truck changes.
   */
  static async assignEquipment(
    prisma: PrismaClient,
    driverId: string,
    companyId: string,
    opts: AssignEquipmentOptions
  ): Promise<Driver> {
    const driver = await prisma.driver.findFirst({
      where: { id: driverId, companyId, deletedAt: null },
      select: { id: true, currentTruckId: true, currentTrailerId: true, assignedDispatcherId: true },
    });

    if (!driver) throw new Error(`Driver ${driverId} not found`);

    const now = new Date();
    const updateData: Record<string, any> = {};

    // --- Truck assignment ---
    if (opts.newTruckId !== undefined) {
      const oldTruckId = driver.currentTruckId;
      const newTruckId = opts.newTruckId || null;

      if (oldTruckId !== newTruckId) {
        if (newTruckId) {
          const truck = await prisma.truck.findFirst({
            where: { id: newTruckId, companyId, isActive: true, deletedAt: null },
          });
          if (!truck) throw new Error(`Truck ${newTruckId} not found or inactive`);
        }

        // Close old history
        if (oldTruckId) {
          await prisma.driverTruckHistory.updateMany({
            where: { driverId, truckId: oldTruckId, dropOffDate: null },
            data: { dropOffDate: now, isActive: false },
          });
        }

        // Create new history
        if (newTruckId) {
          await prisma.driverTruckHistory.create({
            data: {
              driverId,
              truckId: newTruckId,
              date: now,
              pickupDate: now,
              isActive: true,
              note: opts.reason || 'Assignment changed',
            },
          });
        }

        // Auto-split loads on truck change
        try {
          const { LoadSplitManager } = await import('@/lib/managers/LoadSplitManager');
          await LoadSplitManager.autoSplitOnTruckChange({
            driverId,
            oldTruckId: oldTruckId || undefined,
            newTruckId: newTruckId || undefined,
            changeDate: now,
          });
        } catch (err) {
          console.error('Auto-split error on truck change:', err);
        }

        updateData.currentTruckId = newTruckId;
      }
    }

    // --- Trailer assignment ---
    if (opts.newTrailerId !== undefined) {
      const oldTrailerId = driver.currentTrailerId;
      const newTrailerId = opts.newTrailerId || null;

      if (oldTrailerId !== newTrailerId) {
        if (newTrailerId) {
          const trailer = await prisma.trailer.findFirst({
            where: { id: newTrailerId, companyId, isActive: true, deletedAt: null },
          });
          if (!trailer) throw new Error(`Trailer ${newTrailerId} not found or inactive`);
        }

        if (oldTrailerId) {
          await prisma.driverTrailerHistory.updateMany({
            where: { driverId, trailerId: oldTrailerId, dropOffDate: null },
            data: { dropOffDate: now },
          });
        }

        if (newTrailerId) {
          await prisma.driverTrailerHistory.create({
            data: { driverId, trailerId: newTrailerId, pickupDate: now },
          });
        }

        updateData.currentTrailerId = newTrailerId;
      }
    }

    // --- Dispatcher assignment ---
    if (opts.newDispatcherId !== undefined) {
      const newDispId = opts.newDispatcherId || null;
      if (driver.assignedDispatcherId !== newDispId) {
        updateData.assignedDispatcherId = newDispId;
      }
    }

    if (Object.keys(updateData).length === 0) {
      // No changes needed
      return prisma.driver.findFirstOrThrow({
        where: { id: driverId },
        include: {
          currentTruck: { select: { id: true, truckNumber: true } },
          currentTrailer: { select: { id: true, trailerNumber: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      }) as unknown as Driver;
    }

    return prisma.driver.update({
      where: { id: driverId },
      data: updateData,
      include: {
        currentTruck: { select: { id: true, truckNumber: true } },
        currentTrailer: { select: { id: true, trailerNumber: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    }) as unknown as Driver;
  }
}

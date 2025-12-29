import { prisma } from '@/lib/prisma';
import { LoadStatus } from '@prisma/client';

interface LoadSplitData {
  loadId: string;
  newDriverId?: string;
  newTruckId?: string;
  splitLocation?: string;
  splitDate: Date;
  splitMiles?: number;
  notes?: string;
}

interface AutoSplitData {
  driverId: string;
  oldTruckId?: string;
  newTruckId?: string;
  changeDate: Date;
}

export class LoadSplitManager {
  /**
   * Manually split a load between drivers/trucks
   */
  static async splitLoad(data: LoadSplitData): Promise<{ segment: any; load: any }> {
    // Get the load with current segments
    const load = await prisma.load.findUnique({
      where: { id: data.loadId },
      include: {
        segments: {
          orderBy: { sequence: 'asc' },
        },
        driver: true,
        truck: true,
      },
    });

    if (!load) {
      throw new Error('Load not found');
    }

    // Get the highest sequence number
    const maxSequence = load.segments.length > 0 
      ? Math.max(...load.segments.map(s => s.sequence))
      : 0;

    // Calculate miles up to split point
    const currentTotalMiles = load.segments.reduce((sum, seg) => sum + (seg.segmentMiles || 0), 0);
    const remainingMiles = Math.max(0, (load.totalMiles || 0) - currentTotalMiles);
    const splitMiles = data.splitMiles || (remainingMiles > 0 ? Math.floor(remainingMiles / 2) : 0);

    // Create end segment for previous driver/truck
    const endSegment = await prisma.loadSegment.create({
      data: {
        loadId: data.loadId,
        driverId: load.driverId,
        truckId: load.truckId,
        sequence: maxSequence + 1,
        startLocation: load.segments.length > 0 
          ? load.segments[load.segments.length - 1].endLocation
          : load.pickupLocation || `${load.pickupCity}, ${load.pickupState}`,
        endLocation: data.splitLocation || load.deliveryLocation || `${load.deliveryCity}, ${load.deliveryState}`,
        startCity: load.segments.length > 0 
          ? load.segments[load.segments.length - 1].endCity
          : load.pickupCity,
        startState: load.segments.length > 0 
          ? load.segments[load.segments.length - 1].endState
          : load.pickupState,
        endCity: data.splitLocation?.split(',')[0] || load.deliveryCity,
        endState: data.splitLocation?.split(',')[1]?.trim() || load.deliveryState,
        segmentMiles: splitMiles,
        startMiles: load.segments.length > 0 
          ? load.segments[load.segments.length - 1].endMiles
          : 0,
        endMiles: ((load.segments.length > 0 
          ? load.segments[load.segments.length - 1].endMiles || 0
          : 0) + splitMiles),
        startDate: load.segments.length > 0 
          ? load.segments[load.segments.length - 1].endDate || new Date()
          : load.pickupDate || new Date(),
        endDate: data.splitDate,
        notes: data.notes || `Manual split`,
        isAutoCreated: false,
      },
    });

    // Update load with new driver/truck if provided
    if (data.newDriverId || data.newTruckId) {
      await prisma.load.update({
        where: { id: data.loadId },
        data: {
          driverId: data.newDriverId || load.driverId,
          truckId: data.newTruckId || load.truckId,
        },
      });

      // Create start segment for new driver/truck
      const startSegment = await prisma.loadSegment.create({
        data: {
          loadId: data.loadId,
          driverId: data.newDriverId || load.driverId,
          truckId: data.newTruckId || load.truckId,
          sequence: maxSequence + 2,
          startLocation: data.splitLocation || load.deliveryLocation || `${load.deliveryCity}, ${load.deliveryState}`,
          endLocation: load.deliveryLocation || `${load.deliveryCity}, ${load.deliveryState}`,
          startCity: data.splitLocation?.split(',')[0] || load.deliveryCity,
          startState: data.splitLocation?.split(',')[1]?.trim() || load.deliveryState,
          endCity: load.deliveryCity,
          endState: load.deliveryState,
          segmentMiles: remainingMiles - splitMiles,
          startMiles: endSegment.endMiles,
          endMiles: (endSegment.endMiles || 0) + (remainingMiles - splitMiles),
          startDate: data.splitDate,
          endDate: null, // Will be set when load is delivered
          notes: `Manual split - continued`,
          isAutoCreated: false,
        },
      });

      return { segment: startSegment, load: await prisma.load.findUnique({ where: { id: data.loadId } }) };
    }

    return { segment: endSegment, load: await prisma.load.findUnique({ where: { id: data.loadId } }) };
  }

  /**
   * Automatically create load segments when driver's truck changes
   */
  static async autoSplitOnTruckChange(data: AutoSplitData): Promise<{ segmentsCreated: number }> {
    // Find all active loads for this driver with the old truck
    const activeLoads = await prisma.load.findMany({
      where: {
        driverId: data.driverId,
        truckId: data.oldTruckId,
        status: {
          in: [
            LoadStatus.ASSIGNED,
            LoadStatus.EN_ROUTE_PICKUP,
            LoadStatus.LOADED,
            LoadStatus.EN_ROUTE_DELIVERY,
            LoadStatus.AT_DELIVERY,
          ],
        },
        deletedAt: null,
      },
      include: {
        segments: {
          orderBy: { sequence: 'asc' },
        },
      },
    });

    let segmentsCreated = 0;

    for (const load of activeLoads) {
      // Get the highest sequence number
      const maxSequence = load.segments.length > 0 
        ? Math.max(...load.segments.map(s => s.sequence))
        : 0;

      // Calculate current miles up to change point
      const currentTotalMiles = load.segments.reduce((sum, seg) => sum + (seg.segmentMiles || 0), 0);
      const remainingMiles = Math.max(0, (load.totalMiles || 0) - currentTotalMiles);

      // Determine current location based on load status
      let currentLocation = load.pickupLocation || `${load.pickupCity}, ${load.pickupState}`;
      let currentCity = load.pickupCity;
      let currentState = load.pickupState;

      if (load.status === LoadStatus.EN_ROUTE_DELIVERY || load.status === LoadStatus.AT_DELIVERY) {
        currentLocation = load.deliveryLocation || `${load.deliveryCity}, ${load.deliveryState}`;
        currentCity = load.deliveryCity;
        currentState = load.deliveryState;
      }

      // Create end segment for old truck
      const endSegment = await prisma.loadSegment.create({
        data: {
          loadId: load.id,
          driverId: data.driverId,
          truckId: data.oldTruckId || load.truckId,
          sequence: maxSequence + 1,
          startLocation: load.segments.length > 0 
            ? load.segments[load.segments.length - 1].endLocation
            : load.pickupLocation || `${load.pickupCity}, ${load.pickupState}`,
          endLocation: currentLocation,
          startCity: load.segments.length > 0 
            ? load.segments[load.segments.length - 1].endCity
            : load.pickupCity,
          startState: load.segments.length > 0 
            ? load.segments[load.segments.length - 1].endState
            : load.pickupState,
          endCity: currentCity,
          endState: currentState,
          segmentMiles: Math.floor(remainingMiles / 2), // Split remaining miles approximately in half
          startMiles: load.segments.length > 0 
            ? load.segments[load.segments.length - 1].endMiles || 0
            : 0,
          endMiles: (load.segments.length > 0 
            ? load.segments[load.segments.length - 1].endMiles || 0
            : 0) + Math.floor(remainingMiles / 2),
          startDate: load.segments.length > 0 
            ? load.segments[load.segments.length - 1].endDate || load.pickupDate || new Date()
            : load.pickupDate || new Date(),
          endDate: data.changeDate,
          notes: `Auto-split: Truck change from ${data.oldTruckId || 'previous'} to ${data.newTruckId || 'new'}`,
          isAutoCreated: true,
        },
      });

      // Update load with new truck
      if (data.newTruckId) {
        await prisma.load.update({
          where: { id: load.id },
          data: {
            truckId: data.newTruckId,
          },
        });

        // Create start segment for new truck
        await prisma.loadSegment.create({
          data: {
            loadId: load.id,
            driverId: data.driverId,
            truckId: data.newTruckId,
            sequence: maxSequence + 2,
            startLocation: currentLocation,
            endLocation: load.deliveryLocation || `${load.deliveryCity}, ${load.deliveryState}`,
            startCity: currentCity,
            startState: currentState,
            endCity: load.deliveryCity,
            endState: load.deliveryState,
            segmentMiles: remainingMiles - Math.floor(remainingMiles / 2),
            startMiles: endSegment.endMiles || 0,
            endMiles: (endSegment.endMiles || 0) + (remainingMiles - Math.floor(remainingMiles / 2)),
            startDate: data.changeDate,
            endDate: null, // Will be set when load is delivered
            notes: `Auto-split: Continued with new truck ${data.newTruckId}`,
            isAutoCreated: true,
          },
        });
      }

      segmentsCreated += 2; // Created both end and start segments
    }

    return { segmentsCreated };
  }

  /**
   * Get load segments with driver and truck details for accounting
   */
  static async getLoadSegmentsForAccounting(loadId: string) {
    return await prisma.loadSegment.findMany({
      where: { loadId },
      include: {
        driver: {
          select: {
            id: true,
            driverNumber: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        truck: {
          select: {
            id: true,
            truckNumber: true,
          },
        },
      },
      orderBy: { sequence: 'asc' },
    });
  }

  /**
   * Get total miles per driver for accounting
   */
  static async getDriverMilesForPeriod(
    companyId: string,
    driverId: string,
    startDate: Date,
    endDate: Date
  ) {
    const segments = await prisma.loadSegment.findMany({
      where: {
        driverId,
        load: {
          companyId,
          deletedAt: null,
        },
        startDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        load: {
          select: {
            id: true,
            loadNumber: true,
            revenue: true,
          },
        },
      },
    });

    const totalMiles = segments.reduce((sum, seg) => sum + (seg.segmentMiles || 0), 0);
    const loadedMiles = segments.reduce((sum, seg) => sum + (seg.loadedMiles || 0), 0);
    const emptyMiles = segments.reduce((sum, seg) => sum + (seg.emptyMiles || 0), 0);

    return {
      totalMiles,
      loadedMiles,
      emptyMiles,
      segmentCount: segments.length,
      segments,
    };
  }
}


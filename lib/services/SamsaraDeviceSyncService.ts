/**
 * Samsara Device Sync Service
 * 
 * Synchronizes Samsara vehicles/assets with TMS trucks/trailers.
 * - Pulls all devices from Samsara
 * - Matches to existing TMS records by truck number, then VIN
 * - Creates pending queue entries for unmatched devices
 * - Updates TMS records with Samsara data (Samsara is master)
 * - Syncs odometer readings and fault codes
 */

import { prisma } from '@/lib/prisma';
import { getSamsaraVehicles, getSamsaraAssets, getSamsaraVehicleStats, getSamsaraVehicleDiagnostics } from '@/lib/integrations/samsara';

// ============================================
// TYPES
// ============================================

export interface SamsaraDevice {
  id: string;
  name?: string;
  vin?: string;
  licensePlate?: string;
  make?: string;
  model?: string;
  year?: number | string; // Samsara returns year as string
  odometerMiles?: number;
  engineHours?: number;
}

export interface SyncResult {
  matched: number;
  created: number;
  updated: number;
  queued: number;
  errors: string[];
}

interface MatchResult {
  type: 'TRUCK' | 'TRAILER';
  recordId: string;
  matchSource: 'name' | 'vin' | 'licensePlate';
}

// ============================================
// SERVICE
// ============================================

export class SamsaraDeviceSyncService {
  private readonly companyId: string;

  constructor(companyId: string) {
    this.companyId = companyId;
  }

  /**
   * Full sync of all Samsara devices
   */
  async syncAllDevices(): Promise<SyncResult> {
    const result: SyncResult = { matched: 0, created: 0, updated: 0, queued: 0, errors: [] };

    try {
      // Fetch all vehicles and assets from Samsara
      const [vehicles, assets] = await Promise.all([
        getSamsaraVehicles(this.companyId).catch(err => {
          result.errors.push(`Failed to fetch vehicles: ${err.message}`);
          return [];
        }),
        getSamsaraAssets(this.companyId).catch(err => {
          result.errors.push(`Failed to fetch assets: ${err.message}`);
          return [];
        }),
      ]);

      console.log(`[SamsaraSync] Fetched ${vehicles?.length || 0} vehicles and ${assets?.length || 0} assets`);

      // Get stats for odometer/engine hours
      const stats = await getSamsaraVehicleStats(undefined, this.companyId).catch(() => []);
      const statsMap = new Map<string, { odometerMiles?: number; engineHours?: number }>();
      stats?.forEach((s: any) => {
        const vehicleId = s.id || s.vehicleId;
        if (vehicleId) {
          // Robust parsing for odometer (can be array, object or number)
          let odometerMeters: number | undefined;
          const odoRaw = s.obdOdometerMeters;
          if (Array.isArray(odoRaw) && odoRaw.length > 0) {
            odometerMeters = odoRaw[0].value ?? odoRaw[0];
          } else if (typeof odoRaw === 'object' && odoRaw !== null) {
            odometerMeters = odoRaw.value;
          } else if (typeof odoRaw === 'number') {
            odometerMeters = odoRaw;
          }

          // Robust parsing for engine seconds
          let engineSeconds: number | undefined;
          const engRaw = s.obdEngineSeconds ?? s.syntheticEngineSeconds;
          if (Array.isArray(engRaw) && engRaw.length > 0) {
            engineSeconds = engRaw[0].value ?? engRaw[0];
          } else if (typeof engRaw === 'object' && engRaw !== null) {
            engineSeconds = engRaw.value;
          } else if (typeof engRaw === 'number') {
            engineSeconds = engRaw;
          }

          statsMap.set(vehicleId, {
            odometerMiles: odometerMeters ? Number(odometerMeters) * 0.000621371 : undefined,
            engineHours: engineSeconds ? Number(engineSeconds) / 3600 : undefined,
          });
        }
      });

      // Process vehicles (trucks)
      if (vehicles && vehicles.length > 0) {
        for (const vehicle of vehicles) {
          try {
            const vehicleStats = statsMap.get(vehicle.id);
            const deviceResult = await this.processDevice({
              id: vehicle.id,
              name: vehicle.name,
              vin: vehicle.vin,
              licensePlate: vehicle.licensePlate,
              make: vehicle.make,
              model: vehicle.model,
              year: vehicle.year,
              odometerMiles: vehicleStats?.odometerMiles,
              engineHours: vehicleStats?.engineHours,
            }, 'TRUCK');

            if (deviceResult.action === 'matched') result.matched++;
            else if (deviceResult.action === 'updated') result.updated++;
            else if (deviceResult.action === 'queued') result.queued++;
          } catch (err: any) {
            result.errors.push(`Vehicle ${vehicle.name || vehicle.id}: ${err.message}`);
          }
        }
      }

      // Process assets (trailers)
      if (assets && assets.length > 0) {
        for (const asset of assets) {
          try {
            const deviceResult = await this.processDevice({
              id: asset.id,
              name: asset.name,
              vin: asset.vin,
              licensePlate: asset.licensePlate,
            }, 'TRAILER');

            if (deviceResult.action === 'matched') result.matched++;
            else if (deviceResult.action === 'updated') result.updated++;
            else if (deviceResult.action === 'queued') result.queued++;
          } catch (err: any) {
            result.errors.push(`Asset ${asset.name || asset.id}: ${err.message}`);
          }
        }
      }

      console.log(`[SamsaraSync] Complete:`, result);
      return result;
    } catch (error: any) {
      result.errors.push(`Sync failed: ${error.message}`);
      return result;
    }
  }

  /**
   * Process a single device - match, update, or queue
   */
  private async processDevice(
    device: SamsaraDevice,
    deviceType: 'TRUCK' | 'TRAILER'
  ): Promise<{ action: 'matched' | 'updated' | 'queued' | 'skipped' }> {
    // Check if already linked via samsaraId
    const existingLink = await this.findBySamsaraId(device.id, deviceType);
    if (existingLink) {
      // Update existing linked record
      await this.updateLinkedRecord(device, existingLink, deviceType);
      return { action: 'updated' };
    }

    // Try to match to existing TMS record
    const match = await this.matchToExistingRecord(device, deviceType);
    if (match) {
      // Link and update the matched record
      await this.linkAndUpdateRecord(device, match);
      return { action: 'matched' };
    }

    // Check if already in queue
    const existingQueue = await prisma.samsaraDeviceQueue.findUnique({
      where: { samsaraId: device.id },
    });
    if (existingQueue) {
      // Update queue entry if needed
      await prisma.samsaraDeviceQueue.update({
        where: { id: existingQueue.id },
        data: {
          name: device.name || existingQueue.name,
          vin: device.vin,
          licensePlate: device.licensePlate,
          make: device.make,
          model: device.model,
          year: device.year ? (typeof device.year === 'string' ? parseInt(device.year, 10) : device.year) : null,
          updatedAt: new Date(),
        },
      });
      return { action: 'skipped' };
    }

    // Add to pending queue
    await this.addToQueue(device, deviceType);
    return { action: 'queued' };
  }

  /**
   * Find existing record by samsaraId
   */
  private async findBySamsaraId(
    samsaraId: string,
    deviceType: 'TRUCK' | 'TRAILER'
  ): Promise<{ id: string } | null> {
    if (deviceType === 'TRUCK') {
      return prisma.truck.findUnique({
        where: { samsaraId },
        select: { id: true },
      });
    } else {
      return prisma.trailer.findUnique({
        where: { samsaraId },
        select: { id: true },
      });
    }
  }

  /**
   * Match device to existing TMS record by name/number then VIN
   */
  private async matchToExistingRecord(
    device: SamsaraDevice,
    deviceType: 'TRUCK' | 'TRAILER'
  ): Promise<MatchResult | null> {
    const normalizedName = this.normalize(device.name);
    const normalizedVin = this.normalize(device.vin);
    const normalizedPlate = this.normalize(device.licensePlate);

    if (deviceType === 'TRUCK') {
      // Try name match first (truck number)
      if (normalizedName) {
        const trucks = await prisma.truck.findMany({
          where: {
            companyId: this.companyId,
            deletedAt: null,
            samsaraId: null, // Not already linked
          },
          select: { id: true, truckNumber: true, vin: true, licensePlate: true },
        });

        for (const truck of trucks) {
          if (this.normalize(truck.truckNumber) === normalizedName) {
            return { type: 'TRUCK', recordId: truck.id, matchSource: 'name' };
          }
        }

        // Try VIN match
        if (normalizedVin) {
          for (const truck of trucks) {
            if (this.normalize(truck.vin) === normalizedVin) {
              return { type: 'TRUCK', recordId: truck.id, matchSource: 'vin' };
            }
          }
        }

        // Try license plate match
        if (normalizedPlate) {
          for (const truck of trucks) {
            if (this.normalize(truck.licensePlate) === normalizedPlate) {
              return { type: 'TRUCK', recordId: truck.id, matchSource: 'licensePlate' };
            }
          }
        }
      }
    } else {
      // Try name match first (trailer number)
      if (normalizedName) {
        const trailers = await prisma.trailer.findMany({
          where: {
            companyId: this.companyId,
            deletedAt: null,
            samsaraId: null,
          },
          select: { id: true, trailerNumber: true, vin: true, licensePlate: true },
        });

        for (const trailer of trailers) {
          if (this.normalize(trailer.trailerNumber) === normalizedName) {
            return { type: 'TRAILER', recordId: trailer.id, matchSource: 'name' };
          }
        }

        // Try VIN match
        if (normalizedVin) {
          for (const trailer of trailers) {
            if (this.normalize(trailer.vin) === normalizedVin) {
              return { type: 'TRAILER', recordId: trailer.id, matchSource: 'vin' };
            }
          }
        }

        // Try license plate match
        if (normalizedPlate) {
          for (const trailer of trailers) {
            if (this.normalize(trailer.licensePlate) === normalizedPlate) {
              return { type: 'TRAILER', recordId: trailer.id, matchSource: 'licensePlate' };
            }
          }
        }
      }
    }

    return null;
  }

  /**
   * Link a Samsara device to an existing TMS record and update it
   */
  private async linkAndUpdateRecord(device: SamsaraDevice, match: MatchResult) {
    const now = new Date();

    // Convert year to number if it's a string
    const yearValue = device.year
      ? (typeof device.year === 'string' ? parseInt(device.year, 10) : device.year)
      : undefined;
    const validYear = yearValue && !isNaN(yearValue) ? yearValue : undefined;

    if (match.type === 'TRUCK') {
      await prisma.truck.update({
        where: { id: match.recordId },
        data: {
          samsaraId: device.id,
          samsaraSyncedAt: now,
          samsaraSyncStatus: 'SYNCED',
          // Update with Samsara data (Samsara is master)
          vin: device.vin || undefined,
          make: device.make || undefined,
          model: device.model || undefined,
          year: validYear,
          lastOdometerReading: device.odometerMiles,
          lastOdometerUpdate: device.odometerMiles ? now : undefined,
          lastEngineHours: device.engineHours,
        },
      });
    } else {
      await prisma.trailer.update({
        where: { id: match.recordId },
        data: {
          samsaraId: device.id,
          samsaraSyncedAt: now,
          samsaraSyncStatus: 'SYNCED',
          vin: device.vin || undefined,
          make: device.make || undefined,
          model: device.model || undefined,
          year: validYear,
        },
      });
    }

    console.log(`[SamsaraSync] Linked ${device.name} to ${match.type} ${match.recordId} via ${match.matchSource}`);
  }

  /**
   * Update an already-linked record with latest Samsara data
   */
  private async updateLinkedRecord(
    device: SamsaraDevice,
    existing: { id: string },
    deviceType: 'TRUCK' | 'TRAILER'
  ) {
    const now = new Date();

    if (deviceType === 'TRUCK') {
      await prisma.truck.update({
        where: { id: existing.id },
        data: {
          samsaraSyncedAt: now,
          samsaraSyncStatus: 'SYNCED',
          lastOdometerReading: device.odometerMiles,
          lastOdometerUpdate: device.odometerMiles ? now : undefined,
          lastEngineHours: device.engineHours,
        },
      });
    } else {
      await prisma.trailer.update({
        where: { id: existing.id },
        data: {
          samsaraSyncedAt: now,
          samsaraSyncStatus: 'SYNCED',
        },
      });
    }
  }

  /**
   * Add device to pending review queue (only if not already queued)
   */
  private async addToQueue(device: SamsaraDevice, deviceType: 'TRUCK' | 'TRAILER') {
    // Check if already in queue
    const existingQueueItem = await prisma.samsaraDeviceQueue.findUnique({
      where: { samsaraId: device.id },
    });

    if (existingQueueItem) {
      console.log(`[SamsaraSync] Device ${device.name} already in queue, skipping`);
      return;
    }

    // Convert year to number if it's a string
    const yearValue = device.year
      ? (typeof device.year === 'string' ? parseInt(device.year, 10) : device.year)
      : null;

    await prisma.samsaraDeviceQueue.create({
      data: {
        companyId: this.companyId,
        samsaraId: device.id,
        deviceType,
        name: device.name || `Unknown-${device.id.slice(0, 8)}`,
        vin: device.vin,
        licensePlate: device.licensePlate,
        make: device.make,
        model: device.model,
        year: yearValue && !isNaN(yearValue) ? yearValue : null,
        status: 'PENDING',
      },
    });

    console.log(`[SamsaraSync] Queued ${deviceType} ${device.name} for review`);
  }

  /**
   * Approve a queued device - create new TMS record or link if exists
   */
  async approveQueuedDevice(
    queueId: string,
    userId: string,
    additionalData?: {
      truckNumber?: string;
      trailerNumber?: string;
      mcNumberId?: string;
      equipmentType?: string;
    }
  ): Promise<{ success: boolean; recordId?: string; error?: string; action?: 'created' | 'linked' | 'rejected' }> {
    const queueItem = await prisma.samsaraDeviceQueue.findUnique({
      where: { id: queueId },
    });

    if (!queueItem || queueItem.status !== 'PENDING') {
      return { success: false, error: 'Invalid or already processed queue item' };
    }

    const now = new Date();
    const truckNumber = additionalData?.truckNumber || queueItem.name;
    const trailerNumber = additionalData?.trailerNumber || queueItem.name;

    try {
      if (queueItem.deviceType === 'TRUCK') {
        // First check if this Samsara device is already linked
        const alreadyLinked = await prisma.truck.findFirst({
          where: {
            companyId: queueItem.companyId,
            samsaraId: queueItem.samsaraId,
          },
          select: { id: true, truckNumber: true },
        });

        if (alreadyLinked) {
          // Already linked, just update queue status
          await prisma.samsaraDeviceQueue.update({
            where: { id: queueId },
            data: {
              status: 'LINKED',
              matchedRecordId: alreadyLinked.id,
              matchedType: 'TRUCK',
              reviewedAt: now,
              reviewedBy: { connect: { id: userId } },
            },
          });
          return { success: true, recordId: alreadyLinked.id, action: 'linked' };
        }

        // Get ALL trucks to check for duplicates
        const allCompanyTrucks = await prisma.truck.findMany({
          where: {
            companyId: queueItem.companyId,
            deletedAt: null,
          },
          select: { id: true, truckNumber: true, vin: true, samsaraId: true },
        });

        console.log(`[SamsaraSync] Looking for match for ${truckNumber} (VIN: ${queueItem.vin}) among ${allCompanyTrucks.length} trucks`);

        // Check if truck with this VIN already exists (most reliable match)
        let existingTruck = null;

        if (queueItem.vin) {
          existingTruck = allCompanyTrucks.find(truck =>
            truck.vin && truck.vin.toUpperCase() === queueItem.vin?.toUpperCase()
          ) || null;

          if (existingTruck) {
            console.log(`[SamsaraSync] Found existing truck by VIN: ${existingTruck.truckNumber} (${existingTruck.vin})`);
          }
        }

        // If no VIN match, try truck number with multiple strategies
        if (!existingTruck) {
          const normalizedTarget = this.normalize(truckNumber);
          // Also extract just numeric part for fuzzy matching
          const numericPart = truckNumber.replace(/\D/g, '');

          existingTruck = allCompanyTrucks.find(truck => {
            const normalizedTruckNumber = this.normalize(truck.truckNumber);
            const truckNumericPart = truck.truckNumber.replace(/\D/g, '');

            // Strategy 1: Exact normalized match
            if (normalizedTarget && normalizedTruckNumber === normalizedTarget) {
              console.log(`[SamsaraSync] Found match by truck number: ${truck.truckNumber}`);
              return true;
            }

            // Strategy 2: Numeric part match (e.g. "854" matches "T854", "854-A", "#854")
            if (numericPart && numericPart.length >= 2 && truckNumericPart === numericPart) {
              console.log(`[SamsaraSync] Found match by numeric part: ${truck.truckNumber} (${numericPart})`);
              return true;
            }

            // Strategy 3: Contains match for short numbers (e.g. "854" in "854 JOHN")
            if (numericPart && numericPart.length >= 3 && truck.truckNumber.includes(numericPart)) {
              console.log(`[SamsaraSync] Found match by contains: ${truck.truckNumber} contains ${numericPart}`);
              return true;
            }

            return false;
          }) || null;
        }

        // Last resort: Check if ANY truck has this VIN (even with different company filter issues)
        if (!existingTruck && queueItem.vin) {
          const vinCheck = await prisma.truck.findFirst({
            where: { vin: queueItem.vin },
            select: { id: true, truckNumber: true, vin: true, samsaraId: true, companyId: true },
          });
          if (vinCheck) {
            console.log(`[SamsaraSync] Found truck with same VIN in database: ${vinCheck.truckNumber} (companyId: ${vinCheck.companyId})`);
            if (vinCheck.companyId === queueItem.companyId) {
              existingTruck = vinCheck;
            } else {
              return { success: false, error: `VIN ${queueItem.vin} exists but belongs to a different company. Cannot create duplicate.` };
            }
          }
        }

        let truckId: string | undefined;
        let action: 'created' | 'linked' | 'rejected' | undefined;

        if (existingTruck) {
          // Case 1: Truck already linked to THIS SAME samsaraId → already done, just update queue status
          if (existingTruck.samsaraId === queueItem.samsaraId) {
            await prisma.samsaraDeviceQueue.update({
              where: { id: queueId },
              data: {
                status: 'LINKED',
                matchedRecordId: existingTruck.id,
                matchedType: 'TRUCK',
                reviewedAt: now,
                reviewedBy: { connect: { id: userId } },
              },
            });
            console.log(`[SamsaraSync] Truck ${existingTruck.truckNumber} already linked to this device, marking queue as LINKED`);
            return { success: true, recordId: existingTruck.id, action: 'linked' };
          }

          // Case 2: Truck already linked to DIFFERENT samsaraId → conflict
          if (existingTruck.samsaraId && existingTruck.samsaraId !== queueItem.samsaraId) {
            // Auto-reject this queue item as it's a duplicate/conflict
            await prisma.samsaraDeviceQueue.update({
              where: { id: queueId },
              data: {
                status: 'REJECTED',
                reviewedAt: now,
                reviewedBy: { connect: { id: userId } },
                rejectionReason: `Truck ${existingTruck.truckNumber} already linked to different Samsara device`,
              },
            });
            console.log(`[SamsaraSync] REJECTED: Truck ${existingTruck.truckNumber} already linked to different Samsara device`);
            return { success: true, recordId: existingTruck.id, action: 'rejected' };
          }

          // Case 3: Truck exists but not linked → link it
          await prisma.$transaction([
            prisma.truck.update({
              where: { id: existingTruck.id },
              data: {
                samsaraId: queueItem.samsaraId,
                samsaraSyncedAt: now,
                samsaraSyncStatus: 'SYNCED',
                // Update with Samsara data (Samsara is master)
                make: queueItem.make || undefined,
                model: queueItem.model || undefined,
                year: queueItem.year || undefined,
                vin: queueItem.vin || undefined, // Update VIN if missing
              },
            }),
            // Update queue status to LINKED
            prisma.samsaraDeviceQueue.update({
              where: { id: queueId },
              data: {
                status: 'LINKED',
                matchedRecordId: existingTruck.id,
                matchedType: 'TRUCK',
                reviewedAt: now,
                reviewedBy: { connect: { id: userId } },
              },
            }),
          ]);
          truckId = existingTruck.id;
          action = 'linked';
          console.log(`[SamsaraSync] AUTO-LINKED existing truck ${existingTruck.truckNumber} to Samsara device ${queueItem.name}`);
        } else {
          // Check if this looks like a gateway/deactivated device (not a real truck)
          const isGatewayOrDeactivated =
            queueItem.name.toLowerCase().includes('deactivated') ||
            queueItem.name.toLowerCase().includes('gateway') ||
            /^[A-Z0-9]{4}-[A-Z0-9]{3}-[A-Z0-9]{3}$/.test(queueItem.name) || // Gateway pattern like GHHA-BNJ-SYW
            queueItem.name.toLowerCase().includes('previously paired');

          if (isGatewayOrDeactivated) {
            return { success: false, error: `"${queueItem.name}" appears to be a gateway or deactivated device, not a truck. Please reject this item.` };
          }

          // Create new truck with a unique number if there's a conflict
          let finalTruckNumber = truckNumber;
          let attempt = 0;
          let created = false;

          // Generate a truly unique VIN if none provided
          const uniqueVin = queueItem.vin || `PENDING-${queueItem.samsaraId}-${Date.now()}`;

          while (!created && attempt < 5) {
            try {
              const truck = await prisma.truck.create({
                data: {
                  companyId: queueItem.companyId,
                  truckNumber: finalTruckNumber,
                  vin: attempt === 0 ? uniqueVin : `${uniqueVin}-${attempt}`,
                  make: queueItem.make || 'Unknown',
                  model: queueItem.model || 'Unknown',
                  year: queueItem.year || new Date().getFullYear(),
                  licensePlate: queueItem.licensePlate || 'PENDING',
                  state: 'TX', // Default state
                  equipmentType: (additionalData?.equipmentType as any) || 'DRY_VAN',
                  capacity: 45000,
                  registrationExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                  insuranceExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                  inspectionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                  samsaraId: queueItem.samsaraId,
                  samsaraSyncedAt: now,
                  samsaraSyncStatus: 'SYNCED',
                  mcNumberId: additionalData?.mcNumberId,
                },
              });
              truckId = truck.id;
              created = true;
            } catch (createError: any) {
              if (createError.code === 'P2002') {
                const target = createError.meta?.target;
                // If VIN conflict - check if it's a real VIN or a generated one
                if (target?.includes('vin')) {
                  if (queueItem.vin) {
                    // Real VIN conflict - try to link to existing truck
                    const existingByVin = await prisma.truck.findFirst({
                      where: { vin: queueItem.vin },
                      select: { id: true, truckNumber: true, samsaraId: true },
                    });
                    if (existingByVin && !existingByVin.samsaraId) {
                      // Link to existing truck
                      await prisma.truck.update({
                        where: { id: existingByVin.id },
                        data: {
                          samsaraId: queueItem.samsaraId,
                          samsaraSyncedAt: now,
                          samsaraSyncStatus: 'SYNCED',
                        },
                      });
                      truckId = existingByVin.id;
                      created = true;
                      action = 'linked';
                      console.log(`[SamsaraSync] Auto-linked to existing truck ${existingByVin.truckNumber} by VIN`);
                    } else {
                      return { success: false, error: `VIN ${queueItem.vin} already linked to truck ${existingByVin?.truckNumber || 'unknown'}. Use "Link" action instead.` };
                    }
                  } else {
                    // Generated VIN conflict - just increment and retry
                    attempt++;
                    console.log(`[SamsaraSync] Generated VIN conflict, retrying with attempt ${attempt}`);
                  }
                } else if (target?.includes('truckNumber')) {
                  // If truck number conflict, DIRECTLY query for that truck (don't rely on allCompanyTrucks)
                  const existingByNumber = await prisma.truck.findFirst({
                    where: {
                      companyId: queueItem.companyId,
                      truckNumber: finalTruckNumber,
                      deletedAt: null,
                    },
                    select: { id: true, truckNumber: true, vin: true, samsaraId: true },
                  });

                  if (existingByNumber && !existingByNumber.samsaraId) {
                    // Link to existing truck
                    await prisma.truck.update({
                      where: { id: existingByNumber.id },
                      data: {
                        samsaraId: queueItem.samsaraId,
                        samsaraSyncedAt: now,
                        samsaraSyncStatus: 'SYNCED',
                        vin: queueItem.vin || existingByNumber.vin,
                      },
                    });
                    truckId = existingByNumber.id;
                    created = true;
                    action = 'linked';
                    console.log(`[SamsaraSync] Auto-linked to existing truck ${existingByNumber.truckNumber} by number (via conflict)`);
                  } else if (existingByNumber?.samsaraId) {
                    return { success: false, error: `Truck ${existingByNumber.truckNumber} already linked to a different Samsara device. Use "Reject" to dismiss this queue item.` };
                  } else {
                    // Try with suffix
                    attempt++;
                    finalTruckNumber = `${truckNumber}-S${attempt}`;
                  }
                } else {
                  attempt++;
                }
              } else {
                throw createError;
              }
            }
          }

          if (!created) {
            return { success: false, error: `Failed to create truck "${truckNumber}" - already exists in TMS. Use "Link" action to connect to existing truck.` };
          }

          action = action || 'created';
        }

        if (!truckId) {
          return { success: false, error: 'Failed to create or link truck' };
        }

        const finalAction = action || 'created';
        await prisma.samsaraDeviceQueue.update({
          where: { id: queueId },
          data: {
            status: finalAction === 'created' ? 'APPROVED' : 'LINKED',
            matchedRecordId: truckId,
            matchedType: 'TRUCK',
            reviewedAt: now,
            reviewedBy: { connect: { id: userId } },
          },
        });

        return { success: true, recordId: truckId, action: finalAction };
      } else {
        // First check if this Samsara device is already linked
        const alreadyLinked = await prisma.trailer.findFirst({
          where: {
            companyId: queueItem.companyId,
            samsaraId: queueItem.samsaraId,
          },
          select: { id: true, trailerNumber: true },
        });

        if (alreadyLinked) {
          // Already linked, just update queue status
          await prisma.samsaraDeviceQueue.update({
            where: { id: queueId },
            data: {
              status: 'LINKED',
              matchedRecordId: alreadyLinked.id,
              matchedType: 'TRAILER',
              reviewedAt: now,
              reviewedBy: { connect: { id: userId } },
            },
          });
          return { success: true, recordId: alreadyLinked.id, action: 'linked' };
        }

        // Get ALL trailers for flexible matching
        const allCompanyTrailers = await prisma.trailer.findMany({
          where: {
            companyId: queueItem.companyId,
            deletedAt: null,
          },
          select: { id: true, trailerNumber: true, vin: true, samsaraId: true },
        });

        console.log(`[SamsaraSync] Looking for match for ${trailerNumber} (VIN: ${queueItem.vin}) among ${allCompanyTrailers.length} trailers`);

        // Try to find a match with multiple strategies
        const normalizedTarget = this.normalize(trailerNumber);
        const normalizedVin = this.normalize(queueItem.vin);
        const numericPart = trailerNumber.replace(/\D/g, '');

        let existingTrailer = allCompanyTrailers.find(trailer => {
          const normalizedTrailerNumber = this.normalize(trailer.trailerNumber);
          const normalizedTrailerVin = this.normalize(trailer.vin);
          const trailerNumericPart = trailer.trailerNumber.replace(/\D/g, '');

          // Strategy 1: Exact normalized match
          if (normalizedTarget && normalizedTrailerNumber === normalizedTarget) {
            console.log(`[SamsaraSync] Found match by trailer number: ${trailer.trailerNumber}`);
            return true;
          }

          // Strategy 2: Match by VIN
          if (normalizedVin && normalizedTrailerVin === normalizedVin) {
            console.log(`[SamsaraSync] Found match by VIN: ${trailer.vin}`);
            return true;
          }

          // Strategy 3: Numeric part match
          if (numericPart && numericPart.length >= 2 && trailerNumericPart === numericPart) {
            console.log(`[SamsaraSync] Found match by numeric part: ${trailer.trailerNumber} (${numericPart})`);
            return true;
          }

          // Strategy 4: Contains match for longer numbers
          if (numericPart && numericPart.length >= 3 && trailer.trailerNumber.includes(numericPart)) {
            console.log(`[SamsaraSync] Found match by contains: ${trailer.trailerNumber} contains ${numericPart}`);
            return true;
          }

          return false;
        });

        let trailerId: string | undefined;
        let action: 'created' | 'linked' | 'rejected' | undefined;

        if (existingTrailer) {
          // Case 1: Trailer already linked to THIS SAME samsaraId
          if (existingTrailer.samsaraId === queueItem.samsaraId) {
            await prisma.samsaraDeviceQueue.update({
              where: { id: queueId },
              data: {
                status: 'LINKED',
                matchedRecordId: existingTrailer.id,
                matchedType: 'TRAILER',
                reviewedAt: now,
                reviewedBy: { connect: { id: userId } },
              },
            });
            console.log(`[SamsaraSync] Trailer ${existingTrailer.trailerNumber} already linked to this device, marking queue as LINKED`);
            return { success: true, recordId: existingTrailer.id, action: 'linked' };
          }

          // Case 2: Trailer already linked to DIFFERENT samsaraId
          if (existingTrailer.samsaraId && existingTrailer.samsaraId !== queueItem.samsaraId) {
            await prisma.samsaraDeviceQueue.update({
              where: { id: queueId },
              data: {
                status: 'REJECTED',
                reviewedAt: now,
                reviewedBy: { connect: { id: userId } },
                rejectionReason: `Trailer ${existingTrailer.trailerNumber} already linked to different Samsara device`,
              },
            });
            console.log(`[SamsaraSync] REJECTED: Trailer ${existingTrailer.trailerNumber} already linked to different Samsara device`);
            return { success: true, recordId: existingTrailer.id, action: 'rejected' };
          }

          // Case 3: Trailer exists but not linked → link it
          await prisma.$transaction([
            prisma.trailer.update({
              where: { id: existingTrailer.id },
              data: {
                samsaraId: queueItem.samsaraId,
                samsaraSyncedAt: now,
                samsaraSyncStatus: 'SYNCED',
                // Update with Samsara data
                make: queueItem.make || undefined,
                model: queueItem.model || undefined,
                year: queueItem.year || undefined,
                vin: queueItem.vin || undefined,
              },
            }),
            // Update queue status to LINKED
            prisma.samsaraDeviceQueue.update({
              where: { id: queueId },
              data: {
                status: 'LINKED',
                matchedRecordId: existingTrailer.id,
                matchedType: 'TRAILER',
                reviewedAt: now,
                reviewedBy: { connect: { id: userId } },
              },
            }),
          ]);
          trailerId = existingTrailer.id;
          action = 'linked';
          console.log(`[SamsaraSync] AUTO-LINKED existing trailer ${existingTrailer.trailerNumber} to Samsara device ${queueItem.name}`);
        } else {
          // Check if this looks like a gateway/deactivated device
          const isGatewayOrDeactivated =
            queueItem.name.toLowerCase().includes('deactivated') ||
            queueItem.name.toLowerCase().includes('gateway') ||
            /^[A-Z0-9]{4}-[A-Z0-9]{3}-[A-Z0-9]{3}$/.test(queueItem.name) ||
            queueItem.name.toLowerCase().includes('previously paired');

          if (isGatewayOrDeactivated) {
            return { success: false, error: `"${queueItem.name}" appears to be a gateway or deactivated device, not a trailer. Please reject this item.` };
          }

          // Create new trailer with unique number handling
          let finalTrailerNumber = trailerNumber;
          let attempt = 0;
          let created = false;

          while (!created && attempt < 5) {
            try {
              const trailer = await prisma.trailer.create({
                data: {
                  companyId: queueItem.companyId,
                  trailerNumber: finalTrailerNumber,
                  vin: queueItem.vin,
                  make: queueItem.make || 'Unknown',
                  model: queueItem.model || 'Unknown',
                  year: queueItem.year,
                  licensePlate: queueItem.licensePlate,
                  samsaraId: queueItem.samsaraId,
                  samsaraSyncedAt: now,
                  samsaraSyncStatus: 'SYNCED',
                  mcNumberId: additionalData?.mcNumberId,
                },
              });
              trailerId = trailer.id;
              created = true;
            } catch (createError: any) {
              if (createError.code === 'P2002') {
                const target = createError.meta?.target;
                // If VIN conflict
                if (target?.includes('vin')) {
                  if (queueItem.vin) {
                    // Real VIN conflict - try to link
                    const existingByVin = await prisma.trailer.findFirst({
                      where: { vin: queueItem.vin },
                      select: { id: true, trailerNumber: true, samsaraId: true },
                    });
                    if (existingByVin && !existingByVin.samsaraId) {
                      await prisma.trailer.update({
                        where: { id: existingByVin.id },
                        data: {
                          samsaraId: queueItem.samsaraId,
                          samsaraSyncedAt: now,
                          samsaraSyncStatus: 'SYNCED',
                        },
                      });
                      trailerId = existingByVin.id;
                      created = true;
                      action = 'linked';
                      console.log(`[SamsaraSync] Auto-linked to existing trailer ${existingByVin.trailerNumber} by VIN`);
                    } else {
                      return { success: false, error: `VIN ${queueItem.vin} already linked to trailer ${existingByVin?.trailerNumber || 'unknown'}. Use "Link" action instead.` };
                    }
                  } else {
                    // No VIN provided, just increment attempt
                    attempt++;
                    console.log(`[SamsaraSync] VIN conflict for trailer, retrying with attempt ${attempt}`);
                  }
                } else if (target?.includes('trailerNumber')) {
                  // Trailer number conflict - DIRECTLY query for that trailer
                  const existingByNumber = await prisma.trailer.findFirst({
                    where: {
                      companyId: queueItem.companyId,
                      trailerNumber: finalTrailerNumber,
                      deletedAt: null,
                    },
                    select: { id: true, trailerNumber: true, vin: true, samsaraId: true },
                  });

                  if (existingByNumber && !existingByNumber.samsaraId) {
                    await prisma.trailer.update({
                      where: { id: existingByNumber.id },
                      data: {
                        samsaraId: queueItem.samsaraId,
                        samsaraSyncedAt: now,
                        samsaraSyncStatus: 'SYNCED',
                        vin: queueItem.vin || existingByNumber.vin,
                      },
                    });
                    trailerId = existingByNumber.id;
                    created = true;
                    action = 'linked';
                    console.log(`[SamsaraSync] Auto-linked to existing trailer ${existingByNumber.trailerNumber} by number (via conflict)`);
                  } else if (existingByNumber?.samsaraId) {
                    return { success: false, error: `Trailer ${existingByNumber.trailerNumber} already linked to a different Samsara device. Use "Reject" to dismiss this queue item.` };
                  } else {
                    attempt++;
                    finalTrailerNumber = `${trailerNumber}-S${attempt}`;
                  }
                } else {
                  attempt++;
                }
              } else {
                throw createError;
              }
            }
          }

          if (!created) {
            return { success: false, error: `Failed to create trailer "${trailerNumber}" - already exists in TMS. Use "Link" action to connect to existing trailer.` };
          }

          action = action || 'created';
        }

        if (!trailerId) {
          return { success: false, error: 'Failed to create or link trailer' };
        }

        const finalAction = action || 'created';
        await prisma.samsaraDeviceQueue.update({
          where: { id: queueId },
          data: {
            status: finalAction === 'created' ? 'APPROVED' : 'LINKED',
            matchedRecordId: trailerId,
            matchedType: 'TRAILER',
            reviewedAt: now,
            reviewedBy: { connect: { id: userId } },
          },
        });

        return { success: true, recordId: trailerId, action: finalAction };
      }
    } catch (error: any) {
      // Better error message for duplicate keys
      if (error.code === 'P2002') {
        const target = error.meta?.target;
        if (target?.includes('truckNumber') || target?.includes('trailerNumber')) {
          // If it's a duplicate, try to find and link the existing record
          const deviceName = queueItem.deviceType === 'TRUCK' ? truckNumber : trailerNumber;
          console.warn(`[SamsaraSync] Duplicate ${queueItem.deviceType} ${deviceName} detected during create, attempting to link...`);

          // Try one more time to find and link
          if (queueItem.deviceType === 'TRUCK') {
            const truck = await prisma.truck.findFirst({
              where: { companyId: queueItem.companyId, truckNumber, deletedAt: null },
            });
            if (truck) {
              await prisma.truck.update({
                where: { id: truck.id },
                data: { samsaraId: queueItem.samsaraId, samsaraSyncedAt: now, samsaraSyncStatus: 'SYNCED' },
              });
              await prisma.samsaraDeviceQueue.update({
                where: { id: queueId },
                data: { status: 'LINKED', matchedRecordId: truck.id, matchedType: 'TRUCK', reviewedAt: now, reviewedBy: { connect: { id: userId } } },
              });
              return { success: true, recordId: truck.id, action: 'linked' };
            }
          } else {
            const trailer = await prisma.trailer.findFirst({
              where: { companyId: queueItem.companyId, trailerNumber, deletedAt: null },
            });
            if (trailer) {
              await prisma.trailer.update({
                where: { id: trailer.id },
                data: { samsaraId: queueItem.samsaraId, samsaraSyncedAt: now, samsaraSyncStatus: 'SYNCED' },
              });
              await prisma.samsaraDeviceQueue.update({
                where: { id: queueId },
                data: { status: 'LINKED', matchedRecordId: trailer.id, matchedType: 'TRAILER', reviewedAt: now, reviewedBy: { connect: { id: userId } } },
              });
              return { success: true, recordId: trailer.id, action: 'linked' };
            }
          }
        }
        return { success: false, error: `A ${queueItem.deviceType.toLowerCase()} with this ${target?.includes('vin') ? 'VIN' : 'number'} already exists. Try syncing again or use "Link" action.` };
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * Link a queued device to an existing TMS record
   */
  async linkQueuedDevice(
    queueId: string,
    recordId: string,
    recordType: 'TRUCK' | 'TRAILER',
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    const queueItem = await prisma.samsaraDeviceQueue.findUnique({
      where: { id: queueId },
    });

    if (!queueItem || queueItem.status !== 'PENDING') {
      return { success: false, error: 'Invalid or already processed queue item' };
    }

    try {
      const now = new Date();

      if (recordType === 'TRUCK') {
        await prisma.truck.update({
          where: { id: recordId },
          data: {
            samsaraId: queueItem.samsaraId,
            samsaraSyncedAt: now,
            samsaraSyncStatus: 'SYNCED',
          },
        });
      } else {
        await prisma.trailer.update({
          where: { id: recordId },
          data: {
            samsaraId: queueItem.samsaraId,
            samsaraSyncedAt: now,
            samsaraSyncStatus: 'SYNCED',
          },
        });
      }

      await prisma.samsaraDeviceQueue.update({
        where: { id: queueId },
        data: {
          status: 'LINKED',
          matchedRecordId: recordId,
          matchedType: recordType,
          reviewedAt: now,
          reviewedBy: { connect: { id: userId } },
        },
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Reject a queued device
   */
  async rejectQueuedDevice(
    queueId: string,
    userId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await prisma.samsaraDeviceQueue.update({
        where: { id: queueId },
        data: {
          status: 'REJECTED',
          reviewedAt: new Date(),
          reviewedBy: { connect: { id: userId } },
          rejectionReason: reason,
        },
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync odometer readings for all linked trucks
   */
  async syncOdometerReadings(): Promise<number> {
    const trucks = await prisma.truck.findMany({
      where: {
        companyId: this.companyId,
        deletedAt: null,
        samsaraId: { not: null },
      },
      select: { id: true, samsaraId: true },
    });

    if (trucks.length === 0) return 0;

    const stats = await getSamsaraVehicleStats(undefined, this.companyId).catch(() => []);
    const statsMap = new Map<string, number>();

    stats?.forEach((s: any) => {
      const vehicleId = s.id || s.vehicleId;
      const odometerMeters = s.obdOdometerMeters?.value ?? s.obdOdometerMeters;
      if (vehicleId && odometerMeters) {
        statsMap.set(vehicleId, Number(odometerMeters) * 0.000621371);
      }
    });

    let updated = 0;
    for (const truck of trucks) {
      const odometer = statsMap.get(truck.samsaraId!);
      if (odometer !== undefined) {
        await prisma.truck.update({
          where: { id: truck.id },
          data: {
            lastOdometerReading: odometer,
            lastOdometerUpdate: new Date(),
          },
        });
        updated++;
      }
    }

    return updated;
  }

  /**
   * Normalize string for comparison (remove special chars, lowercase)
   */
  private normalize(value?: string | null): string | undefined {
    if (!value) return undefined;
    return value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  }
}


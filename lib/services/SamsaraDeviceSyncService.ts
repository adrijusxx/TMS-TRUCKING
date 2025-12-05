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
      const stats = await getSamsaraVehicleStats(this.companyId).catch(() => []);
      const statsMap = new Map<string, { odometerMiles?: number; engineHours?: number }>();
      stats?.forEach((s: any) => {
        const vehicleId = s.id || s.vehicleId;
        if (vehicleId) {
          const odometerMeters = s.obdOdometerMeters?.value ?? s.obdOdometerMeters;
          const engineSeconds = s.obdEngineSeconds?.value ?? s.syntheticEngineSeconds?.value ?? s.obdEngineSeconds ?? s.syntheticEngineSeconds;
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
   * Add device to pending review queue
   */
  private async addToQueue(device: SamsaraDevice, deviceType: 'TRUCK' | 'TRAILER') {
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
  ): Promise<{ success: boolean; recordId?: string; error?: string; action?: 'created' | 'linked' }> {
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
              reviewedById: userId,
            },
          });
          return { success: true, recordId: alreadyLinked.id, action: 'linked' };
        }

        // Check if truck with this number already exists
        // Get ALL trucks to do flexible matching
        const allCompanyTrucks = await prisma.truck.findMany({
          where: {
            companyId: queueItem.companyId,
            deletedAt: null,
          },
          select: { id: true, truckNumber: true, vin: true, samsaraId: true },
        });

        console.log(`[SamsaraSync] Looking for match for ${truckNumber} (VIN: ${queueItem.vin}) among ${allCompanyTrucks.length} trucks`);

        // Try to find a match with normalized comparison
        const normalizedTarget = this.normalize(truckNumber);
        const normalizedVin = this.normalize(queueItem.vin);

        let existingTruck = allCompanyTrucks.find(truck => {
          const normalizedTruckNumber = this.normalize(truck.truckNumber);
          const normalizedTruckVin = this.normalize(truck.vin);
          
          // Match by truck number
          if (normalizedTarget && normalizedTruckNumber === normalizedTarget) {
            console.log(`[SamsaraSync] Found match by truck number: ${truck.truckNumber}`);
            return true;
          }
          
          // Match by VIN
          if (normalizedVin && normalizedTruckVin === normalizedVin) {
            console.log(`[SamsaraSync] Found match by VIN: ${truck.vin}`);
            return true;
          }
          
          return false;
        });

        let truckId: string | undefined;
        let action: 'created' | 'linked';

        if (existingTruck) {
          if (existingTruck.samsaraId && existingTruck.samsaraId !== queueItem.samsaraId) {
            return { success: false, error: `Truck ${existingTruck.truckNumber} is already linked to a different Samsara device.` };
          }
          
          // Link to existing truck instead of creating
          await prisma.truck.update({
            where: { id: existingTruck.id },
            data: {
              samsaraId: queueItem.samsaraId,
              samsaraSyncedAt: now,
              samsaraSyncStatus: 'SYNCED',
              // Update with Samsara data (Samsara is master)
              make: queueItem.make || undefined,
              model: queueItem.model || undefined,
              year: queueItem.year || undefined,
            },
          });
          truckId = existingTruck.id;
          action = 'linked';
          console.log(`[SamsaraSync] Linked existing truck ${existingTruck.truckNumber} to Samsara device ${queueItem.name}`);
        } else {
          // Create new truck with a unique number if there's a conflict
          let finalTruckNumber = truckNumber;
          let attempt = 0;
          let created = false;
          let truckId: string | undefined;
          
          while (!created && attempt < 5) {
            try {
              const truck = await prisma.truck.create({
                data: {
                  companyId: queueItem.companyId,
                  truckNumber: finalTruckNumber,
                  vin: queueItem.vin || `UNKNOWN-${queueItem.samsaraId.slice(0, 8)}`,
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
                // If VIN conflict, can't proceed
                if (createError.meta?.target?.includes('vin')) {
                  return { success: false, error: `VIN ${queueItem.vin} already exists in TMS. Use "Link" action to connect to existing truck.` };
                }
                // If truck number conflict, try with suffix
                attempt++;
                finalTruckNumber = `${truckNumber}-${attempt}`;
              } else {
                throw createError;
              }
            }
          }
          
          if (!created) {
            return { success: false, error: 'Failed to create truck after multiple attempts - duplicate exists' };
          }
          
          action = 'created';
        }

        if (!truckId) {
          return { success: false, error: 'Failed to create or link truck' };
        }

        await prisma.samsaraDeviceQueue.update({
          where: { id: queueId },
          data: {
            status: action === 'created' ? 'APPROVED' : 'LINKED',
            matchedRecordId: truckId,
            matchedType: 'TRUCK',
            reviewedAt: now,
            reviewedById: userId,
          },
        });

        return { success: true, recordId: truckId, action };
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
              reviewedById: userId,
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

        // Try to find a match with normalized comparison
        const normalizedTarget = this.normalize(trailerNumber);
        const normalizedVin = this.normalize(queueItem.vin);

        let existingTrailer = allCompanyTrailers.find(trailer => {
          const normalizedTrailerNumber = this.normalize(trailer.trailerNumber);
          const normalizedTrailerVin = this.normalize(trailer.vin);
          
          // Match by trailer number
          if (normalizedTarget && normalizedTrailerNumber === normalizedTarget) {
            console.log(`[SamsaraSync] Found match by trailer number: ${trailer.trailerNumber}`);
            return true;
          }
          
          // Match by VIN
          if (normalizedVin && normalizedTrailerVin === normalizedVin) {
            console.log(`[SamsaraSync] Found match by VIN: ${trailer.vin}`);
            return true;
          }
          
          return false;
        });

        let trailerId: string | undefined;
        let action: 'created' | 'linked';

        if (existingTrailer) {
          if (existingTrailer.samsaraId && existingTrailer.samsaraId !== queueItem.samsaraId) {
            return { success: false, error: `Trailer ${existingTrailer.trailerNumber} is already linked to a different Samsara device.` };
          }
          
          // Link to existing trailer
          await prisma.trailer.update({
            where: { id: existingTrailer.id },
            data: {
              samsaraId: queueItem.samsaraId,
              samsaraSyncedAt: now,
              samsaraSyncStatus: 'SYNCED',
              // Update with Samsara data
              make: queueItem.make || undefined,
              model: queueItem.model || undefined,
              year: queueItem.year || undefined,
            },
          });
          trailerId = existingTrailer.id;
          action = 'linked';
          console.log(`[SamsaraSync] Linked existing trailer ${existingTrailer.trailerNumber} to Samsara device ${queueItem.name}`);
        } else {
          // Create new trailer with unique number handling
          let finalTrailerNumber = trailerNumber;
          let attempt = 0;
          let created = false;
          let trailerId: string | undefined;
          
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
                // If VIN conflict, can't proceed
                if (createError.meta?.target?.includes('vin')) {
                  return { success: false, error: `VIN ${queueItem.vin} already exists in TMS. Use "Link" action to connect to existing trailer.` };
                }
                // If trailer number conflict, try with suffix
                attempt++;
                finalTrailerNumber = `${trailerNumber}-${attempt}`;
              } else {
                throw createError;
              }
            }
          }
          
          if (!created) {
            return { success: false, error: 'Failed to create trailer after multiple attempts - duplicate exists' };
          }
          
          action = 'created';
        }

        if (!trailerId) {
          return { success: false, error: 'Failed to create or link trailer' };
        }

        await prisma.samsaraDeviceQueue.update({
          where: { id: queueId },
          data: {
            status: action === 'created' ? 'APPROVED' : 'LINKED',
            matchedRecordId: trailerId,
            matchedType: 'TRAILER',
            reviewedAt: now,
            reviewedById: userId,
          },
        });

        return { success: true, recordId: trailerId, action };
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
                data: { status: 'LINKED', matchedRecordId: truck.id, matchedType: 'TRUCK', reviewedAt: now, reviewedById: userId },
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
                data: { status: 'LINKED', matchedRecordId: trailer.id, matchedType: 'TRAILER', reviewedAt: now, reviewedById: userId },
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
          reviewedById: userId,
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
          reviewedById: userId,
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

    const stats = await getSamsaraVehicleStats(this.companyId).catch(() => []);
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


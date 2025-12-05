/**
 * Fleet Maintenance Service
 * 
 * Integrates Samsara fault codes with Fleet department maintenance tracking.
 * - Creates maintenance alerts from Samsara diagnostics
 * - Tracks fault history per truck
 * - Generates maintenance reports
 * - Notifies Fleet users of critical faults
 */

import { prisma } from '@/lib/prisma';
import { getSamsaraVehicleDiagnostics } from '@/lib/integrations/samsara';

// ============================================
// TYPES
// ============================================

export interface FaultSummary {
  truckId: string;
  truckNumber: string;
  activeFaults: number;
  criticalFaults: number;
  checkEngineLightOn: boolean;
  lastFaultDate?: Date;
}

export interface FaultSyncResult {
  trucksProcessed: number;
  newFaults: number;
  resolvedFaults: number;
  errors: string[];
}

interface SamsaraFault {
  code?: string;
  description?: string;
  severity?: string;
  active?: boolean;
  occurredAt?: string;
}

// ============================================
// SEVERITY CLASSIFICATION
// ============================================

const CRITICAL_FAULT_CODES = [
  'P0300', 'P0301', 'P0302', 'P0303', 'P0304', // Misfires
  'P0217', // Overheating
  'P0520', 'P0521', 'P0522', // Oil pressure
  'P0562', 'P0563', // System voltage
  'P2291', // Injection system
  'U0100', 'U0101', 'U0121', // CAN bus communication
];

const WARNING_FAULT_CODES = [
  'P0128', // Coolant thermostat
  'P0171', 'P0172', 'P0174', 'P0175', // Fuel trim
  'P0420', 'P0430', // Catalyst efficiency
  'P0455', 'P0456', // EVAP system
  'P0700', // Transmission control
  'P0A7F', // Hybrid battery
];

function classifyFaultSeverity(code?: string): 'CRITICAL' | 'WARNING' | 'INFO' {
  if (!code) return 'INFO';
  const upperCode = code.toUpperCase();
  if (CRITICAL_FAULT_CODES.some(c => upperCode.startsWith(c))) return 'CRITICAL';
  if (WARNING_FAULT_CODES.some(c => upperCode.startsWith(c))) return 'WARNING';
  // P-codes are generally engine/powertrain related
  if (upperCode.startsWith('P0') || upperCode.startsWith('P1')) return 'WARNING';
  return 'INFO';
}

// ============================================
// SERVICE
// ============================================

export class FleetMaintenanceService {
  private readonly companyId: string;

  constructor(companyId: string) {
    this.companyId = companyId;
  }

  /**
   * Sync fault codes from Samsara for all linked trucks
   */
  async syncFaultCodes(): Promise<FaultSyncResult> {
    const result: FaultSyncResult = {
      trucksProcessed: 0,
      newFaults: 0,
      resolvedFaults: 0,
      errors: [],
    };

    try {
      // Get all trucks with Samsara IDs
      const trucks = await prisma.truck.findMany({
        where: {
          companyId: this.companyId,
          deletedAt: null,
          samsaraId: { not: null },
        },
        select: { id: true, truckNumber: true, samsaraId: true },
      });

      if (trucks.length === 0) {
        return result;
      }

      // Fetch diagnostics from Samsara
      const diagnostics = await getSamsaraVehicleDiagnostics(undefined, this.companyId).catch((err) => {
        result.errors.push(`Failed to fetch diagnostics: ${err.message}`);
        return [];
      });

      if (!diagnostics || diagnostics.length === 0) {
        return result;
      }

      // Build map of diagnostics by vehicle ID
      const diagnosticsMap = new Map<string, { faults: SamsaraFault[]; checkEngineLightOn?: boolean }>();
      diagnostics.forEach((d: any) => {
        if (d.vehicleId) {
          diagnosticsMap.set(d.vehicleId, {
            faults: d.faults || [],
            checkEngineLightOn: d.checkEngineLightOn,
          });
        }
      });

      // Process each truck
      for (const truck of trucks) {
        try {
          const diag = diagnosticsMap.get(truck.samsaraId!);
          if (diag) {
            const syncResult = await this.processTruckDiagnostics(truck.id, diag.faults, diag.checkEngineLightOn);
            result.newFaults += syncResult.newFaults;
            result.resolvedFaults += syncResult.resolvedFaults;
          }
          result.trucksProcessed++;
        } catch (err: any) {
          result.errors.push(`Truck ${truck.truckNumber}: ${err.message}`);
        }
      }

      console.log(`[FleetMaintenance] Sync complete:`, result);
      return result;
    } catch (error: any) {
      result.errors.push(`Sync failed: ${error.message}`);
      return result;
    }
  }

  /**
   * Process diagnostics for a single truck
   */
  private async processTruckDiagnostics(
    truckId: string,
    faults: SamsaraFault[],
    checkEngineLightOn?: boolean
  ): Promise<{ newFaults: number; resolvedFaults: number }> {
    let newFaults = 0;
    let resolvedFaults = 0;

    // Get existing active faults for this truck
    const existingFaults = await prisma.truckFaultHistory.findMany({
      where: {
        truckId,
        isActive: true,
      },
    });

    const existingFaultCodes = new Set(existingFaults.map(f => f.faultCode));
    const currentFaultCodes = new Set(faults.filter(f => f.active !== false).map(f => f.code || 'UNKNOWN'));

    // Add new faults
    for (const fault of faults) {
      if (fault.active === false) continue;
      const faultCode = fault.code || 'UNKNOWN';

      if (!existingFaultCodes.has(faultCode)) {
        await prisma.truckFaultHistory.create({
          data: {
            truckId,
            companyId: this.companyId,
            faultCode,
            description: fault.description,
            severity: classifyFaultSeverity(faultCode),
            source: 'SAMSARA',
            occurredAt: fault.occurredAt ? new Date(fault.occurredAt) : new Date(),
            isActive: true,
          },
        });
        newFaults++;
      }
    }

    // Mark resolved faults
    for (const existingFault of existingFaults) {
      if (!currentFaultCodes.has(existingFault.faultCode)) {
        await prisma.truckFaultHistory.update({
          where: { id: existingFault.id },
          data: {
            isActive: false,
            resolvedAt: new Date(),
          },
        });
        resolvedFaults++;
      }
    }

    // If check engine light is on, ensure we have a record
    if (checkEngineLightOn && !existingFaultCodes.has('CHECK_ENGINE_LIGHT')) {
      await prisma.truckFaultHistory.create({
        data: {
          truckId,
          companyId: this.companyId,
          faultCode: 'CHECK_ENGINE_LIGHT',
          description: 'Check Engine Light is illuminated',
          severity: 'CRITICAL',
          source: 'SAMSARA',
          occurredAt: new Date(),
          isActive: true,
        },
      });
      newFaults++;
    }

    return { newFaults, resolvedFaults };
  }

  /**
   * Get all trucks with active faults
   */
  async getTrucksWithActiveFaults(): Promise<FaultSummary[]> {
    const trucks = await prisma.truck.findMany({
      where: {
        companyId: this.companyId,
        deletedAt: null,
        faultHistory: {
          some: {
            isActive: true,
          },
        },
      },
      select: {
        id: true,
        truckNumber: true,
        faultHistory: {
          where: { isActive: true },
          select: {
            faultCode: true,
            severity: true,
            occurredAt: true,
          },
        },
      },
    });

    return trucks.map(truck => ({
      truckId: truck.id,
      truckNumber: truck.truckNumber,
      activeFaults: truck.faultHistory.length,
      criticalFaults: truck.faultHistory.filter(f => f.severity === 'CRITICAL').length,
      checkEngineLightOn: truck.faultHistory.some(f => f.faultCode === 'CHECK_ENGINE_LIGHT'),
      lastFaultDate: truck.faultHistory.length > 0 
        ? truck.faultHistory.reduce((latest, f) => 
            f.occurredAt > latest ? f.occurredAt : latest, truck.faultHistory[0].occurredAt)
        : undefined,
    }));
  }

  /**
   * Get fault history for a specific truck
   */
  async getTruckFaultHistory(truckId: string, includeResolved = false) {
    return prisma.truckFaultHistory.findMany({
      where: {
        truckId,
        ...(includeResolved ? {} : { isActive: true }),
      },
      orderBy: { occurredAt: 'desc' },
    });
  }

  /**
   * Mark a fault as resolved manually
   */
  async resolveFault(faultId: string, userId: string, notes?: string) {
    return prisma.truckFaultHistory.update({
      where: { id: faultId },
      data: {
        isActive: false,
        resolvedAt: new Date(),
        resolvedById: userId,
        notes,
      },
    });
  }

  /**
   * Get summary statistics for Fleet dashboard
   */
  async getFleetFaultSummary() {
    const activeFaults = await prisma.truckFaultHistory.groupBy({
      by: ['severity'],
      where: {
        companyId: this.companyId,
        isActive: true,
      },
      _count: true,
    });

    const trucksAffected = await prisma.truck.count({
      where: {
        companyId: this.companyId,
        deletedAt: null,
        faultHistory: {
          some: { isActive: true },
        },
      },
    });

    const criticalCount = activeFaults.find(f => f.severity === 'CRITICAL')?._count || 0;
    const warningCount = activeFaults.find(f => f.severity === 'WARNING')?._count || 0;
    const infoCount = activeFaults.find(f => f.severity === 'INFO')?._count || 0;

    return {
      totalActiveFaults: criticalCount + warningCount + infoCount,
      criticalFaults: criticalCount,
      warningFaults: warningCount,
      infoFaults: infoCount,
      trucksAffected,
    };
  }

  /**
   * Get recent faults for notifications
   */
  async getRecentCriticalFaults(since: Date) {
    return prisma.truckFaultHistory.findMany({
      where: {
        companyId: this.companyId,
        severity: 'CRITICAL',
        occurredAt: { gte: since },
        notifiedFleet: false,
      },
      include: {
        truck: {
          select: { truckNumber: true },
        },
      },
      orderBy: { occurredAt: 'desc' },
    });
  }

  /**
   * Mark faults as notified
   */
  async markFaultsNotified(faultIds: string[]) {
    await prisma.truckFaultHistory.updateMany({
      where: {
        id: { in: faultIds },
      },
      data: {
        notifiedFleet: true,
        notifiedAt: new Date(),
      },
    });
  }
}





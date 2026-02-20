import { prisma } from '@/lib/prisma';
import { DriverHomeTimeCalculator } from './DriverHomeTimeCalculator';
import { DormantEquipmentDetector } from './DormantEquipmentDetector';
import type {
  FleetMonitoringSnapshot,
  FleetMonitoringSettings,
  FleetUtilizationPeriod,
} from './types';
import { DEFAULT_MONITORING_SETTINGS } from './types';

/**
 * Orchestrates fleet monitoring: driver home time, dormant equipment detection,
 * and fleet utilization analytics.
 */
export class FleetMonitoringManager {
  private readonly homeTimeCalc: DriverHomeTimeCalculator;
  private readonly dormantDetector: DormantEquipmentDetector;

  constructor(private readonly companyId: string) {
    this.homeTimeCalc = new DriverHomeTimeCalculator(companyId);
    this.dormantDetector = new DormantEquipmentDetector(companyId);
  }

  async getMonitoringSnapshot(mcNumberId?: string): Promise<FleetMonitoringSnapshot> {
    const settings = await this.getSettings();

    const [idleDrivers, truckResult, trailerResult] = await Promise.all([
      this.homeTimeCalc.getIdleDrivers(mcNumberId),
      this.dormantDetector.detectDormantTrucks(settings, mcNumberId),
      this.dormantDetector.detectDormantTrailers(settings, mcNumberId),
    ]);

    const avgIdle =
      idleDrivers.length > 0
        ? idleDrivers.reduce((sum, d) => sum + d.idleHours, 0) / idleDrivers.length
        : 0;

    return {
      idleDrivers,
      dormantTrucks: truckResult.dormant,
      dormantTrailers: trailerResult.dormant,
      excludedOOS: {
        trucks: truckResult.excludedCount,
        trailers: trailerResult.excludedCount,
      },
      summary: {
        totalIdleDrivers: idleDrivers.length,
        totalDormantTrucks: truckResult.dormant.length,
        totalDormantTrailers: trailerResult.dormant.length,
        averageIdleHours: Math.round(avgIdle * 10) / 10,
      },
      generatedAt: new Date(),
    };
  }

  async getUtilizationHistory(
    period: 'daily' | 'weekly',
    rangeDays: number,
    mcNumberId?: string
  ): Promise<FleetUtilizationPeriod[]> {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - rangeDays);

    const mcFilter: any = mcNumberId ? { mcNumberId } : {};

    const [trucks, trailers, drivers, loads] = await Promise.all([
      prisma.truck.count({
        where: { companyId: this.companyId, isActive: true, deletedAt: null, ...mcFilter },
      }),
      prisma.trailer.count({
        where: { companyId: this.companyId, isActive: true, deletedAt: null, ...mcFilter },
      }),
      prisma.driver.count({
        where: { companyId: this.companyId, employeeStatus: 'ACTIVE', deletedAt: null, ...mcFilter },
      }),
      prisma.load.findMany({
        where: {
          companyId: this.companyId,
          deletedAt: null,
          status: { notIn: ['CANCELLED'] },
          ...mcFilter,
          OR: [
            { assignedAt: { gte: startDate } },
            { deliveredAt: { gte: startDate } },
          ],
        },
        select: {
          truckId: true,
          trailerId: true,
          driverId: true,
          assignedAt: true,
          deliveredAt: true,
        },
      }),
    ]);

    const periods: FleetUtilizationPeriod[] = [];
    const stepDays = period === 'weekly' ? 7 : 1;
    const cursor = new Date(startDate);

    while (cursor < now) {
      const periodStart = new Date(cursor);
      const periodEnd = new Date(cursor);
      periodEnd.setDate(periodEnd.getDate() + stepDays);
      if (periodEnd > now) periodEnd.setTime(now.getTime());

      // Count unique equipment/drivers active in this period
      const activeTruckIds = new Set<string>();
      const activeTrailerIds = new Set<string>();
      const activeDriverIds = new Set<string>();

      for (const load of loads) {
        const loadStart = load.assignedAt;
        const loadEnd = load.deliveredAt || now;
        if (loadStart && loadStart <= periodEnd && loadEnd >= periodStart) {
          if (load.truckId) activeTruckIds.add(load.truckId);
          if (load.trailerId) activeTrailerIds.add(load.trailerId);
          if (load.driverId) activeDriverIds.add(load.driverId);
        }
      }

      const label =
        period === 'weekly'
          ? `${periodStart.toISOString().slice(0, 10)} - ${periodEnd.toISOString().slice(0, 10)}`
          : periodStart.toISOString().slice(0, 10);

      periods.push({
        period: label,
        truckUtilizationRate: trucks > 0 ? Math.round((activeTruckIds.size / trucks) * 100) : 0,
        trailerUtilizationRate: trailers > 0 ? Math.round((activeTrailerIds.size / trailers) * 100) : 0,
        driverUtilizationRate: drivers > 0 ? Math.round((activeDriverIds.size / drivers) * 100) : 0,
        activeTrucks: activeTruckIds.size,
        totalTrucks: trucks,
        activeTrailers: activeTrailerIds.size,
        totalTrailers: trailers,
        busyDrivers: activeDriverIds.size,
        totalDrivers: drivers,
        averageDriverIdleHours: 0, // Derived in frontend from driver utilization
      });

      cursor.setDate(cursor.getDate() + stepDays);
    }

    return periods;
  }

  async getSettings(): Promise<FleetMonitoringSettings> {
    const company = await prisma.companySettings.findFirst({
      where: { companyId: this.companyId },
      select: { generalSettings: true },
    });

    const settings = (company?.generalSettings as any) || {};
    return {
      dormantTruckDays: settings.dormantTruckDays ?? DEFAULT_MONITORING_SETTINGS.dormantTruckDays,
      dormantTrailerDays: settings.dormantTrailerDays ?? DEFAULT_MONITORING_SETTINGS.dormantTrailerDays,
      driverIdleAlertHours: settings.driverIdleAlertHours ?? DEFAULT_MONITORING_SETTINGS.driverIdleAlertHours,
      enableAlerts: settings.enableAlerts ?? DEFAULT_MONITORING_SETTINGS.enableAlerts,
    };
  }

  async updateSettings(updates: Partial<FleetMonitoringSettings>): Promise<FleetMonitoringSettings> {
    const current = await this.getSettings();
    const merged = { ...current, ...updates };

    const existing = await prisma.companySettings.findFirst({
      where: { companyId: this.companyId },
      select: { id: true, generalSettings: true },
    });

    const generalSettings = {
      ...((existing?.generalSettings as any) || {}),
      dormantTruckDays: merged.dormantTruckDays,
      dormantTrailerDays: merged.dormantTrailerDays,
      driverIdleAlertHours: merged.driverIdleAlertHours,
      enableAlerts: merged.enableAlerts,
    };

    if (existing) {
      await prisma.companySettings.update({
        where: { id: existing.id },
        data: { generalSettings },
      });
    }

    return merged;
  }
}

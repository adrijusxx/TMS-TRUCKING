import { prisma } from '@/lib/prisma';
import { IFTAUtils } from './ifta/IFTAUtils';
import { IFTAMileageService } from './ifta/IFTAMileageService';

/**
 * IFTAManager - Split from original file to comply with 500-line limit.
 * Handles IFTA tax calculations and report generation.
 */
export class IFTAManager {
  /**
   * Calculate IFTA tax for a load
   */
  static async calculateIFTAForLoad(loadId: string, companyId: string) {
    const stateMileages = await IFTAMileageService.calculateMileageByState(loadId);
    let config = await prisma.iFTAConfig.findUnique({ where: { companyId } });

    if (!config) {
      config = await prisma.iFTAConfig.create({
        data: { companyId, stateRates: { KY: 0.0285, NM: 0.04378, OR: 0.237, NY: 0.0546, CT: 0.1 } }
      });
    }

    const stateRates = (config.stateRates as any) || {};
    let totalTax = 0;

    const mileagesWithTax = stateMileages.map(sm => {
      const rate = stateRates[sm.state] || 0;
      const tax = sm.miles * rate;
      totalTax += tax;
      return { ...sm, taxRate: rate, tax: Math.round(tax * 100) / 100 };
    });

    return { totalMiles: stateMileages.reduce((s, m) => s + m.miles, 0), stateMileages: mileagesWithTax, totalTax: Math.round(totalTax * 100) / 100 };
  }

  /**
   * Create or update IFTA entry
   */
  static async createOrUpdateIFTAEntry(loadId: string, companyId: string, periodType: any, periodYear: number, periodQuarter?: number, periodMonth?: number) {
    const load = await prisma.load.findUnique({ where: { id: loadId }, include: { driver: true, truck: true } });
    if (!load?.driverId) throw new Error('Load or driver not found');

    const calc = await this.calculateIFTAForLoad(loadId, companyId);
    const existing = await prisma.iFTAEntry.findUnique({ where: { loadId } });

    const iftaData: any = {
      companyId, loadId, driverId: load.driverId, truckId: load.truckId,
      periodType, periodYear, periodQuarter: periodQuarter || null, periodMonth: periodMonth || null,
      totalMiles: calc.totalMiles, totalTax: calc.totalTax, isCalculated: true, calculatedAt: new Date()
    };

    if (existing) {
      await prisma.iFTAEntry.update({ where: { id: existing.id }, data: iftaData });
      await prisma.iFTAStateMileage.deleteMany({ where: { iftaEntryId: existing.id } });
      await prisma.iFTAStateMileage.createMany({
        data: calc.stateMileages.map(sm => ({ iftaEntryId: existing.id, state: sm.state, miles: sm.miles, taxRate: sm.taxRate, tax: sm.tax }))
      });
      return existing.id;
    }

    const entry = await prisma.iFTAEntry.create({
      data: { ...iftaData, stateMileages: { create: calc.stateMileages.map(sm => ({ state: sm.state, miles: sm.miles, taxRate: sm.taxRate, tax: sm.tax })) } }
    });
    return entry.id;
  }

  /**
   * Generate IFTA report
   */
  static async getIFTAReport(companyId: string, periodType: any, periodYear: number, periodQuarter?: number, periodMonth?: number, driverId?: string, autoCalculate = true, mcNumberId?: any) {
    if (autoCalculate) await this.calculateEntriesForPeriod(companyId, periodType, periodYear, periodQuarter, periodMonth, driverId, mcNumberId);

    const where: any = { companyId, periodType, periodYear, isCalculated: true };
    if (periodQuarter) where.periodQuarter = periodQuarter;
    if (periodMonth) where.periodMonth = periodMonth;
    if (driverId) where.driverId = driverId;

    return prisma.iFTAEntry.findMany({
      where,
      include: { load: { select: { loadNumber: true, pickupDate: true, deliveryDate: true } }, driver: { include: { user: true } }, truck: true, stateMileages: { orderBy: { state: 'asc' } } },
      orderBy: [{ driver: { user: { lastName: 'asc' } } }, { driver: { user: { firstName: 'asc' } } }]
    });
  }

  static async calculateEntriesForPeriod(companyId: string, periodType: any, periodYear: number, periodQuarter?: number, periodMonth?: number, driverId?: string, mcNumberId?: any) {
    const start = IFTAUtils.getPeriodStart(periodType, periodYear, periodQuarter, periodMonth);
    const end = IFTAUtils.getPeriodEnd(periodType, periodYear, periodQuarter, periodMonth);

    const loads = await prisma.load.findMany({
      where: { companyId, deletedAt: null, driverId: { not: null }, mcNumberId: mcNumberId ? (Array.isArray(mcNumberId) ? { in: mcNumberId } : mcNumberId) : undefined, OR: [{ pickupDate: { gte: start, lte: end } }, { deliveryDate: { gte: start, lte: end } }] },
      select: { id: true }
    });

    for (const load of loads) {
      try {
        const existing = await prisma.iFTAEntry.findUnique({ where: { loadId: load.id } });
        if (!existing?.isCalculated) await this.createOrUpdateIFTAEntry(load.id, companyId, periodType, periodYear, periodQuarter, periodMonth);
      } catch (e) { console.error('IFTA calc failed for load', load.id, e); }
    }
    return loads.length;
  }
}

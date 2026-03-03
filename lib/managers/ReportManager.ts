/**
 * ReportManager
 *
 * Centralized report generation for financial, operational, and compliance reports.
 * Each method returns structured data; UI components handle formatting.
 */

import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { logger } from '@/lib/utils/logger';

interface DateRange {
  from: Date;
  to: Date;
}

interface McContext {
  companyId: string;
  mcNumberId?: string;
}

export class ReportManager {
  /**
   * Profit & Loss statement for a date range.
   */
  static async profitAndLoss(ctx: McContext, range: DateRange) {
    const mcWhere = buildMcNumberWhereClause(ctx.companyId, ctx.mcNumberId);

    const loads = await prisma.load.findMany({
      where: {
        ...mcWhere,
        deliveryDate: { gte: range.from, lte: range.to },
        deletedAt: null,
      },
      select: {
        revenue: true,
        driverPay: true,
        totalExpenses: true,
        netProfit: true,
        customer: { select: { id: true, name: true } },
      },
    });

    const totalRevenue = loads.reduce((sum, l) => sum + (l.revenue ?? 0), 0);
    const totalDriverPay = loads.reduce((sum, l) => sum + (l.driverPay ?? 0), 0);
    const totalExpenses = loads.reduce((sum, l) => sum + (l.totalExpenses ?? 0), 0);
    const netProfit = totalRevenue - totalDriverPay - totalExpenses;

    // Revenue by customer
    const byCustomer = new Map<string, { name: string; revenue: number; loads: number }>();
    for (const load of loads) {
      const custId = load.customer?.id ?? 'unknown';
      const existing = byCustomer.get(custId) ?? { name: load.customer?.name ?? 'Unknown', revenue: 0, loads: 0 };
      existing.revenue += load.revenue ?? 0;
      existing.loads += 1;
      byCustomer.set(custId, existing);
    }

    return {
      period: { from: range.from, to: range.to },
      totalRevenue,
      costOfSales: { driverPay: totalDriverPay, expenses: totalExpenses },
      netProfit,
      margin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
      loadCount: loads.length,
      revenueByCustomer: Array.from(byCustomer.values()).sort((a, b) => b.revenue - a.revenue),
    };
  }

  /**
   * Driver profitability report.
   */
  static async driverProfitability(ctx: McContext, range: DateRange) {
    const mcWhere = buildMcNumberWhereClause(ctx.companyId, ctx.mcNumberId);

    const loads = await prisma.load.findMany({
      where: {
        ...mcWhere,
        deliveryDate: { gte: range.from, lte: range.to },
        driverId: { not: null },
        deletedAt: null,
      },
      select: {
        revenue: true,
        driverPay: true,
        totalExpenses: true,
        totalMiles: true,
        driver: { select: { id: true, driverNumber: true, user: { select: { firstName: true, lastName: true } } } },
      },
    });

    const byDriver = new Map<string, {
      name: string;
      driverNumber: string;
      revenue: number;
      driverPay: number;
      expenses: number;
      miles: number;
      loads: number;
    }>();

    for (const load of loads) {
      const driverId = load.driver?.id ?? 'unknown';
      const existing = byDriver.get(driverId) ?? {
        name: `${load.driver?.user?.firstName ?? ''} ${load.driver?.user?.lastName ?? ''}`.trim(),
        driverNumber: load.driver?.driverNumber ?? '',
        revenue: 0, driverPay: 0, expenses: 0, miles: 0, loads: 0,
      };
      existing.revenue += load.revenue ?? 0;
      existing.driverPay += load.driverPay ?? 0;
      existing.expenses += load.totalExpenses ?? 0;
      existing.miles += load.totalMiles ?? 0;
      existing.loads += 1;
      byDriver.set(driverId, existing);
    }

    return Array.from(byDriver.values()).map((d) => ({
      ...d,
      netProfit: d.revenue - d.driverPay - d.expenses,
      margin: d.revenue > 0 ? ((d.revenue - d.driverPay - d.expenses) / d.revenue) * 100 : 0,
      revenuePerMile: d.miles > 0 ? d.revenue / d.miles : 0,
    })).sort((a, b) => b.netProfit - a.netProfit);
  }

  /**
   * Customer profitability report.
   */
  static async customerProfitability(ctx: McContext, range: DateRange) {
    const mcWhere = buildMcNumberWhereClause(ctx.companyId, ctx.mcNumberId);

    const loads = await prisma.load.findMany({
      where: {
        ...mcWhere,
        deliveryDate: { gte: range.from, lte: range.to },
        deletedAt: null,
      },
      select: {
        revenue: true,
        driverPay: true,
        totalExpenses: true,
        totalMiles: true,
        customer: { select: { id: true, name: true } },
      },
    });

    const byCustomer = new Map<string, {
      name: string;
      revenue: number;
      costs: number;
      miles: number;
      loads: number;
    }>();

    for (const load of loads) {
      const custId = load.customer?.id ?? 'unknown';
      const existing = byCustomer.get(custId) ?? {
        name: load.customer?.name ?? 'Unknown',
        revenue: 0, costs: 0, miles: 0, loads: 0,
      };
      existing.revenue += load.revenue ?? 0;
      existing.costs += (load.driverPay ?? 0) + (load.totalExpenses ?? 0);
      existing.miles += load.totalMiles ?? 0;
      existing.loads += 1;
      byCustomer.set(custId, existing);
    }

    return Array.from(byCustomer.values()).map((c) => ({
      ...c,
      netProfit: c.revenue - c.costs,
      margin: c.revenue > 0 ? ((c.revenue - c.costs) / c.revenue) * 100 : 0,
      revenuePerMile: c.miles > 0 ? c.revenue / c.miles : 0,
    })).sort((a, b) => b.netProfit - a.netProfit);
  }

  /**
   * Lane analysis — profitability by origin/destination pair.
   */
  static async laneAnalysis(ctx: McContext, range: DateRange) {
    const mcWhere = buildMcNumberWhereClause(ctx.companyId, ctx.mcNumberId);

    const loads = await prisma.load.findMany({
      where: {
        ...mcWhere,
        deliveryDate: { gte: range.from, lte: range.to },
        deletedAt: null,
      },
      select: {
        pickupCity: true,
        pickupState: true,
        deliveryCity: true,
        deliveryState: true,
        revenue: true,
        driverPay: true,
        totalExpenses: true,
        totalMiles: true,
      },
    });

    const byLane = new Map<string, {
      origin: string;
      destination: string;
      revenue: number;
      costs: number;
      miles: number;
      loads: number;
    }>();

    for (const load of loads) {
      const origin = `${load.pickupCity ?? ''}, ${load.pickupState ?? ''}`.trim();
      const dest = `${load.deliveryCity ?? ''}, ${load.deliveryState ?? ''}`.trim();
      const key = `${origin} → ${dest}`;
      const existing = byLane.get(key) ?? { origin, destination: dest, revenue: 0, costs: 0, miles: 0, loads: 0 };
      existing.revenue += load.revenue ?? 0;
      existing.costs += (load.driverPay ?? 0) + (load.totalExpenses ?? 0);
      existing.miles += load.totalMiles ?? 0;
      existing.loads += 1;
      byLane.set(key, existing);
    }

    return Array.from(byLane.values()).map((lane) => ({
      ...lane,
      netProfit: lane.revenue - lane.costs,
      margin: lane.revenue > 0 ? ((lane.revenue - lane.costs) / lane.revenue) * 100 : 0,
      avgRevenuePerLoad: lane.loads > 0 ? lane.revenue / lane.loads : 0,
      revenuePerMile: lane.miles > 0 ? lane.revenue / lane.miles : 0,
    })).sort((a, b) => b.loads - a.loads);
  }

  /**
   * On-time delivery report.
   */
  static async onTimeDelivery(ctx: McContext, range: DateRange) {
    const mcWhere = buildMcNumberWhereClause(ctx.companyId, ctx.mcNumberId);

    const loads = await prisma.load.findMany({
      where: {
        ...mcWhere,
        deliveryDate: { gte: range.from, lte: range.to },
        status: { in: ['DELIVERED', 'INVOICED', 'PAID'] },
        deletedAt: null,
      },
      select: {
        id: true,
        deliveryDate: true,
        deliveredAt: true,
        customer: { select: { id: true, name: true } },
        pickupCity: true,
        pickupState: true,
        deliveryCity: true,
        deliveryState: true,
      },
    });

    let onTime = 0;
    let late = 0;
    let noData = 0;

    for (const load of loads) {
      if (!load.deliveredAt || !load.deliveryDate) {
        noData++;
        continue;
      }
      if (new Date(load.deliveredAt) <= new Date(load.deliveryDate)) {
        onTime++;
      } else {
        late++;
      }
    }

    const total = onTime + late;

    return {
      total: loads.length,
      onTime,
      late,
      noData,
      onTimeRate: total > 0 ? (onTime / total) * 100 : 0,
    };
  }

  /**
   * Driver productivity report.
   */
  static async driverProductivity(ctx: McContext, range: DateRange) {
    const mcWhere = buildMcNumberWhereClause(ctx.companyId, ctx.mcNumberId);

    const loads = await prisma.load.findMany({
      where: {
        ...mcWhere,
        deliveryDate: { gte: range.from, lte: range.to },
        driverId: { not: null },
        deletedAt: null,
      },
      select: {
        revenue: true,
        totalMiles: true,
        driver: { select: { id: true, driverNumber: true, user: { select: { firstName: true, lastName: true } } } },
      },
    });

    const weeks = Math.max(1, Math.ceil((range.to.getTime() - range.from.getTime()) / (7 * 86400000)));

    const byDriver = new Map<string, {
      name: string;
      driverNumber: string;
      revenue: number;
      miles: number;
      loads: number;
    }>();

    for (const load of loads) {
      const dId = load.driver?.id ?? 'unknown';
      const existing = byDriver.get(dId) ?? {
        name: `${load.driver?.user?.firstName ?? ''} ${load.driver?.user?.lastName ?? ''}`.trim(),
        driverNumber: load.driver?.driverNumber ?? '',
        revenue: 0, miles: 0, loads: 0,
      };
      existing.revenue += load.revenue ?? 0;
      existing.miles += load.totalMiles ?? 0;
      existing.loads += 1;
      byDriver.set(dId, existing);
    }

    return Array.from(byDriver.values()).map((d) => ({
      ...d,
      loadsPerWeek: d.loads / weeks,
      revenuePerWeek: d.revenue / weeks,
      milesPerWeek: d.miles / weeks,
    })).sort((a, b) => b.revenuePerWeek - a.revenuePerWeek);
  }
}

/**
 * LeadSourceAnalytics
 *
 * Tracks ROI per lead source by calculating conversion rates, average
 * time-to-convert, and cost effectiveness. Used by CRM analytics
 * dashboards to identify the best-performing lead channels.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
import type { LeadSource } from '@prisma/client';

interface DateRange {
  from?: Date;
  to?: Date;
}

export interface SourceROIEntry {
  source: LeadSource;
  totalLeads: number;
  hiredCount: number;
  conversionRate: number;
  avgDaysToConvert: number;
  /** Revenue from loads assigned to drivers converted from this source */
  revenueGenerated: number;
}

export interface TopSourceEntry extends SourceROIEntry {
  rank: number;
}

export class LeadSourceAnalytics {
  /**
   * Calculate ROI metrics per lead source
   */
  static async getSourceROI(
    companyId: string,
    dateRange?: DateRange
  ): Promise<SourceROIEntry[]> {
    const dateFilter = buildDateFilter(dateRange);
    const baseWhere = { companyId, deletedAt: null, ...dateFilter };

    // Total leads grouped by source
    const leadsBySource = await prisma.lead.groupBy({
      by: ['source'],
      where: baseWhere,
      _count: { id: true },
    });

    // Hired leads grouped by source
    const hiredBySource = await prisma.lead.groupBy({
      by: ['source'],
      where: { ...baseWhere, status: 'HIRED' },
      _count: { id: true },
    });
    const hiredMap = toCountMap(hiredBySource);

    // Average time to convert (createdAt -> last status change to HIRED)
    const avgTimeMap = await getAvgTimeToConvert(companyId, dateRange);

    // Revenue from drivers linked to converted leads
    const revenueMap = await getRevenueBySource(companyId, dateRange);

    const results: SourceROIEntry[] = leadsBySource.map((entry) => {
      const source = entry.source;
      const totalLeads = entry._count.id;
      const hiredCount = hiredMap[source] ?? 0;
      const conversionRate = totalLeads > 0
        ? Math.round((hiredCount / totalLeads) * 1000) / 10
        : 0;

      return {
        source,
        totalLeads,
        hiredCount,
        conversionRate,
        avgDaysToConvert: avgTimeMap[source] ?? 0,
        revenueGenerated: revenueMap[source] ?? 0,
      };
    });

    logger.debug('Source ROI calculated', { companyId, sources: results.length });
    return results.sort((a, b) => b.conversionRate - a.conversionRate);
  }

  /**
   * Ranked list of best-performing lead sources
   */
  static async getTopSources(
    companyId: string,
    limit: number = 10
  ): Promise<TopSourceEntry[]> {
    const all = await this.getSourceROI(companyId);

    // Score: weighted by conversion rate (60%) and total hired (40%)
    const maxHired = Math.max(...all.map((s) => s.hiredCount), 1);

    const scored = all.map((entry) => ({
      ...entry,
      score: entry.conversionRate * 0.6 + (entry.hiredCount / maxHired) * 100 * 0.4,
    }));

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map((entry, idx) => ({
      source: entry.source,
      totalLeads: entry.totalLeads,
      hiredCount: entry.hiredCount,
      conversionRate: entry.conversionRate,
      avgDaysToConvert: entry.avgDaysToConvert,
      revenueGenerated: entry.revenueGenerated,
      rank: idx + 1,
    }));
  }
}

// --------------- Helpers ---------------

function buildDateFilter(range?: DateRange) {
  if (!range) return {};
  const filter: Record<string, unknown> = {};
  if (range.from || range.to) {
    const createdAt: Record<string, Date> = {};
    if (range.from) createdAt.gte = range.from;
    if (range.to) createdAt.lte = range.to;
    filter.createdAt = createdAt;
  }
  return filter;
}

function toCountMap(
  grouped: { source: LeadSource; _count: { id: number } }[]
): Record<string, number> {
  return Object.fromEntries(grouped.map((g) => [g.source, g._count.id]));
}

/**
 * Average days from lead creation to HIRED status, grouped by source
 */
async function getAvgTimeToConvert(
  companyId: string,
  dateRange?: DateRange
): Promise<Record<string, number>> {
  const dateFilter = buildDateFilter(dateRange);

  const hiredLeads = await prisma.lead.findMany({
    where: { companyId, deletedAt: null, status: 'HIRED', ...dateFilter },
    select: {
      source: true,
      createdAt: true,
      activities: {
        where: { type: 'HIRED' },
        select: { createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  const bySource: Record<string, number[]> = {};

  for (const lead of hiredLeads) {
    const hiredAt = lead.activities[0]?.createdAt ?? lead.createdAt;
    const days = Math.max(
      0,
      Math.floor((hiredAt.getTime() - lead.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    );
    if (!bySource[lead.source]) bySource[lead.source] = [];
    bySource[lead.source].push(days);
  }

  const result: Record<string, number> = {};
  for (const [source, daysList] of Object.entries(bySource)) {
    const avg = daysList.reduce((sum, d) => sum + d, 0) / daysList.length;
    result[source] = Math.round(avg * 10) / 10;
  }

  return result;
}

/**
 * Revenue generated from loads linked to drivers that were converted
 * from leads, grouped by the lead's source.
 */
async function getRevenueBySource(
  companyId: string,
  dateRange?: DateRange
): Promise<Record<string, number>> {
  const dateFilter = buildDateFilter(dateRange);

  const leadsWithDrivers = await prisma.lead.findMany({
    where: {
      companyId,
      deletedAt: null,
      status: 'HIRED',
      driverId: { not: null },
      ...dateFilter,
    },
    select: {
      source: true,
      driverId: true,
    },
  });

  if (leadsWithDrivers.length === 0) return {};

  const driverSourceMap: Record<string, LeadSource> = {};
  for (const lead of leadsWithDrivers) {
    if (lead.driverId) {
      driverSourceMap[lead.driverId] = lead.source;
    }
  }

  const driverIds = Object.keys(driverSourceMap);

  const loads = await prisma.load.findMany({
    where: {
      companyId,
      driverId: { in: driverIds },
      status: { notIn: ['CANCELLED'] },
    },
    select: {
      driverId: true,
      revenue: true,
    },
  });

  const revenueBySource: Record<string, number> = {};
  for (const load of loads) {
    if (!load.driverId) continue;
    const source = driverSourceMap[load.driverId];
    if (!source) continue;
    const rev = Number(load.revenue ?? 0);
    revenueBySource[source] = (revenueBySource[source] ?? 0) + rev;
  }

  // Round to 2 decimal places
  for (const key of Object.keys(revenueBySource)) {
    revenueBySource[key] = Math.round(revenueBySource[key] * 100) / 100;
  }

  return revenueBySource;
}

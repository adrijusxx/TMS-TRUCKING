import { PrismaClient } from '@prisma/client';
import { BaseSafetyService } from './BaseSafetyService';

export interface CostData {
  total: number;
  items: Array<{ label: string; amount: number; count: number }>;
}

export interface DriverCostData {
  driverId: string;
  driverName: string;
  incidentCost: number;
  claimCost: number;
  citationCost: number;
  totalCost: number;
}

export interface TrendData {
  month: string;
  value: number;
  count: number;
}

export interface ComplianceReport {
  totalDrivers: number;
  compliantDrivers: number;
  compliancePercentage: number;
  expiredDocuments: number;
  expiringDocuments: number;
}

export class AnalyticsService extends BaseSafetyService {
  constructor(prisma: PrismaClient, companyId?: string, mcNumberId?: string) {
    super(prisma, companyId, mcNumberId);
  }

  async getIncidentCosts(startDate: Date, endDate: Date): Promise<CostData> {
    try {
      const incidents = await this.prisma.safetyIncident.findMany({
        where: {
          ...this.getCompanyFilter(),
          date: { gte: startDate, lte: endDate },
          deletedAt: null,
        },
        select: { incidentType: true, estimatedCost: true },
      });

      const byType = new Map<string, { amount: number; count: number }>();
      let total = 0;

      for (const inc of incidents) {
        const cost = inc.estimatedCost ?? 0;
        total += cost;
        const entry = byType.get(inc.incidentType) ?? { amount: 0, count: 0 };
        entry.amount += cost;
        entry.count += 1;
        byType.set(inc.incidentType, entry);
      }

      return {
        total,
        items: Array.from(byType.entries()).map(([label, data]) => ({
          label,
          ...data,
        })),
      };
    } catch (error) {
      this.handleError(error, 'Failed to get incident costs');
    }
  }

  async getClaimCosts(startDate: Date, endDate: Date): Promise<CostData> {
    try {
      const claims = await this.prisma.insuranceClaim.findMany({
        where: {
          ...this.getCompanyFilter(),
          dateOfLoss: { gte: startDate, lte: endDate },
          deletedAt: null,
        },
        select: { claimType: true, paidAmount: true, settlementAmount: true },
      });

      const byType = new Map<string, { amount: number; count: number }>();
      let total = 0;

      for (const claim of claims) {
        const cost = (claim.paidAmount ?? 0) + (claim.settlementAmount ?? 0);
        total += cost;
        const entry = byType.get(claim.claimType) ?? { amount: 0, count: 0 };
        entry.amount += cost;
        entry.count += 1;
        byType.set(claim.claimType, entry);
      }

      return {
        total,
        items: Array.from(byType.entries()).map(([label, data]) => ({
          label,
          ...data,
        })),
      };
    } catch (error) {
      this.handleError(error, 'Failed to get claim costs');
    }
  }

  async getCostPerDriver(startDate: Date, endDate: Date): Promise<DriverCostData[]> {
    try {
      const [incidents, claims, citations] = await Promise.all([
        this.prisma.safetyIncident.findMany({
          where: {
            ...this.getCompanyFilter(),
            date: { gte: startDate, lte: endDate },
            driverId: { not: null },
            deletedAt: null,
          },
          select: {
            driverId: true,
            estimatedCost: true,
            driver: { select: { user: { select: { firstName: true, lastName: true } } } },
          },
        }),
        this.prisma.insuranceClaim.findMany({
          where: {
            ...this.getCompanyFilter(),
            dateOfLoss: { gte: startDate, lte: endDate },
            driverId: { not: null },
            deletedAt: null,
          },
          select: { driverId: true, paidAmount: true, settlementAmount: true },
        }),
        this.prisma.citation.findMany({
          where: {
            ...this.getCompanyFilter(),
            citationDate: { gte: startDate, lte: endDate },
            driverId: { not: null },
            deletedAt: null,
          },
          select: { driverId: true, fineAmount: true },
        }),
      ]);

      const driverMap = new Map<string, DriverCostData>();

      for (const inc of incidents) {
        if (!inc.driverId) continue;
        const entry = driverMap.get(inc.driverId) ?? {
          driverId: inc.driverId,
          driverName: inc.driver
            ? `${inc.driver.user?.firstName ?? ''} ${inc.driver.user?.lastName ?? ''}`.trim()
            : 'Unknown',
          incidentCost: 0,
          claimCost: 0,
          citationCost: 0,
          totalCost: 0,
        };
        entry.incidentCost += inc.estimatedCost ?? 0;
        driverMap.set(inc.driverId, entry);
      }

      for (const claim of claims) {
        if (!claim.driverId) continue;
        const entry = driverMap.get(claim.driverId) ?? {
          driverId: claim.driverId,
          driverName: 'Unknown',
          incidentCost: 0,
          claimCost: 0,
          citationCost: 0,
          totalCost: 0,
        };
        entry.claimCost += (claim.paidAmount ?? 0) + (claim.settlementAmount ?? 0);
        driverMap.set(claim.driverId, entry);
      }

      for (const cit of citations) {
        if (!cit.driverId) continue;
        const entry = driverMap.get(cit.driverId) ?? {
          driverId: cit.driverId,
          driverName: 'Unknown',
          incidentCost: 0,
          claimCost: 0,
          citationCost: 0,
          totalCost: 0,
        };
        entry.citationCost += cit.fineAmount ?? 0;
        driverMap.set(cit.driverId, entry);
      }

      return Array.from(driverMap.values())
        .map((d) => ({ ...d, totalCost: d.incidentCost + d.claimCost + d.citationCost }))
        .sort((a, b) => b.totalCost - a.totalCost);
    } catch (error) {
      this.handleError(error, 'Failed to get cost per driver');
    }
  }

  async getCostTrends(months: number = 12): Promise<TrendData[]> {
    try {
      const trends: TrendData[] = [];

      for (let i = months - 1; i >= 0; i--) {
        const start = new Date();
        start.setMonth(start.getMonth() - i, 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setMonth(end.getMonth() + 1);

        const [incidents, claims] = await Promise.all([
          this.prisma.safetyIncident.aggregate({
            where: {
              ...this.getCompanyFilter(),
              date: { gte: start, lt: end },
              deletedAt: null,
            },
            _sum: { estimatedCost: true },
            _count: true,
          }),
          this.prisma.insuranceClaim.aggregate({
            where: {
              ...this.getCompanyFilter(),
              dateOfLoss: { gte: start, lt: end },
              deletedAt: null,
            },
            _sum: { paidAmount: true },
            _count: true,
          }),
        ]);

        trends.push({
          month: start.toISOString().slice(0, 7),
          value: (incidents._sum.estimatedCost ?? 0) + (claims._sum.paidAmount ?? 0),
          count: incidents._count + claims._count,
        });
      }

      return trends;
    } catch (error) {
      this.handleError(error, 'Failed to get cost trends');
    }
  }

  async getIncidentTrends(months: number = 12): Promise<TrendData[]> {
    try {
      const trends: TrendData[] = [];

      for (let i = months - 1; i >= 0; i--) {
        const start = new Date();
        start.setMonth(start.getMonth() - i, 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setMonth(end.getMonth() + 1);

        const result = await this.prisma.safetyIncident.aggregate({
          where: {
            ...this.getCompanyFilter(),
            date: { gte: start, lt: end },
            deletedAt: null,
          },
          _sum: { estimatedCost: true },
          _count: true,
        });

        trends.push({
          month: start.toISOString().slice(0, 7),
          value: result._sum.estimatedCost ?? 0,
          count: result._count,
        });
      }

      return trends;
    } catch (error) {
      this.handleError(error, 'Failed to get incident trends');
    }
  }

  async getComplianceStatusReport(): Promise<ComplianceReport> {
    try {
      const filter = this.getCompanyFilter();

      const totalDrivers = await this.prisma.driver.count({
        where: { ...filter, deletedAt: null, isActive: true },
      });

      const now = new Date();
      const thirtyDaysOut = new Date();
      thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);

      const [expiredMedical, expiringMedical, expiredCDL, expiringCDL] = await Promise.all([
        this.prisma.medicalCard.count({
          where: { driver: { ...filter, deletedAt: null }, expirationDate: { lt: now } },
        }),
        this.prisma.medicalCard.count({
          where: {
            driver: { ...filter, deletedAt: null },
            expirationDate: { gte: now, lte: thirtyDaysOut },
          },
        }),
        this.prisma.cDLRecord.count({
          where: {
            driver: { ...filter, deletedAt: null },
            expirationDate: { lt: now },
            deletedAt: null,
          },
        }),
        this.prisma.cDLRecord.count({
          where: {
            driver: { ...filter, deletedAt: null },
            expirationDate: { gte: now, lte: thirtyDaysOut },
            deletedAt: null,
          },
        }),
      ]);

      const expiredDocuments = expiredMedical + expiredCDL;
      const expiringDocuments = expiringMedical + expiringCDL;
      const driversWithIssues = expiredDocuments;
      const compliantDrivers = Math.max(0, totalDrivers - driversWithIssues);
      const compliancePercentage =
        totalDrivers > 0 ? Math.round((compliantDrivers / totalDrivers) * 100) : 0;

      return {
        totalDrivers,
        compliantDrivers,
        compliancePercentage,
        expiredDocuments,
        expiringDocuments,
      };
    } catch (error) {
      this.handleError(error, 'Failed to get compliance status report');
    }
  }
}

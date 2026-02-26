import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalyticsService } from '@/lib/services/safety/AnalyticsService';

function createMockPrisma() {
  return {
    safetyIncident: { findMany: vi.fn(), aggregate: vi.fn() },
    insuranceClaim: { findMany: vi.fn(), aggregate: vi.fn() },
    citation: { findMany: vi.fn() },
    driver: { count: vi.fn() },
    medicalCard: { count: vi.fn() },
    cDLRecord: { count: vi.fn() },
  } as any;
}

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: ReturnType<typeof createMockPrisma>;
  const start = new Date('2025-01-01');
  const end = new Date('2025-12-31');

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new AnalyticsService(prisma, 'company-1', 'mc-1');
  });

  describe('getIncidentCosts', () => {
    it('returns correct total and grouped items', async () => {
      prisma.safetyIncident.findMany.mockResolvedValue([
        { incidentType: 'COLLISION', estimatedCost: 5000 },
        { incidentType: 'COLLISION', estimatedCost: 3000 },
        { incidentType: 'CARGO_DAMAGE', estimatedCost: 1200 },
      ]);

      const result = await service.getIncidentCosts(start, end);

      expect(result.total).toBe(9200);
      expect(result.items).toHaveLength(2);

      const collision = result.items.find((i) => i.label === 'COLLISION');
      expect(collision).toEqual({ label: 'COLLISION', amount: 8000, count: 2 });

      const cargo = result.items.find((i) => i.label === 'CARGO_DAMAGE');
      expect(cargo).toEqual({ label: 'CARGO_DAMAGE', amount: 1200, count: 1 });
    });

    it('treats null estimatedCost as zero', async () => {
      prisma.safetyIncident.findMany.mockResolvedValue([
        { incidentType: 'ROLLOVER', estimatedCost: null },
        { incidentType: 'ROLLOVER', estimatedCost: 700 },
      ]);

      const result = await service.getIncidentCosts(start, end);

      expect(result.total).toBe(700);
      expect(result.items).toEqual([{ label: 'ROLLOVER', amount: 700, count: 2 }]);
    });

    it('returns zero total for empty results', async () => {
      prisma.safetyIncident.findMany.mockResolvedValue([]);

      const result = await service.getIncidentCosts(start, end);

      expect(result.total).toBe(0);
      expect(result.items).toEqual([]);
    });
  });

  describe('getClaimCosts', () => {
    it('sums paidAmount and settlementAmount per claim', async () => {
      prisma.insuranceClaim.findMany.mockResolvedValue([
        { claimType: 'LIABILITY', paidAmount: 2000, settlementAmount: 500 },
        { claimType: 'LIABILITY', paidAmount: 1000, settlementAmount: null },
        { claimType: 'CARGO', paidAmount: null, settlementAmount: 3000 },
      ]);

      const result = await service.getClaimCosts(start, end);

      expect(result.total).toBe(6500);
      expect(result.items).toHaveLength(2);

      const liability = result.items.find((i) => i.label === 'LIABILITY');
      expect(liability).toEqual({ label: 'LIABILITY', amount: 3500, count: 2 });

      const cargo = result.items.find((i) => i.label === 'CARGO');
      expect(cargo).toEqual({ label: 'CARGO', amount: 3000, count: 1 });
    });

    it('returns zero total for empty results', async () => {
      prisma.insuranceClaim.findMany.mockResolvedValue([]);

      const result = await service.getClaimCosts(start, end);

      expect(result.total).toBe(0);
      expect(result.items).toEqual([]);
    });

    it('handles all null amounts gracefully', async () => {
      prisma.insuranceClaim.findMany.mockResolvedValue([
        { claimType: 'PHYSICAL_DAMAGE', paidAmount: null, settlementAmount: null },
      ]);

      const result = await service.getClaimCosts(start, end);

      expect(result.total).toBe(0);
      expect(result.items).toEqual([
        { label: 'PHYSICAL_DAMAGE', amount: 0, count: 1 },
      ]);
    });
  });

  describe('getCostPerDriver', () => {
    it('aggregates costs across incidents, claims, and citations', async () => {
      prisma.safetyIncident.findMany.mockResolvedValue([
        {
          driverId: 'd1',
          estimatedCost: 4000,
          driver: { user: { firstName: 'John', lastName: 'Doe' } },
        },
      ]);
      prisma.insuranceClaim.findMany.mockResolvedValue([
        { driverId: 'd1', paidAmount: 1000, settlementAmount: 500 },
      ]);
      prisma.citation.findMany.mockResolvedValue([
        { driverId: 'd1', fineAmount: 250 },
      ]);

      const result = await service.getCostPerDriver(start, end);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        driverId: 'd1',
        driverName: 'John Doe',
        incidentCost: 4000,
        claimCost: 1500,
        citationCost: 250,
        totalCost: 5750,
      });
    });

    it('returns empty array when no data', async () => {
      prisma.safetyIncident.findMany.mockResolvedValue([]);
      prisma.insuranceClaim.findMany.mockResolvedValue([]);
      prisma.citation.findMany.mockResolvedValue([]);

      const result = await service.getCostPerDriver(start, end);

      expect(result).toEqual([]);
    });
  });

  describe('getComplianceStatusReport', () => {
    it('calculates compliance percentage correctly', async () => {
      prisma.driver.count.mockResolvedValue(10);
      // expired: 2 medical + 1 CDL = 3 total
      prisma.medicalCard.count
        .mockResolvedValueOnce(2)  // expiredMedical
        .mockResolvedValueOnce(1); // expiringMedical
      prisma.cDLRecord.count
        .mockResolvedValueOnce(1)  // expiredCDL
        .mockResolvedValueOnce(2); // expiringCDL

      const result = await service.getComplianceStatusReport();

      expect(result.totalDrivers).toBe(10);
      expect(result.expiredDocuments).toBe(3);   // 2 + 1
      expect(result.expiringDocuments).toBe(3);   // 1 + 2
      expect(result.compliantDrivers).toBe(7);    // 10 - 3
      expect(result.compliancePercentage).toBe(70); // round(7/10 * 100)
    });

    it('returns zero percentage when no drivers exist', async () => {
      prisma.driver.count.mockResolvedValue(0);
      prisma.medicalCard.count.mockResolvedValue(0);
      prisma.cDLRecord.count.mockResolvedValue(0);

      const result = await service.getComplianceStatusReport();

      expect(result.totalDrivers).toBe(0);
      expect(result.compliantDrivers).toBe(0);
      expect(result.compliancePercentage).toBe(0);
      expect(result.expiredDocuments).toBe(0);
      expect(result.expiringDocuments).toBe(0);
    });

    it('clamps compliant drivers to zero when expired exceeds total', async () => {
      prisma.driver.count.mockResolvedValue(2);
      prisma.medicalCard.count
        .mockResolvedValueOnce(3)  // expiredMedical (more than total drivers)
        .mockResolvedValueOnce(0);
      prisma.cDLRecord.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      const result = await service.getComplianceStatusReport();

      expect(result.compliantDrivers).toBe(0); // Math.max(0, 2 - 3)
      expect(result.compliancePercentage).toBe(0);
    });
  });
});

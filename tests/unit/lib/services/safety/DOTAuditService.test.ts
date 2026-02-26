import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DOTAuditService } from '@/lib/services/safety/DOTAuditService';

function createMockPrisma() {
  return {
    driver: { findUnique: vi.fn(), findMany: vi.fn() },
  } as any;
}

const futureDate = new Date('2027-06-01');
const pastDate = new Date('2023-01-01');
const recentDate = new Date();
recentDate.setMonth(recentDate.getMonth() - 3);

function buildCompliantDriver(overrides: Record<string, any> = {}) {
  return {
    id: 'driver-1',
    user: { firstName: 'John', lastName: 'Doe' },
    dqf: {
      documents: [
        { documentType: 'APPLICATION', status: 'COMPLETE' },
        { documentType: 'ROAD_TEST', status: 'COMPLETE' },
        { documentType: 'EMPLOYMENT_VERIFICATION', status: 'COMPLETE' },
        { documentType: 'ANNUAL_REVIEW', status: 'COMPLETE' },
      ],
    },
    medicalCards: [{ expirationDate: futureDate }],
    cdlRecord: { expirationDate: futureDate },
    mvrRecords: [{ pullDate: recentDate }],
    drugAlcoholTests: [{ result: 'NEGATIVE', testDate: recentDate }],
    safetyTrainings: [{ completed: true, expiryDate: futureDate, completionDate: recentDate }],
    ...overrides,
  };
}

describe('DOTAuditService', () => {
  let prisma: ReturnType<typeof createMockPrisma>;
  let service: DOTAuditService;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new DOTAuditService(prisma, 'company-1', 'mc-1');
  });

  describe('generateAuditPackage', () => {
    it('returns 100% readiness for a fully compliant driver', async () => {
      prisma.driver.findUnique.mockResolvedValue(buildCompliantDriver());

      const result = await service.generateAuditPackage('driver-1');

      expect(result.driverId).toBe('driver-1');
      expect(result.driverName).toBe('John Doe');
      expect(result.readinessPercentage).toBe(100);
      expect(result.totalRequired).toBe(9);
      expect(result.totalComplete).toBe(9);
      expect(result.totalMissing).toBe(0);
      expect(result.totalExpired).toBe(0);
      expect(result.documents).toHaveLength(9);
      result.documents.forEach((doc) => {
        expect(doc.status).toBe('COMPLETE');
      });
    });

    it('reports missing docs when DQF documents and relations are absent', async () => {
      const incompleteDriver = buildCompliantDriver({
        dqf: { documents: [] },
        medicalCards: [],
        cdlRecord: null,
        drugAlcoholTests: [],
        safetyTrainings: [],
      });
      prisma.driver.findUnique.mockResolvedValue(incompleteDriver);

      const result = await service.generateAuditPackage('driver-1');

      expect(result.readinessPercentage).toBeLessThan(100);
      expect(result.totalMissing).toBeGreaterThan(0);

      const missingTypes = result.documents
        .filter((d) => d.status === 'MISSING')
        .map((d) => d.documentType);
      expect(missingTypes).toContain('APPLICATION');
      expect(missingTypes).toContain('CDL');
      expect(missingTypes).toContain('MEDICAL_CERTIFICATE');
      expect(missingTypes).toContain('DRUG_ALCOHOL_TEST');
      expect(missingTypes).toContain('TRAINING_CERTIFICATE');
    });

    it('throws when driver is not found', async () => {
      prisma.driver.findUnique.mockResolvedValue(null);

      await expect(service.generateAuditPackage('nonexistent')).rejects.toThrow(
        'Driver not found'
      );
    });
  });

  describe('document evaluation', () => {
    it('marks medical card as EXPIRED when expiration is in the past', async () => {
      const driver = buildCompliantDriver({
        medicalCards: [{ expirationDate: pastDate }],
      });
      prisma.driver.findUnique.mockResolvedValue(driver);

      const result = await service.generateAuditPackage('driver-1');
      const medCert = result.documents.find((d) => d.documentType === 'MEDICAL_CERTIFICATE');

      expect(medCert?.status).toBe('EXPIRED');
      expect(medCert?.expirationDate).toEqual(pastDate);
    });

    it('marks CDL as MISSING when cdlRecord is null', async () => {
      const driver = buildCompliantDriver({ cdlRecord: null });
      prisma.driver.findUnique.mockResolvedValue(driver);

      const result = await service.generateAuditPackage('driver-1');
      const cdl = result.documents.find((d) => d.documentType === 'CDL');

      expect(cdl?.status).toBe('MISSING');
    });

    it('marks CDL as EXPIRED when expiration is in the past', async () => {
      const driver = buildCompliantDriver({
        cdlRecord: { expirationDate: pastDate },
      });
      prisma.driver.findUnique.mockResolvedValue(driver);

      const result = await service.generateAuditPackage('driver-1');
      const cdl = result.documents.find((d) => d.documentType === 'CDL');

      expect(cdl?.status).toBe('EXPIRED');
    });

    it('marks MVR as EXPIRED when pull date is older than one year', async () => {
      const oldPullDate = new Date();
      oldPullDate.setFullYear(oldPullDate.getFullYear() - 2);
      const driver = buildCompliantDriver({
        mvrRecords: [{ pullDate: oldPullDate }],
      });
      prisma.driver.findUnique.mockResolvedValue(driver);

      const result = await service.generateAuditPackage('driver-1');
      const mvr = result.documents.find((d) => d.documentType === 'MVR');

      expect(mvr?.status).toBe('EXPIRED');
    });

    it('marks training as EXPIRED when expiryDate is in the past', async () => {
      const driver = buildCompliantDriver({
        safetyTrainings: [{ completed: true, expiryDate: pastDate, completionDate: recentDate }],
      });
      prisma.driver.findUnique.mockResolvedValue(driver);

      const result = await service.generateAuditPackage('driver-1');
      const training = result.documents.find((d) => d.documentType === 'TRAINING_CERTIFICATE');

      expect(training?.status).toBe('EXPIRED');
    });
  });

  describe('getGapAnalysis', () => {
    it('returns gap items with remediation text for non-complete docs', async () => {
      const driver = buildCompliantDriver({
        dqf: { documents: [] },
        cdlRecord: null,
        medicalCards: [{ expirationDate: pastDate }],
      });
      prisma.driver.findUnique.mockResolvedValue(driver);

      const gaps = await service.getGapAnalysis('driver-1');

      expect(gaps.length).toBeGreaterThan(0);
      gaps.forEach((gap) => {
        expect(['MISSING', 'EXPIRED', 'EXPIRING']).toContain(gap.issue);
        expect(gap.remediation).toBeTruthy();
        expect(gap.label).toBeTruthy();
      });

      const cdlGap = gaps.find((g) => g.documentType === 'CDL');
      expect(cdlGap?.issue).toBe('MISSING');
      expect(cdlGap?.remediation).toContain('CDL');

      const medGap = gaps.find((g) => g.documentType === 'MEDICAL_CERTIFICATE');
      expect(medGap?.issue).toBe('EXPIRED');
      expect(medGap?.remediation).toContain('DOT physical');
    });

    it('returns empty array for a fully compliant driver', async () => {
      prisma.driver.findUnique.mockResolvedValue(buildCompliantDriver());

      const gaps = await service.getGapAnalysis('driver-1');

      expect(gaps).toEqual([]);
    });
  });

  describe('getAuditReadiness', () => {
    it('calculates readiness across multiple drivers', async () => {
      prisma.driver.findMany.mockResolvedValue([
        { id: 'driver-1' },
        { id: 'driver-2' },
      ]);

      const compliant = buildCompliantDriver();
      const nonCompliant = buildCompliantDriver({ id: 'driver-2', cdlRecord: null });

      prisma.driver.findUnique
        .mockResolvedValueOnce(compliant)
        .mockResolvedValueOnce(nonCompliant);

      const report = await service.getAuditReadiness('company-1');

      expect(report.companyId).toBe('company-1');
      expect(report.totalDrivers).toBe(2);
      expect(report.auditReadyDrivers).toBe(1);
      expect(report.readinessPercentage).toBe(50);
      expect(report.commonGaps.length).toBeGreaterThan(0);
      expect(report.commonGaps[0].documentType).toBe('CDL');
    });

    it('returns 0% readiness when no drivers exist', async () => {
      prisma.driver.findMany.mockResolvedValue([]);

      const report = await service.getAuditReadiness('company-1');

      expect(report.totalDrivers).toBe(0);
      expect(report.auditReadyDrivers).toBe(0);
      expect(report.readinessPercentage).toBe(0);
      expect(report.commonGaps).toEqual([]);
    });
  });
});

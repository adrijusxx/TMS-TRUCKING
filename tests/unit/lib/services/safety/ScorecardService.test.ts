import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScorecardService } from '@/lib/services/safety/ScorecardService';

function createMockPrisma() {
  return {
    safetyIncident: { findMany: vi.fn().mockResolvedValue([]) },
    hOSViolation: { count: vi.fn().mockResolvedValue(0) },
    mVRViolation: { count: vi.fn().mockResolvedValue(0) },
    drugAlcoholTest: { findMany: vi.fn().mockResolvedValue([]) },
    roadsideInspection: { findMany: vi.fn().mockResolvedValue([]) },
    safetyTraining: { findMany: vi.fn().mockResolvedValue([]) },
    citation: { count: vi.fn().mockResolvedValue(0) },
  } as any;
}

describe('ScorecardService', () => {
  let service: ScorecardService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = createMockPrisma();
    service = new ScorecardService(mockPrisma, 'company-1');
  });

  describe('classifyRiskLevel', () => {
    it('should return LOW for score >= 80', () => {
      expect(service.classifyRiskLevel(80)).toBe('LOW');
      expect(service.classifyRiskLevel(100)).toBe('LOW');
      expect(service.classifyRiskLevel(95.5)).toBe('LOW');
    });

    it('should return MEDIUM for score >= 60 and < 80', () => {
      expect(service.classifyRiskLevel(60)).toBe('MEDIUM');
      expect(service.classifyRiskLevel(79.9)).toBe('MEDIUM');
    });

    it('should return HIGH for score >= 40 and < 60', () => {
      expect(service.classifyRiskLevel(40)).toBe('HIGH');
      expect(service.classifyRiskLevel(59.9)).toBe('HIGH');
    });

    it('should return CRITICAL for score < 40', () => {
      expect(service.classifyRiskLevel(39.9)).toBe('CRITICAL');
      expect(service.classifyRiskLevel(0)).toBe('CRITICAL');
      expect(service.classifyRiskLevel(-5)).toBe('CRITICAL');
    });
  });

  describe('calculateDriverScore', () => {
    it('should return a perfect score (100) when no issues exist', async () => {
      mockPrisma.drugAlcoholTest.findMany.mockResolvedValue([{ result: 'NEGATIVE' }]);
      mockPrisma.safetyTraining.findMany.mockResolvedValue([
        { completed: true, expiryDate: new Date('2099-12-31') },
      ]);
      const result = await service.calculateDriverScore('driver-1');

      expect(result.driverId).toBe('driver-1');
      expect(result.overallScore).toBe(100);
      expect(result.riskLevel).toBe('LOW');
      expect(result.lastUpdated).toBeInstanceOf(Date);
    });

    it('should classify risk level based on calculated score', async () => {
      // No trainings = 0, no drug tests = half weight (5) => 25+20+15+5+10+0+10 = 85
      const result = await service.calculateDriverScore('driver-1');
      expect(result.overallScore).toBe(85);
      expect(result.riskLevel).toBe('LOW');
    });

    it('should return CRITICAL risk with many violations', async () => {
      mockPrisma.safetyIncident.findMany.mockResolvedValue([
        { severity: 'CRITICAL' }, { severity: 'MAJOR' },
      ]);
      mockPrisma.hOSViolation.count.mockResolvedValue(10);
      mockPrisma.mVRViolation.count.mockResolvedValue(5);
      mockPrisma.drugAlcoholTest.findMany.mockResolvedValue([{ result: 'POSITIVE' }]);
      mockPrisma.roadsideInspection.findMany.mockResolvedValue([
        { outOfService: true, violationsFound: true },
      ]);
      mockPrisma.citation.count.mockResolvedValue(5);

      const result = await service.calculateDriverScore('driver-1');
      expect(result.overallScore).toBeLessThan(40);
      expect(result.riskLevel).toBe('CRITICAL');
    });
  });

  describe('getScoreBreakdown', () => {
    it('should return max weight for each category with zero issues', async () => {
      mockPrisma.drugAlcoholTest.findMany.mockResolvedValue([{ result: 'NEGATIVE' }]);
      mockPrisma.safetyTraining.findMany.mockResolvedValue([
        { completed: true, expiryDate: new Date('2099-12-31') },
      ]);
      const breakdown = await service.getScoreBreakdown('driver-1');

      expect(breakdown.incidents).toBe(25);
      expect(breakdown.hosViolations).toBe(20);
      expect(breakdown.mvrViolations).toBe(15);
      expect(breakdown.drugTests).toBe(10);
      expect(breakdown.inspections).toBe(10);
      expect(breakdown.training).toBe(10);
      expect(breakdown.citations).toBe(10);
    });

    it('should deduct incident score based on severity', async () => {
      mockPrisma.safetyIncident.findMany.mockResolvedValue([
        { severity: 'MINOR' },  // -3
        { severity: 'MAJOR' },  // -10
      ]);
      const breakdown = await service.getScoreBreakdown('driver-1');
      expect(breakdown.incidents).toBe(12); // 25 - 3 - 10
    });

    it('should deduct HOS score by 3 per violation', async () => {
      mockPrisma.hOSViolation.count.mockResolvedValue(4);
      const breakdown = await service.getScoreBreakdown('driver-1');
      expect(breakdown.hosViolations).toBe(8); // 20 - 12
    });

    it('should deduct MVR score by 4 per violation', async () => {
      mockPrisma.mVRViolation.count.mockResolvedValue(3);
      const breakdown = await service.getScoreBreakdown('driver-1');
      expect(breakdown.mvrViolations).toBe(3); // 15 - 12
    });

    it('should return 0 for drug tests when a positive result exists', async () => {
      mockPrisma.drugAlcoholTest.findMany.mockResolvedValue([
        { result: 'NEGATIVE' }, { result: 'POSITIVE' },
      ]);
      const breakdown = await service.getScoreBreakdown('driver-1');
      expect(breakdown.drugTests).toBe(0);
    });

    it('should return full drug test score when all results are negative', async () => {
      mockPrisma.drugAlcoholTest.findMany.mockResolvedValue([
        { result: 'NEGATIVE' }, { result: 'NEGATIVE' },
      ]);
      const breakdown = await service.getScoreBreakdown('driver-1');
      expect(breakdown.drugTests).toBe(10);
    });

    it('should return half drug test score when no tests exist', async () => {
      const breakdown = await service.getScoreBreakdown('driver-1');
      expect(breakdown.drugTests).toBe(5); // 10 / 2
    });

    it('should deduct inspection score for out-of-service and violations', async () => {
      mockPrisma.roadsideInspection.findMany.mockResolvedValue([
        { outOfService: true, violationsFound: true },   // -5 + -2
        { outOfService: false, violationsFound: true },   // -2
      ]);
      const breakdown = await service.getScoreBreakdown('driver-1');
      expect(breakdown.inspections).toBe(1); // 10 - 5 - 2 - 2
    });

    it('should return 0 training score when no trainings exist', async () => {
      const breakdown = await service.getScoreBreakdown('driver-1');
      expect(breakdown.training).toBe(0);
    });

    it('should calculate training score from completion ratio', async () => {
      mockPrisma.safetyTraining.findMany.mockResolvedValue([
        { completed: true, expiryDate: new Date('2099-12-31') },
        { completed: false, expiryDate: null },
      ]);
      const breakdown = await service.getScoreBreakdown('driver-1');
      expect(breakdown.training).toBe(5); // 10 * (1/2) = 5
    });

    it('should deduct citation score by 3 per citation', async () => {
      mockPrisma.citation.count.mockResolvedValue(2);
      const breakdown = await service.getScoreBreakdown('driver-1');
      expect(breakdown.citations).toBe(4); // 10 - 6
    });

    it('should floor scores at 0 (never negative)', async () => {
      mockPrisma.hOSViolation.count.mockResolvedValue(100);
      mockPrisma.citation.count.mockResolvedValue(100);
      const breakdown = await service.getScoreBreakdown('driver-1');

      expect(breakdown.hosViolations).toBe(0);
      expect(breakdown.citations).toBe(0);
    });
  });
});

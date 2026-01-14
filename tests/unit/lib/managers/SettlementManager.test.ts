import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SettlementManager } from '@/lib/managers/SettlementManager';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    driver: {
      findUnique: vi.fn(),
    },
    load: {
      findMany: vi.fn(),
    },
    settlement: {
      create: vi.fn(),
    },
  },
}));

describe('SettlementManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateSettlement', () => {
    it('should calculate settlement correctly for per-mile driver', async () => {
      const manager = new SettlementManager();
      
      // Mock driver with per-mile pay
      (prisma.driver.findUnique as any).mockResolvedValue({
        id: 'driver-1',
        payType: 'PER_MILE',
        centsPerMile: 50, // $0.50 per mile
      });

      // Mock loads
      (prisma.load.findMany as any).mockResolvedValue([
        {
          id: 'load-1',
          revenue: 2000,
          totalMiles: 1000,
          driverPay: 500, // 1000 miles * $0.50
        },
      ]);

      const result = await manager.generateSettlement({
        driverId: 'driver-1',
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-31'),
      });

      expect(result).toBeDefined();
      expect(result.grossPay).toBe(500);
    });

    it('should handle missing driver', async () => {
      const manager = new SettlementManager();
      
      (prisma.driver.findUnique as any).mockResolvedValue(null);

      await expect(
        manager.generateSettlement({
          driverId: 'invalid-driver',
          periodStart: new Date('2024-01-01'),
          periodEnd: new Date('2024-01-31'),
        })
      ).rejects.toThrow();
    });
  });
});

























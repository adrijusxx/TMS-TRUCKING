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
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    settlementDeduction: {
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    deductionRule: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    invoice: {
      findMany: vi.fn(),
    },
    driverNegativeBalance: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    activityLog: {
      create: vi.fn(),
    },
    settlementApproval: {
      create: vi.fn(),
    },
    driverAdvance: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    accessorialCharge: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    loadExpense: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));



describe('SettlementManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.deductionRule.findMany as any).mockResolvedValue([]);
    (prisma.invoice.findMany as any).mockResolvedValue([]);
    (prisma.driverNegativeBalance.findFirst as any).mockResolvedValue(null);
    (prisma.settlement.create as any).mockImplementation((args: any) => ({ ...args.data, id: 'settlement-1' }));
    (prisma.settlement.findUnique as any).mockResolvedValue({ id: 'settlement-1' });
    (prisma.activityLog.create as any).mockResolvedValue({});
    (prisma.driverAdvance.findMany as any).mockResolvedValue([]);
    (prisma.accessorialCharge.findMany as any).mockResolvedValue([]);
    (prisma.loadExpense.findMany as any).mockResolvedValue([]);
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

      (prisma.settlement.findUnique as any).mockResolvedValue({
        id: 'settlement-1',
        grossPay: 500,
        netPay: 500,
        status: 'PENDING',
        approvalStatus: 'PENDING',
        driver: {
          user: {
            firstName: 'Test',
            lastName: 'Driver',
            email: 'test@example.com'
          }
        },
        deductionItems: [],
        driverAdvances: [],
      });

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

























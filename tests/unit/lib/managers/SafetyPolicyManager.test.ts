import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SafetyPolicyManager } from '@/lib/managers/SafetyPolicyManager';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    safetyPolicy: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    policyAcknowledgment: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

const mockPolicy = {
  id: 'policy-1',
  companyId: 'company-1',
  policyName: 'Safety Manual',
  category: 'GENERAL',
  content: 'Content here',
  effectiveDate: new Date('2026-03-01'),
  version: 1,
  deletedAt: null,
  distributedAt: null,
  supersededDate: null,
};

describe('SafetyPolicyManager', () => {
  let manager: SafetyPolicyManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new SafetyPolicyManager();
  });

  describe('createPolicy', () => {
    it('should create a policy with version 1', async () => {
      const created = { ...mockPolicy, acknowledgments: [] };
      (prisma.safetyPolicy.create as any).mockResolvedValue(created);

      const result = await manager.createPolicy('company-1', {
        policyName: 'Safety Manual',
        category: 'GENERAL',
        content: 'Content here',
        effectiveDate: new Date('2026-03-01'),
      });

      expect(prisma.safetyPolicy.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ companyId: 'company-1', version: 1 }),
        })
      );
      expect(result.version).toBe(1);
    });
  });

  describe('updatePolicy', () => {
    it('should update a policy successfully', async () => {
      (prisma.safetyPolicy.findFirst as any).mockResolvedValue(mockPolicy);
      const updated = { ...mockPolicy, policyName: 'Updated Name', acknowledgments: [] };
      (prisma.safetyPolicy.update as any).mockResolvedValue(updated);

      const result = await manager.updatePolicy('policy-1', 'company-1', {
        policyName: 'Updated Name',
      });

      expect(prisma.safetyPolicy.findFirst).toHaveBeenCalledWith({
        where: { id: 'policy-1', companyId: 'company-1', deletedAt: null },
      });
      expect(result.policyName).toBe('Updated Name');
    });

    it('should increment version when content changes', async () => {
      (prisma.safetyPolicy.findFirst as any).mockResolvedValue(mockPolicy);
      (prisma.safetyPolicy.update as any).mockResolvedValue({ ...mockPolicy, version: 2 });

      await manager.updatePolicy('policy-1', 'company-1', { content: 'New content' });

      expect(prisma.safetyPolicy.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ content: 'New content', version: { increment: 1 } }),
        })
      );
    });

    it('should throw when policy not found', async () => {
      (prisma.safetyPolicy.findFirst as any).mockResolvedValue(null);

      await expect(
        manager.updatePolicy('missing', 'company-1', { policyName: 'X' })
      ).rejects.toThrow('Safety policy not found');
    });
  });

  describe('deletePolicy', () => {
    it('should soft delete with supersededDate', async () => {
      (prisma.safetyPolicy.findFirst as any).mockResolvedValue(mockPolicy);
      (prisma.safetyPolicy.update as any).mockResolvedValue({ ...mockPolicy, deletedAt: new Date() });

      await manager.deletePolicy('policy-1', 'company-1');

      expect(prisma.safetyPolicy.update).toHaveBeenCalledWith({
        where: { id: 'policy-1' },
        data: expect.objectContaining({
          deletedAt: expect.any(Date),
          supersededDate: expect.any(Date),
        }),
      });
    });

    it('should throw when policy not found', async () => {
      (prisma.safetyPolicy.findFirst as any).mockResolvedValue(null);

      await expect(manager.deletePolicy('missing', 'company-1')).rejects.toThrow(
        'Safety policy not found'
      );
    });
  });

  describe('distributePolicy', () => {
    it('should create pending acknowledgments for all drivers', async () => {
      (prisma.safetyPolicy.findFirst as any).mockResolvedValue(mockPolicy);
      (prisma.policyAcknowledgment.upsert as any).mockImplementation(({ create }: any) => ({
        ...create,
        id: `ack-${create.driverId}`,
        driver: { id: create.driverId, user: { firstName: 'Test', lastName: 'Driver' } },
      }));
      (prisma.safetyPolicy.update as any).mockResolvedValue({});

      const driverIds = ['driver-1', 'driver-2', 'driver-3'];
      const result = await manager.distributePolicy('policy-1', 'company-1', driverIds);

      expect(result).toHaveLength(3);
      expect(prisma.policyAcknowledgment.upsert).toHaveBeenCalledTimes(3);
      expect(prisma.policyAcknowledgment.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ policyId: 'policy-1', driverId: 'driver-1', status: 'PENDING' }),
        })
      );
      expect(prisma.safetyPolicy.update).toHaveBeenCalledWith({
        where: { id: 'policy-1' },
        data: { distributedAt: expect.any(Date) },
      });
    });
  });

  describe('acknowledgePolicy', () => {
    it('should set ACKNOWLEDGED status with signature', async () => {
      (prisma.policyAcknowledgment.findUnique as any).mockResolvedValue({ id: 'ack-1', status: 'PENDING' });
      (prisma.policyAcknowledgment.update as any).mockResolvedValue({ id: 'ack-1', status: 'ACKNOWLEDGED' });

      await manager.acknowledgePolicy('policy-1', 'driver-1', 'John Doe');

      expect(prisma.policyAcknowledgment.update).toHaveBeenCalledWith({
        where: { policyId_driverId: { policyId: 'policy-1', driverId: 'driver-1' } },
        data: expect.objectContaining({
          status: 'ACKNOWLEDGED',
          acknowledgedAt: expect.any(Date),
          signature: 'John Doe',
        }),
      });
    });

    it('should throw when acknowledgment record not found', async () => {
      (prisma.policyAcknowledgment.findUnique as any).mockResolvedValue(null);

      await expect(
        manager.acknowledgePolicy('policy-1', 'driver-x')
      ).rejects.toThrow('Policy acknowledgment record not found');
    });
  });

  describe('getAcknowledgmentStatus', () => {
    it('should calculate correct percentages', async () => {
      (prisma.policyAcknowledgment.findMany as any).mockResolvedValue([
        { status: 'ACKNOWLEDGED', driver: { id: 'd1', user: { firstName: 'A', lastName: 'B' } } },
        { status: 'ACKNOWLEDGED', driver: { id: 'd2', user: { firstName: 'C', lastName: 'D' } } },
        { status: 'PENDING', driver: { id: 'd3', user: { firstName: 'E', lastName: 'F' } } },
        { status: 'OVERDUE', driver: { id: 'd4', user: { firstName: 'G', lastName: 'H' } } },
      ]);

      const result = await manager.getAcknowledgmentStatus('policy-1');

      expect(result.total).toBe(4);
      expect(result.acknowledged).toBe(2);
      expect(result.pending).toBe(1);
      expect(result.overdue).toBe(1);
      expect(result.completionPercentage).toBe(50);
    });

    it('should return 0% when no acknowledgments exist', async () => {
      (prisma.policyAcknowledgment.findMany as any).mockResolvedValue([]);

      const result = await manager.getAcknowledgmentStatus('policy-1');

      expect(result.total).toBe(0);
      expect(result.completionPercentage).toBe(0);
    });
  });
});

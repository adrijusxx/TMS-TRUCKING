import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
import { NotFoundError } from '@/lib/errors';

/** Fields that are locked after READY_TO_BILL */
const LOCKED_FIELDS = ['revenue', 'driverPay', 'fuelAdvance'] as const;

/**
 * FinancialLockManager
 *
 * Prevents modification of revenue, driverPay, and fuelAdvance on a Load
 * after it transitions to READY_TO_BILL or INVOICED.
 * Admin override available with audit trail.
 */
export class FinancialLockManager {
  /**
   * Lock the financial fields on a load.
   * Called automatically when status transitions to READY_TO_BILL or INVOICED.
   */
  static async lockFinancials(
    loadId: string,
    userId: string,
    reason: string
  ): Promise<void> {
    await prisma.load.update({
      where: { id: loadId },
      data: {
        financialLockedAt: new Date(),
        financialLockedById: userId,
        financialLockReason: reason,
      },
    });

    logger.info('Financial lock applied', { loadId, userId, reason });
  }

  /**
   * Unlock financial fields (admin override).
   * Creates an activity log entry for audit trail.
   */
  static async unlockFinancials(
    loadId: string,
    adminUserId: string,
    overrideReason: string
  ): Promise<void> {
    const load = await prisma.load.findUnique({
      where: { id: loadId },
      select: { companyId: true, financialLockedAt: true },
    });

    if (!load) throw new NotFoundError('Load', loadId);
    if (!load.financialLockedAt) return; // Already unlocked

    await prisma.$transaction([
      prisma.load.update({
        where: { id: loadId },
        data: {
          financialLockedAt: null,
          financialLockedById: null,
          financialLockReason: null,
        },
      }),
      prisma.activityLog.create({
        data: {
          companyId: load.companyId,
          userId: adminUserId,
          entityType: 'LOAD',
          entityId: loadId,
          action: 'FINANCIAL_UNLOCK',
          description: `Financial lock overridden: ${overrideReason}`,
          metadata: { overrideReason },
        },
      }),
    ]);

    logger.info('Financial lock overridden', { loadId, adminUserId, overrideReason });
  }

  /**
   * Check if a load's financials are locked.
   */
  static isLocked(load: { financialLockedAt?: Date | null }): boolean {
    return !!load.financialLockedAt;
  }

  /**
   * Validate that an update does not modify locked fields.
   * Returns an error message if locked fields are being changed, null otherwise.
   */
  static getLockedFieldViolation(
    load: { financialLockedAt?: Date | null },
    updateFields: Record<string, unknown>
  ): string | null {
    if (!load.financialLockedAt) return null;

    const violations = LOCKED_FIELDS.filter(
      (field) => updateFields[field] !== undefined
    );

    if (violations.length === 0) return null;

    return `Financial values are locked. Cannot modify: ${violations.join(', ')}. Admin override required.`;
  }
}

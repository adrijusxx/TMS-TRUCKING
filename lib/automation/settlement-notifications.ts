import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
import { routeSettlementReady } from '@/lib/notifications/mattermost-router';

/**
 * Send notification to driver about a new settlement.
 */
export async function sendDriverNotification(driverId: string, settlementId: string): Promise<void> {
  try {
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
      include: {
        driver: { include: { user: true } },
      },
    });

    if (!settlement || !settlement.driver.userId) return;

    await prisma.notification.create({
      data: {
        userId: settlement.driver.userId,
        type: 'SYSTEM_ALERT',
        title: 'New Settlement Available',
        message: `Your settlement ${settlement.settlementNumber} for $${settlement.netPay.toFixed(2)} is ready for review.`,
      },
    });

    // Post to Mattermost #accounting channel (batched)
    const driverName = `${settlement.driver.user?.firstName ?? ''} ${settlement.driver.user?.lastName ?? ''}`;
    await routeSettlementReady({
      settlementNumber: settlement.settlementNumber,
      driverName,
      netPay: Number(settlement.netPay),
    });

    logger.info(`Settlement notification sent to driver ${settlement.driver.driverNumber}`);
  } catch (error) {
    logger.error('Error sending driver settlement notification', { driverId, settlementId, error });
  }
}

/**
 * Send notification to accounting team about a new settlement pending approval.
 */
export async function sendAccountingNotification(companyId: string, settlementId: string): Promise<void> {
  try {
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
      include: {
        driver: { include: { user: true } },
      },
    });

    if (!settlement || !settlement.driver.user) return;

    const accountingUsers = await prisma.user.findMany({
      where: {
        companyId,
        role: { in: ['ADMIN', 'ACCOUNTANT'] },
        deletedAt: null,
      },
      select: { id: true },
    });

    await Promise.all(
      accountingUsers.map((user) =>
        prisma.notification.create({
          data: {
            userId: user.id,
            type: 'SYSTEM_ALERT',
            title: 'Settlement Pending Approval',
            message: `Settlement ${settlement.settlementNumber} for ${settlement.driver.user!.firstName} ${settlement.driver.user!.lastName} ($${settlement.netPay.toFixed(2)}) is pending approval.`,
          },
        })
      )
    );

    logger.info(`Settlement notifications sent to ${accountingUsers.length} accounting users`);
  } catch (error) {
    logger.error('Error sending accounting settlement notification', { companyId, settlementId, error });
  }
}

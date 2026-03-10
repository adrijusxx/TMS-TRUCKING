/**
 * Safety Notification Triggers
 *
 * Handles: HOS violations, document expiring.
 */

import { sendNotificationEmail, emailTemplates } from '../email';
import { createNotification, notifyUsersByRole } from '../helpers';
import { prisma } from '../../prisma';
import { routeHOSViolation, routeDocumentExpiring } from '../mattermost-router';

/** Notify when an HOS violation is detected */
export async function notifyHOSViolation(
  driverId: string,
  violationType: string,
  details?: string
) {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: { user: true },
    });

    if (!driver || !driver.userId || !driver.user) return;

    const driverName = `${driver.user.firstName} ${driver.user.lastName}`;

    await sendNotificationEmail(
      driver.userId,
      'HOS_VIOLATION',
      emailTemplates.hosViolation(driverName, violationType)
    );

    await createNotification({
      userId: driver.userId,
      type: 'HOS_VIOLATION',
      priority: 'CRITICAL',
      title: 'HOS Violation Detected',
      message: `HOS violation detected: ${violationType}. ${details || ''}`,
      link: `/dashboard/drivers/${driver.driverNumber}`,
    });

    await notifyUsersByRole({
      companyId: driver.companyId,
      roles: ['ADMIN', 'DISPATCHER'],
      type: 'HOS_VIOLATION',
      priority: 'CRITICAL',
      title: `HOS Violation: ${driverName}`,
      message: `Driver ${driver.driverNumber} has an HOS violation: ${violationType}`,
      link: `/dashboard/drivers/${driver.driverNumber}`,
    });

    await routeHOSViolation({
      driverName,
      driverNumber: driver.driverNumber,
      violationType,
    });
  } catch (error) {
    console.error('Error sending HOS violation notification:', error);
  }
}

/** Notify when a document is expiring */
export async function notifyDocumentExpiring(
  entityType: 'DRIVER' | 'TRUCK',
  entityId: string,
  documentType: string,
  expiryDate: Date
) {
  try {
    const formattedDate = expiryDate.toLocaleDateString();
    let entityName = '';
    let entityNumber = '';
    let companyId = '';
    let userIds: string[] = [];

    if (entityType === 'DRIVER') {
      const driver = await prisma.driver.findUnique({
        where: { id: entityId },
        include: { user: true },
      });

      if (!driver || !driver.user) return;

      entityName = `${driver.user.firstName} ${driver.user.lastName}`;
      entityNumber = driver.driverNumber;
      companyId = driver.companyId;
      userIds = driver.userId ? [driver.userId] : [];
    } else if (entityType === 'TRUCK') {
      const truck = await prisma.truck.findUnique({
        where: { id: entityId },
        include: { currentDrivers: { include: { user: true } } },
      });

      if (!truck) return;

      entityName = truck.truckNumber;
      entityNumber = truck.truckNumber;
      companyId = truck.companyId;
      userIds = truck.currentDrivers.filter(d => d.userId).map((d) => d.userId as string);
    }

    for (const userId of userIds) {
      if (!userId) continue;
      await sendNotificationEmail(
        userId,
        'DOCUMENT_EXPIRING',
        emailTemplates.documentExpiring(documentType, entityName, formattedDate)
      );

      await createNotification({
        userId,
        type: 'DOCUMENT_EXPIRING',
        priority: 'WARNING',
        title: `Document Expiring: ${documentType}`,
        message: `${documentType} for ${entityName} is expiring on ${formattedDate}`,
        link: entityType === 'DRIVER'
          ? `/dashboard/drivers/${entityNumber}`
          : `/dashboard/trucks/${entityNumber}`,
      });
    }

    await notifyUsersByRole({
      companyId,
      roles: ['ADMIN', 'DISPATCHER'],
      type: 'DOCUMENT_EXPIRING',
      priority: 'WARNING',
      title: `Document Expiring: ${documentType}`,
      message: `${documentType} for ${entityName} is expiring on ${formattedDate}`,
      link: entityType === 'DRIVER'
        ? `/dashboard/drivers/${entityNumber}`
        : `/dashboard/trucks/${entityNumber}`,
    });

    await routeDocumentExpiring({
      entityType,
      entityName,
      documentType,
      expiryDate: formattedDate,
    });
  } catch (error) {
    console.error('Error sending document expiring notification:', error);
  }
}

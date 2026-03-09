/**
 * Load Notification Triggers
 *
 * Handles: load assigned, status changed, delivered, cancelled, rate con missing.
 */

import { sendNotificationEmail, emailTemplates } from '../email';
import { createNotification, notifyUsersByRole } from '../helpers';
import { prisma } from '../../prisma';
import { getMattermostNotificationService } from '@/lib/services/MattermostNotificationService';

/** Notify when a load is assigned to a driver */
export async function notifyLoadAssigned(loadId: string, driverId: string) {
  try {
    const load = await prisma.load.findUnique({
      where: { id: loadId },
      include: {
        customer: true,
        driver: { include: { user: true } },
      },
    });

    if (!load || !load.driver || !load.driver.userId) return;

    await sendNotificationEmail(
      load.driver.userId,
      'LOAD_ASSIGNED',
      emailTemplates.loadAssigned(
        load.loadNumber,
        load.customer.name,
        (load.pickupCity || 'N/A') as string,
        (load.deliveryCity || 'N/A') as string
      )
    );

    await createNotification({
      userId: load.driver.userId,
      type: 'LOAD_ASSIGNED',
      title: `Load ${load.loadNumber} Assigned`,
      message: `You have been assigned load ${load.loadNumber} from ${load.pickupCity}, ${load.pickupState} to ${load.deliveryCity}, ${load.deliveryState}`,
      link: `/dashboard/loads/${load.loadNumber}`,
    });

    const driverName = `${load.driver.user?.firstName ?? ''} ${load.driver.user?.lastName ?? ''}`;
    await getMattermostNotificationService().notifyLoadAssigned({
      loadNumber: load.loadNumber,
      driverName,
      pickupCity: load.pickupCity || 'N/A',
      pickupState: load.pickupState || '',
      deliveryCity: load.deliveryCity || 'N/A',
      deliveryState: load.deliveryState || '',
    });
  } catch (error) {
    console.error('Error sending load assigned notification:', error);
  }
}

/** Notify when a load status changes */
export async function notifyLoadStatusChanged(
  loadId: string,
  oldStatus: string,
  newStatus: string,
  userId?: string
) {
  try {
    const load = await prisma.load.findUnique({
      where: { id: loadId },
      include: {
        driver: { include: { user: true } },
        customer: true,
      },
    });

    if (!load) return;

    if (load.driverId && load.driver && load.driver.userId) {
      await sendNotificationEmail(
        load.driver.userId,
        'LOAD_UPDATED',
        emailTemplates.loadUpdated(load.loadNumber, newStatus)
      );

      await createNotification({
        userId: load.driver.userId,
        type: 'LOAD_UPDATED',
        title: `Load ${load.loadNumber} Updated`,
        message: `Load ${load.loadNumber} status changed from ${oldStatus} to ${newStatus}`,
        link: `/dashboard/loads/${load.loadNumber}`,
      });
    }

    if (userId) {
      await notifyUsersByRole({
        companyId: load.companyId,
        roles: ['ADMIN', 'DISPATCHER'],
        excludeUserId: userId,
        type: 'LOAD_UPDATED',
        title: `Load ${load.loadNumber} Status Changed`,
        message: `Load ${load.loadNumber} status changed from ${oldStatus} to ${newStatus}`,
        link: `/dashboard/loads/${load.loadNumber}`,
      });
    }

    const driverName = load.driver?.user
      ? `${load.driver.user.firstName} ${load.driver.user.lastName}`
      : undefined;
    await getMattermostNotificationService().notifyLoadStatusChanged({
      loadNumber: load.loadNumber,
      oldStatus,
      newStatus,
      driverName,
    });
  } catch (error) {
    console.error('Error sending load status change notification:', error);
  }
}

/** Notify when a load is delivered */
export async function notifyLoadDelivered(loadId: string) {
  try {
    const load = await prisma.load.findUnique({
      where: { id: loadId },
      include: {
        customer: true,
        driver: { include: { user: true } },
      },
    });

    if (!load) return;

    // Notify driver
    if (load.driver?.userId) {
      await createNotification({
        userId: load.driver.userId,
        type: 'LOAD_DELIVERED',
        title: `Load ${load.loadNumber} Delivered`,
        message: `Load ${load.loadNumber} to ${load.deliveryCity}, ${load.deliveryState} has been marked as delivered`,
        link: `/dashboard/loads/${load.loadNumber}`,
      });
    }

    await notifyUsersByRole({
      companyId: load.companyId,
      roles: ['ADMIN', 'DISPATCHER'],
      type: 'LOAD_DELIVERED',
      title: `Load ${load.loadNumber} Delivered`,
      message: `Load ${load.loadNumber} (${load.customer.name}) delivered to ${load.deliveryCity}, ${load.deliveryState}`,
      link: `/dashboard/loads/${load.loadNumber}`,
    });

    const driverName = load.driver?.user
      ? `${load.driver.user.firstName} ${load.driver.user.lastName}`
      : undefined;
    await getMattermostNotificationService().notifyLoadDelivered({
      loadNumber: load.loadNumber,
      customerName: load.customer.name,
      deliveryCity: load.deliveryCity || 'N/A',
      deliveryState: load.deliveryState || '',
      driverName,
    });

    // Check for missing rate confirmation
    const rateConDoc = await prisma.document.findFirst({
      where: {
        loadId,
        type: 'RATE_CONFIRMATION',
      },
    });
    if (!rateConDoc) {
      await notifyRateConMissing(load.id, load.loadNumber, load.companyId, load.customer.name);
    }
  } catch (error) {
    console.error('Error sending load delivered notification:', error);
  }
}

/** Notify when a load is cancelled */
export async function notifyLoadCancelled(loadId: string) {
  try {
    const load = await prisma.load.findUnique({
      where: { id: loadId },
      include: {
        customer: true,
        driver: { include: { user: true } },
      },
    });

    if (!load) return;

    if (load.driver?.userId) {
      await createNotification({
        userId: load.driver.userId,
        type: 'LOAD_CANCELLED',
        priority: 'WARNING',
        title: `Load ${load.loadNumber} Cancelled`,
        message: `Load ${load.loadNumber} has been cancelled`,
        link: `/dashboard/loads/${load.loadNumber}`,
      });
    }

    await notifyUsersByRole({
      companyId: load.companyId,
      roles: ['ADMIN', 'DISPATCHER'],
      type: 'LOAD_CANCELLED',
      priority: 'WARNING',
      title: `Load ${load.loadNumber} Cancelled`,
      message: `Load ${load.loadNumber} (${load.customer.name}) has been cancelled`,
      link: `/dashboard/loads/${load.loadNumber}`,
    });

    const driverName = load.driver?.user
      ? `${load.driver.user.firstName} ${load.driver.user.lastName}`
      : undefined;
    await getMattermostNotificationService().notifyLoadCancelled({
      loadNumber: load.loadNumber,
      customerName: load.customer.name,
      driverName,
    });
  } catch (error) {
    console.error('Error sending load cancelled notification:', error);
  }
}

/** Notify when rate confirmation document is missing after delivery */
export async function notifyRateConMissing(
  loadId: string,
  loadNumber: string,
  companyId: string,
  customerName: string
) {
  try {
    await notifyUsersByRole({
      companyId,
      roles: ['ADMIN', 'DISPATCHER'],
      type: 'RATE_CON_MISSING',
      priority: 'WARNING',
      title: `Rate Con Missing: ${loadNumber}`,
      message: `Load ${loadNumber} (${customerName}) was delivered but has no rate confirmation uploaded`,
      link: `/dashboard/loads/${loadNumber}`,
    });

    await getMattermostNotificationService().notifyRateConMissing({
      loadNumber,
      customerName,
    });
  } catch (error) {
    console.error('Error sending rate con missing notification:', error);
  }
}

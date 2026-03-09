/**
 * Fleet Notification Triggers
 *
 * Handles: maintenance due, maintenance completed, truck out of service.
 */

import { sendNotificationEmail, emailTemplates } from '../email';
import { createNotification, notifyUsersByRole } from '../helpers';
import { prisma } from '../../prisma';
import { getMattermostNotificationService } from '@/lib/services/MattermostNotificationService';

/** Notify when maintenance is due for a truck */
export async function notifyMaintenanceDue(truckId: string, maintenanceType: string, dueDate: Date) {
  try {
    const truck = await prisma.truck.findUnique({
      where: { id: truckId },
      include: { currentDrivers: { include: { user: true } } },
    });

    if (!truck) return;

    const formattedDate = dueDate.toLocaleDateString();

    for (const driver of truck.currentDrivers) {
      if (!driver.userId) continue;
      await sendNotificationEmail(
        driver.userId,
        'MAINTENANCE_DUE',
        emailTemplates.maintenanceDue(truck.truckNumber, maintenanceType, formattedDate)
      );

      await createNotification({
        userId: driver.userId,
        type: 'MAINTENANCE_DUE',
        priority: 'WARNING',
        title: `Maintenance Due: ${truck.truckNumber}`,
        message: `Truck ${truck.truckNumber} has ${maintenanceType} maintenance due on ${formattedDate}`,
        link: `/dashboard/trucks/${truck.truckNumber}`,
      });
    }

    await notifyUsersByRole({
      companyId: truck.companyId,
      roles: ['ADMIN', 'DISPATCHER'],
      type: 'MAINTENANCE_DUE',
      priority: 'WARNING',
      title: `Maintenance Due: ${truck.truckNumber}`,
      message: `Truck ${truck.truckNumber} has ${maintenanceType} maintenance due on ${formattedDate}`,
      link: `/dashboard/trucks/${truck.truckNumber}`,
    });

    // Previously missing Mattermost notification — now included
    await getMattermostNotificationService().notifyMaintenanceDue({
      truckNumber: truck.truckNumber,
      maintenanceType,
      dueDate: formattedDate,
    });
  } catch (error) {
    console.error('Error sending maintenance due notification:', error);
  }
}

/** Notify when maintenance work is completed */
export async function notifyMaintenanceCompleted(params: {
  truckId: string;
  truckNumber: string;
  maintenanceType: string;
  companyId: string;
}) {
  try {
    await notifyUsersByRole({
      companyId: params.companyId,
      roles: ['ADMIN', 'DISPATCHER', 'FLEET'],
      type: 'MAINTENANCE_COMPLETED',
      title: `Maintenance Completed: ${params.truckNumber}`,
      message: `${params.maintenanceType} maintenance on truck ${params.truckNumber} has been completed`,
      link: `/dashboard/trucks/${params.truckNumber}`,
    });

    await getMattermostNotificationService().notifyMaintenanceCompleted({
      truckNumber: params.truckNumber,
      maintenanceType: params.maintenanceType,
    });
  } catch (error) {
    console.error('Error sending maintenance completed notification:', error);
  }
}

/** Notify when a truck is marked out of service */
export async function notifyTruckOutOfService(params: {
  truckId: string;
  truckNumber: string;
  companyId: string;
  reason?: string;
}) {
  try {
    await notifyUsersByRole({
      companyId: params.companyId,
      roles: ['ADMIN', 'DISPATCHER', 'FLEET'],
      type: 'TRUCK_OUT_OF_SERVICE',
      priority: 'WARNING',
      title: `Truck OOS: ${params.truckNumber}`,
      message: `Truck ${params.truckNumber} has been marked Out of Service${params.reason ? `: ${params.reason}` : ''}`,
      link: `/dashboard/trucks/${params.truckNumber}`,
    });

    await getMattermostNotificationService().notifyTruckOutOfService({
      truckNumber: params.truckNumber,
      reason: params.reason,
    });
  } catch (error) {
    console.error('Error sending truck OOS notification:', error);
  }
}

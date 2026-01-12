/**
 * Notification Triggers
 * 
 * Automatically send notifications when certain events occur
 */

import { sendNotificationEmail, emailTemplates } from './email';
import { prisma } from '../prisma';
import { LoadStatus } from '@prisma/client';

/**
 * Send notification when a load is assigned to a driver
 */
export async function notifyLoadAssigned(loadId: string, driverId: string) {
  try {
    const load = await prisma.load.findUnique({
      where: { id: loadId },
      include: {
        customer: true,
        driver: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!load || !load.driver || !load.driver.userId) {
      return;
    }

    // Send email notification
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

    // Create in-app notification
    await prisma.notification.create({
      data: {
        userId: load.driver.userId,
        type: 'LOAD_ASSIGNED',
        title: `Load ${load.loadNumber} Assigned`,
        message: `You have been assigned load ${load.loadNumber} from ${load.pickupCity}, ${load.pickupState} to ${load.deliveryCity}, ${load.deliveryState}`,
        link: `/dashboard/loads/${load.id}`,
      },
    });
  } catch (error) {
    console.error('Error sending load assigned notification:', error);
  }
}

/**
 * Send notification when a load status changes
 */
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
        driver: {
          include: {
            user: true,
          },
        },
        customer: true,
      },
    });

    if (!load) {
      return;
    }

    // Notify driver if assigned
    if (load.driverId && load.driver && load.driver.userId) {
      await sendNotificationEmail(
        load.driver.userId,
        'LOAD_UPDATED',
        emailTemplates.loadUpdated(load.loadNumber, newStatus)
      );

      await prisma.notification.create({
        data: {
          userId: load.driver.userId,
          type: 'LOAD_UPDATED',
          title: `Load ${load.loadNumber} Updated`,
          message: `Load ${load.loadNumber} status changed from ${oldStatus} to ${newStatus}`,
          link: `/dashboard/loads/${load.id}`,
        },
      });
    }

    // Notify dispatchers/admins (users with appropriate roles)
    if (userId) {
      const dispatchers = await prisma.user.findMany({
        where: {
          companyId: load.companyId,
          role: {
            in: ['ADMIN', 'DISPATCHER'],
          },
          id: {
            not: userId, // Don't notify the user who made the change
          },
        },
      });

      for (const dispatcher of dispatchers) {
        await prisma.notification.create({
          data: {
            userId: dispatcher.id,
            type: 'LOAD_UPDATED',
            title: `Load ${load.loadNumber} Status Changed`,
            message: `Load ${load.loadNumber} status changed from ${oldStatus} to ${newStatus}`,
            link: `/dashboard/loads/${load.id}`,
          },
        });
      }
    }
  } catch (error) {
    console.error('Error sending load status change notification:', error);
  }
}

/**
 * Send notification when HOS violation is detected
 */
export async function notifyHOSViolation(
  driverId: string,
  violationType: string,
  details?: string
) {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        user: true,
      },
    });

    if (!driver || !driver.userId || !driver.user) {
      return;
    }

    // Send email notification
    await sendNotificationEmail(
      driver.userId,
      'HOS_VIOLATION',
      emailTemplates.hosViolation(
        `${driver.user.firstName} ${driver.user.lastName}`,
        violationType
      )
    );

    // Create in-app notification for driver
    await prisma.notification.create({
      data: {
        userId: driver.userId,
        type: 'HOS_VIOLATION',
        title: 'HOS Violation Detected',
        message: `HOS violation detected: ${violationType}. ${details || ''}`,
        link: `/dashboard/drivers/${driver.id}`,
      },
    });

    // Notify dispatchers and admins
    const dispatchers = await prisma.user.findMany({
      where: {
        companyId: driver.companyId,
        role: {
          in: ['ADMIN', 'DISPATCHER'],
        },
      },
    });

    for (const dispatcher of dispatchers) {
      await prisma.notification.create({
        data: {
          userId: dispatcher.id,
          type: 'HOS_VIOLATION',
          title: `HOS Violation: ${driver.user?.firstName ?? ''} ${driver.user?.lastName ?? ''}`,
          message: `Driver ${driver.driverNumber} has an HOS violation: ${violationType}`,
          link: `/dashboard/drivers/${driver.id}`,
        },
      });
    }
  } catch (error) {
    console.error('Error sending HOS violation notification:', error);
  }
}

/**
 * Send notification when maintenance is due
 */
async function notifyMaintenanceDue(truckId: string, maintenanceType: string, dueDate: Date) {
  try {
    const truck = await prisma.truck.findUnique({
      where: { id: truckId },
      include: {
        currentDrivers: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!truck) {
      return;
    }

    const formattedDate = dueDate.toLocaleDateString();

    // Notify drivers assigned to this truck (only those with user accounts)
    for (const driver of truck.currentDrivers) {
      if (!driver.userId) continue;
      await sendNotificationEmail(
        driver.userId,
        'MAINTENANCE_DUE',
        emailTemplates.maintenanceDue(truck.truckNumber, maintenanceType, formattedDate)
      );

      await prisma.notification.create({
        data: {
          userId: driver.userId,
          type: 'MAINTENANCE_DUE',
          title: `Maintenance Due: ${truck.truckNumber}`,
          message: `Truck ${truck.truckNumber} has ${maintenanceType} maintenance due on ${formattedDate}`,
          link: `/dashboard/trucks/${truck.id}`,
        },
      });
    }

    // Notify dispatchers and admins
    const dispatchers = await prisma.user.findMany({
      where: {
        companyId: truck.companyId,
        role: {
          in: ['ADMIN', 'DISPATCHER'],
        },
      },
    });

    for (const dispatcher of dispatchers) {
      await prisma.notification.create({
        data: {
          userId: dispatcher.id,
          type: 'MAINTENANCE_DUE',
          title: `Maintenance Due: ${truck.truckNumber}`,
          message: `Truck ${truck.truckNumber} has ${maintenanceType} maintenance due on ${formattedDate}`,
          link: `/dashboard/trucks/${truck.id}`,
        },
      });
    }
  } catch (error) {
    console.error('Error sending maintenance due notification:', error);
  }
}

/**
 * Send notification when document is expiring
 */
export async function notifyDocumentExpiring(
  entityType: 'DRIVER' | 'TRUCK',
  entityId: string,
  documentType: string,
  expiryDate: Date
) {
  try {
    const formattedDate = expiryDate.toLocaleDateString();
    let entityName = '';
    let companyId = '';
    let userIds: string[] = [];

    if (entityType === 'DRIVER') {
      const driver = await prisma.driver.findUnique({
        where: { id: entityId },
        include: {
          user: true,
        },
      });

      if (!driver || !driver.user) return;

      entityName = `${driver.user.firstName} ${driver.user.lastName}`;
      companyId = driver.companyId;
      userIds = driver.userId ? [driver.userId] : [];
    } else if (entityType === 'TRUCK') {
      const truck = await prisma.truck.findUnique({
        where: { id: entityId },
        include: {
          currentDrivers: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!truck) return;

      entityName = truck.truckNumber;
      companyId = truck.companyId;
      userIds = truck.currentDrivers.filter(d => d.userId).map((d) => d.userId as string);
    }

    // Notify relevant users (only those with valid IDs)
    for (const userId of userIds) {
      if (!userId) continue;
      await sendNotificationEmail(
        userId,
        'DOCUMENT_EXPIRING',
        emailTemplates.documentExpiring(documentType, entityName, formattedDate)
      );

      await prisma.notification.create({
        data: {
          userId,
          type: 'DOCUMENT_EXPIRING',
          title: `Document Expiring: ${documentType}`,
          message: `${documentType} for ${entityName} is expiring on ${formattedDate}`,
          link: entityType === 'DRIVER' ? `/dashboard/drivers/${entityId}` : `/dashboard/trucks/${entityId}`,
        },
      });
    }

    // Notify dispatchers and admins
    const dispatchers = await prisma.user.findMany({
      where: {
        companyId,
        role: {
          in: ['ADMIN', 'DISPATCHER'],
        },
      },
    });

    for (const dispatcher of dispatchers) {
      await prisma.notification.create({
        data: {
          userId: dispatcher.id,
          type: 'DOCUMENT_EXPIRING',
          title: `Document Expiring: ${documentType}`,
          message: `${documentType} for ${entityName} is expiring on ${formattedDate}`,
          link: entityType === 'DRIVER' ? `/dashboard/drivers/${entityId}` : `/dashboard/trucks/${entityId}`,
        },
      });
    }
  } catch (error) {
    console.error('Error sending document expiring notification:', error);
  }
}

/**
 * Send notification when invoice is paid
 */
export async function notifyInvoicePaid(invoiceId: string) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: true,
      },
    });

    if (!invoice) {
      return;
    }

    // Notify admins and dispatchers
    const users = await prisma.user.findMany({
      where: {
        companyId: invoice.customer.companyId,
        role: {
          in: ['ADMIN', 'DISPATCHER'],
        },
      },
    });

    for (const user of users) {
      await sendNotificationEmail(
        user.id,
        'INVOICE_PAID',
        emailTemplates.invoicePaid(invoice.invoiceNumber, invoice.total)
      );

      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'INVOICE_PAID',
          title: `Invoice ${invoice.invoiceNumber} Paid`,
          message: `Invoice ${invoice.invoiceNumber} for ${invoice.customer.name} has been marked as paid. Amount: $${invoice.total.toFixed(2)}`,
          link: `/dashboard/invoices/${invoice.id}`,
        },
      });
    }
  } catch (error) {
    console.error('Error sending invoice paid notification:', error);
  }
}

/**
 * Send notification when settlement is generated
 */
export async function notifySettlementGenerated(settlementId: string) {
  try {
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
      include: {
        driver: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!settlement || !settlement.driver || !settlement.driver.userId) {
      return;
    }

    // Notify driver
    await prisma.notification.create({
      data: {
        userId: settlement.driver.userId,
        type: 'SYSTEM_ALERT',
        title: `Settlement ${settlement.settlementNumber} Generated`,
        message: `Your settlement ${settlement.settlementNumber} has been generated. Net pay: $${settlement.netPay.toFixed(2)}`,
        link: `/dashboard/settlements/${settlement.id}`,
      },
    });

    // Notify admins and dispatchers
    const users = await prisma.user.findMany({
      where: {
        companyId: settlement.driver.companyId,
        role: {
          in: ['ADMIN', 'DISPATCHER'],
        },
      },
    });

    for (const user of users) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'SYSTEM_ALERT',
          title: `Settlement Generated: ${settlement.settlementNumber}`,
          message: `Settlement ${settlement.settlementNumber} for ${settlement.driver.user?.firstName ?? ''} ${settlement.driver.user?.lastName ?? ''} has been generated. Net pay: $${settlement.netPay.toFixed(2)}`,
          link: `/dashboard/settlements/${settlement.id}`,
        },
      });
    }
  } catch (error) {
    console.error('Error sending settlement generated notification:', error);
  }
}

/**
 * Send notification when detention is detected
 */
export async function notifyDetentionDetected(params: {
  loadId: string;
  loadNumber: string;
  detentionHours: number;
  location: string;
  customerName: string;
  estimatedCharge: number;
  driverLate?: boolean;
  clockStartReason?: string;
  requiresAttention?: boolean;
}) {
  try {
    const load = await prisma.load.findUnique({
      where: { id: params.loadId },
      include: {
        dispatcher: true,
        driver: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!load) {
      return;
    }

    const lateWarning = params.driverLate
      ? ' ⚠️ DRIVER LATE - Detention may be at risk if broker disputes.'
      : '';

    // Notify dispatcher
    if (load.dispatcherId) {
      await prisma.notification.create({
        data: {
          userId: load.dispatcherId,
          type: 'SYSTEM_ALERT',
          title: `Detention Detected: Load ${params.loadNumber}`,
          message: `Detention of ${params.detentionHours.toFixed(2)} hours detected at ${params.location} for load ${params.loadNumber}. Estimated charge: $${params.estimatedCharge.toFixed(2)}.${lateWarning}`,
          link: `/dashboard/loads/${params.loadId}`,
        },
      });
    }

    // Notify admins and dispatchers
    const users = await prisma.user.findMany({
      where: {
        companyId: load.companyId,
        role: {
          in: ['ADMIN', 'DISPATCHER'],
        },
      },
    });

    for (const user of users) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: params.requiresAttention ? 'SYSTEM_ALERT' : 'LOAD_UPDATED',
          title: `Detention Detected: Load ${params.loadNumber}${params.driverLate ? ' [DRIVER LATE]' : ''}`,
          message: `Detention of ${params.detentionHours.toFixed(2)} hours detected at ${params.location} for load ${params.loadNumber} (${params.customerName}). Estimated charge: $${params.estimatedCharge.toFixed(2)}.${lateWarning}`,
          link: `/dashboard/loads/${params.loadId}`,
        },
      });
    }
  } catch (error) {
    console.error('Error sending detention detected notification:', error);
  }
}

/**
 * Send notification when billing hold is set
 */
export async function notifyBillingHold(params: {
  loadId: string;
  loadNumber: string;
  reason: string;
  accessorialChargeId: string;
  requiresRateConUpdate: boolean;
  blocksInvoicing?: boolean;
  allowsSettlement?: boolean;
}) {
  try {
    const load = await prisma.load.findUnique({
      where: { id: params.loadId },
      include: {
        customer: true,
      },
    });

    if (!load) {
      return;
    }

    // Notify accounting department (admins and accountants)
    const users = await prisma.user.findMany({
      where: {
        companyId: load.companyId,
        role: {
          in: ['ADMIN', 'ACCOUNTANT'],
        },
      },
    });

    const settlementNote = params.allowsSettlement
      ? ' NOTE: Driver settlement (AP) can proceed independently.'
      : '';

    for (const user of users) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'SYSTEM_ALERT',
          title: `Billing Hold: Load ${params.loadNumber}`,
          message: `Load ${params.loadNumber} (${load.customer.name}) is on billing hold. ${params.reason}${settlementNote}`,
          link: `/dashboard/loads/${params.loadId}`,
        },
      });
    }
  } catch (error) {
    console.error('Error sending billing hold notification:', error);
  }
}
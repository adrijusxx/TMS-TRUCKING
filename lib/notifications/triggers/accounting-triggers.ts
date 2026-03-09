/**
 * Accounting Notification Triggers
 *
 * Handles: invoice paid/created/overdue, settlement generated/approved/paid,
 * detention detected, billing hold.
 */

import { sendNotificationEmail, emailTemplates } from '../email';
import { createNotification, notifyUsersByRole } from '../helpers';
import { prisma } from '../../prisma';
import { getMattermostNotificationService } from '@/lib/services/MattermostNotificationService';

/** Notify when an invoice is paid */
export async function notifyInvoicePaid(invoiceId: string) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true },
    });

    if (!invoice) return;

    const users = await prisma.user.findMany({
      where: {
        companyId: invoice.customer.companyId,
        role: { in: ['ADMIN', 'DISPATCHER'] },
      },
    });

    for (const user of users) {
      await sendNotificationEmail(
        user.id,
        'INVOICE_PAID',
        emailTemplates.invoicePaid(invoice.invoiceNumber, invoice.total)
      );

      await createNotification({
        userId: user.id,
        type: 'INVOICE_PAID',
        title: `Invoice ${invoice.invoiceNumber} Paid`,
        message: `Invoice ${invoice.invoiceNumber} for ${invoice.customer.name} has been marked as paid. Amount: $${invoice.total.toFixed(2)}`,
        link: `/dashboard/invoices/${invoice.invoiceNumber}`,
      });
    }

    await getMattermostNotificationService().notifyInvoicePaid({
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customer.name,
      amount: Number(invoice.total),
    });
  } catch (error) {
    console.error('Error sending invoice paid notification:', error);
  }
}

/** Notify when an invoice is created */
export async function notifyInvoiceCreated(invoiceId: string) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true },
    });

    if (!invoice) return;

    await notifyUsersByRole({
      companyId: invoice.customer.companyId,
      roles: ['ADMIN', 'ACCOUNTANT'],
      type: 'INVOICE_CREATED',
      title: `Invoice Created: ${invoice.invoiceNumber}`,
      message: `Invoice ${invoice.invoiceNumber} created for ${invoice.customer.name}. Amount: $${invoice.total.toFixed(2)}`,
      link: `/dashboard/invoices/${invoice.invoiceNumber}`,
    });

    await getMattermostNotificationService().notifyInvoiceCreated({
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customer.name,
      amount: Number(invoice.total),
    });
  } catch (error) {
    console.error('Error sending invoice created notification:', error);
  }
}

/** Notify when an invoice is overdue */
export async function notifyInvoiceOverdue(invoiceId: string) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true },
    });

    if (!invoice) return;

    const daysPastDue = invoice.dueDate
      ? Math.floor((Date.now() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    await notifyUsersByRole({
      companyId: invoice.customer.companyId,
      roles: ['ADMIN', 'ACCOUNTANT'],
      type: 'INVOICE_OVERDUE',
      priority: 'WARNING',
      title: `Invoice Overdue: ${invoice.invoiceNumber}`,
      message: `Invoice ${invoice.invoiceNumber} for ${invoice.customer.name} is ${daysPastDue} days past due. Amount: $${invoice.total.toFixed(2)}`,
      link: `/dashboard/invoices/${invoice.invoiceNumber}`,
    });

    await getMattermostNotificationService().notifyInvoiceOverdue({
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customer.name,
      amount: Number(invoice.total),
      daysPastDue,
    });
  } catch (error) {
    console.error('Error sending invoice overdue notification:', error);
  }
}

/** Notify when a settlement is generated */
export async function notifySettlementGenerated(settlementId: string) {
  try {
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
      include: { driver: { include: { user: true } } },
    });

    if (!settlement || !settlement.driver || !settlement.driver.userId) return;

    const driverName = `${settlement.driver.user?.firstName ?? ''} ${settlement.driver.user?.lastName ?? ''}`;

    await createNotification({
      userId: settlement.driver.userId,
      type: 'SYSTEM_ALERT',
      title: `Settlement ${settlement.settlementNumber} Generated`,
      message: `Your settlement ${settlement.settlementNumber} has been generated. Net pay: $${settlement.netPay.toFixed(2)}`,
      link: `/dashboard/settlements/${settlement.settlementNumber}`,
    });

    await notifyUsersByRole({
      companyId: settlement.driver.companyId,
      roles: ['ADMIN', 'DISPATCHER'],
      type: 'SYSTEM_ALERT',
      title: `Settlement Generated: ${settlement.settlementNumber}`,
      message: `Settlement ${settlement.settlementNumber} for ${driverName} has been generated. Net pay: $${settlement.netPay.toFixed(2)}`,
      link: `/dashboard/settlements/${settlement.settlementNumber}`,
    });

    await getMattermostNotificationService().notifySettlementReady({
      settlementNumber: settlement.settlementNumber,
      driverName,
      netPay: Number(settlement.netPay),
    });
  } catch (error) {
    console.error('Error sending settlement generated notification:', error);
  }
}

/** Notify when a settlement is approved */
export async function notifySettlementApproved(settlementId: string) {
  try {
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
      include: { driver: { include: { user: true } } },
    });

    if (!settlement || !settlement.driver) return;

    const driverName = `${settlement.driver.user?.firstName ?? ''} ${settlement.driver.user?.lastName ?? ''}`;

    if (settlement.driver.userId) {
      await createNotification({
        userId: settlement.driver.userId,
        type: 'SETTLEMENT_APPROVED',
        title: `Settlement ${settlement.settlementNumber} Approved`,
        message: `Your settlement ${settlement.settlementNumber} has been approved. Net pay: $${settlement.netPay.toFixed(2)}`,
        link: `/dashboard/settlements/${settlement.settlementNumber}`,
      });
    }

    await notifyUsersByRole({
      companyId: settlement.driver.companyId,
      roles: ['ADMIN', 'ACCOUNTANT'],
      type: 'SETTLEMENT_APPROVED',
      title: `Settlement Approved: ${settlement.settlementNumber}`,
      message: `Settlement ${settlement.settlementNumber} for ${driverName} approved. Net pay: $${settlement.netPay.toFixed(2)}`,
      link: `/dashboard/settlements/${settlement.settlementNumber}`,
    });

    await getMattermostNotificationService().notifySettlementApproved({
      settlementNumber: settlement.settlementNumber,
      driverName,
      netPay: Number(settlement.netPay),
    });
  } catch (error) {
    console.error('Error sending settlement approved notification:', error);
  }
}

/** Notify when a settlement is paid */
export async function notifySettlementPaid(settlementId: string) {
  try {
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
      include: { driver: { include: { user: true } } },
    });

    if (!settlement || !settlement.driver) return;

    const driverName = `${settlement.driver.user?.firstName ?? ''} ${settlement.driver.user?.lastName ?? ''}`;

    if (settlement.driver.userId) {
      await createNotification({
        userId: settlement.driver.userId,
        type: 'SETTLEMENT_PAID',
        title: `Settlement ${settlement.settlementNumber} Paid`,
        message: `Your settlement ${settlement.settlementNumber} has been paid. Amount: $${settlement.netPay.toFixed(2)}`,
        link: `/dashboard/settlements/${settlement.settlementNumber}`,
      });
    }

    await notifyUsersByRole({
      companyId: settlement.driver.companyId,
      roles: ['ADMIN', 'ACCOUNTANT'],
      type: 'SETTLEMENT_PAID',
      title: `Settlement Paid: ${settlement.settlementNumber}`,
      message: `Settlement ${settlement.settlementNumber} for ${driverName} has been paid. Amount: $${settlement.netPay.toFixed(2)}`,
      link: `/dashboard/settlements/${settlement.settlementNumber}`,
    });

    await getMattermostNotificationService().notifySettlementPaid({
      settlementNumber: settlement.settlementNumber,
      driverName,
      netPay: Number(settlement.netPay),
    });
  } catch (error) {
    console.error('Error sending settlement paid notification:', error);
  }
}

/** Notify when detention is detected */
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
        driver: { include: { user: true } },
      },
    });

    if (!load) return;

    const lateWarning = params.driverLate
      ? ' ⚠️ DRIVER LATE - Detention may be at risk if broker disputes.'
      : '';

    if (load.dispatcherId) {
      await createNotification({
        userId: load.dispatcherId,
        type: 'SYSTEM_ALERT',
        title: `Detention Detected: Load ${params.loadNumber}`,
        message: `Detention of ${params.detentionHours.toFixed(2)} hours detected at ${params.location} for load ${params.loadNumber}. Estimated charge: $${params.estimatedCharge.toFixed(2)}.${lateWarning}`,
        link: `/dashboard/loads/${params.loadNumber}`,
      });
    }

    await notifyUsersByRole({
      companyId: load.companyId,
      roles: ['ADMIN', 'DISPATCHER'],
      type: params.requiresAttention ? 'SYSTEM_ALERT' : 'LOAD_UPDATED',
      title: `Detention Detected: Load ${params.loadNumber}${params.driverLate ? ' [DRIVER LATE]' : ''}`,
      message: `Detention of ${params.detentionHours.toFixed(2)} hours detected at ${params.location} for load ${params.loadNumber} (${params.customerName}). Estimated charge: $${params.estimatedCharge.toFixed(2)}.${lateWarning}`,
      link: `/dashboard/loads/${params.loadNumber}`,
    });

    await getMattermostNotificationService().notifyDetentionDetected({
      loadNumber: params.loadNumber,
      location: params.location,
      customerName: params.customerName,
      detentionHours: params.detentionHours,
      estimatedCharge: params.estimatedCharge,
      driverLate: params.driverLate,
    });
  } catch (error) {
    console.error('Error sending detention detected notification:', error);
  }
}

/** Notify when a billing hold is set */
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
      include: { customer: true },
    });

    if (!load) return;

    const settlementNote = params.allowsSettlement
      ? ' NOTE: Driver settlement (AP) can proceed independently.'
      : '';

    await notifyUsersByRole({
      companyId: load.companyId,
      roles: ['ADMIN', 'ACCOUNTANT'],
      type: 'SYSTEM_ALERT',
      priority: 'WARNING',
      title: `Billing Hold: Load ${params.loadNumber}`,
      message: `Load ${params.loadNumber} (${load.customer.name}) is on billing hold. ${params.reason}${settlementNote}`,
      link: `/dashboard/loads/${params.loadNumber}`,
    });

    await getMattermostNotificationService().notifyBillingHold({
      loadNumber: params.loadNumber,
      customerName: load.customer.name,
      reason: params.reason,
    });
  } catch (error) {
    console.error('Error sending billing hold notification:', error);
  }
}

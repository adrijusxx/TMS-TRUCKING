/**
 * Email Notification Service
 * 
 * Handles sending email notifications based on user preferences
 */

import { prisma } from '../prisma';
import { EmailService } from '../services/EmailService';
import { logger } from '../utils/logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email notification via Resend (EmailService).
 */
async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    return await EmailService.sendEmail({
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  } catch (error) {
    logger.error('Email sending error', { error: error instanceof Error ? error.message : String(error) });
    return false;
  }
}

/**
 * Check if user wants to receive email notifications for a specific type
 */
async function shouldSendEmail(
  userId: string,
  notificationType: string
): Promise<boolean> {
  const preferences = await prisma.notificationPreferences.findUnique({
    where: { userId },
  });

  if (!preferences || !preferences.emailEnabled) {
    return false;
  }

  // Map notification types to preference fields
  const typeMap: Record<string, keyof typeof preferences> = {
    LOAD_ASSIGNED: 'loadAssigned',
    LOAD_UPDATED: 'loadUpdated',
    LOAD_DELIVERED: 'loadDelivered',
    LOAD_CANCELLED: 'loadCancelled',
    MAINTENANCE_DUE: 'maintenanceDue',
    MAINTENANCE_COMPLETED: 'maintenanceCompleted',
    HOS_VIOLATION: 'hosViolation',
    DOCUMENT_EXPIRING: 'documentExpiring',
    INVOICE_PAID: 'invoicePaid',
    INVOICE_CREATED: 'invoiceCreated',
    INVOICE_OVERDUE: 'invoiceOverdue',
    SETTLEMENT_APPROVED: 'settlementApproved',
    SETTLEMENT_PAID: 'settlementPaid',
    TRUCK_OUT_OF_SERVICE: 'truckOutOfService',
    RATE_CON_MISSING: 'rateConMissing',
    SYSTEM_ALERT: 'systemAlert',
  };

  const preferenceField = typeMap[notificationType];
  if (!preferenceField) {
    return false; // Unknown notification type
  }

  return preferences[preferenceField] === true;
}

/**
 * Send notification email if user preferences allow
 */
export async function sendNotificationEmail(
  userId: string,
  notificationType: string,
  options: Omit<EmailOptions, 'to'>
): Promise<boolean> {
  const shouldSend = await shouldSendEmail(userId, notificationType);
  if (!shouldSend) {
    return false; // User has disabled this notification type
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user?.email) {
    return false; // No email address
  }

  return await sendEmail({
    ...options,
    to: user.email,
  });
}

/**
 * Email templates
 */
export const emailTemplates = {
  loadAssigned: (loadNumber: string, customerName: string, pickupCity: string, deliveryCity: string) => ({
    subject: `Load ${loadNumber} Assigned`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Load Assigned</h2>
        <p>You have been assigned a new load:</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Load Number:</strong> ${loadNumber}</p>
          <p><strong>Customer:</strong> ${customerName}</p>
          <p><strong>Route:</strong> ${pickupCity} → ${deliveryCity}</p>
        </div>
        <p>Please review the load details in your dashboard.</p>
      </div>
    `,
    text: `Load ${loadNumber} has been assigned to you. Customer: ${customerName}, Route: ${pickupCity} → ${deliveryCity}`,
  }),

  loadUpdated: (loadNumber: string, status: string) => ({
    subject: `Load ${loadNumber} Updated`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Load Updated</h2>
        <p>The status of load <strong>${loadNumber}</strong> has been updated to <strong>${status}</strong>.</p>
        <p>Please check your dashboard for details.</p>
      </div>
    `,
    text: `Load ${loadNumber} status updated to ${status}`,
  }),

  hosViolation: (driverName: string, violationType: string) => ({
    subject: `HOS Violation Alert: ${driverName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">HOS Violation Alert</h2>
        <p><strong>Driver:</strong> ${driverName}</p>
        <p><strong>Violation Type:</strong> ${violationType}</p>
        <p style="color: #dc2626;">Immediate action required. Please review the driver's HOS status.</p>
      </div>
    `,
    text: `HOS Violation Alert: ${driverName} - ${violationType}`,
  }),

  maintenanceDue: (truckNumber: string, maintenanceType: string, dueDate: string) => ({
    subject: `Maintenance Due: ${truckNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Maintenance Due</h2>
        <p>Truck <strong>${truckNumber}</strong> has maintenance due:</p>
        <div style="background: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Type:</strong> ${maintenanceType}</p>
          <p><strong>Due Date:</strong> ${dueDate}</p>
        </div>
        <p>Please schedule maintenance as soon as possible.</p>
      </div>
    `,
    text: `Maintenance due for truck ${truckNumber}: ${maintenanceType} - Due: ${dueDate}`,
  }),

  invoicePaid: (invoiceNumber: string, amount: number) => ({
    subject: `Invoice ${invoiceNumber} Paid`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Invoice Paid</h2>
        <p>Invoice <strong>${invoiceNumber}</strong> has been marked as paid.</p>
        <div style="background: #d1fae5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
        </div>
      </div>
    `,
    text: `Invoice ${invoiceNumber} paid: $${amount.toFixed(2)}`,
  }),

  documentExpiring: (documentType: string, entityName: string, expiryDate: string) => ({
    subject: `Document Expiring: ${documentType}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Document Expiring Soon</h2>
        <p>The following document is expiring soon:</p>
        <div style="background: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Type:</strong> ${documentType}</p>
          <p><strong>Entity:</strong> ${entityName}</p>
          <p><strong>Expiry Date:</strong> ${expiryDate}</p>
        </div>
        <p>Please renew this document before it expires.</p>
      </div>
    `,
    text: `Document expiring: ${documentType} for ${entityName} - Expires: ${expiryDate}`,
  }),

  systemAlert: (title: string, message: string) => ({
    subject: `System Alert: ${title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>System Alert</h2>
        <p><strong>${title}</strong></p>
        <p>${message}</p>
      </div>
    `,
    text: `System Alert: ${title} - ${message}`,
  }),

  loadDelivered: (loadNumber: string, deliveryCity: string, deliveryState: string) => ({
    subject: `Load ${loadNumber} Delivered`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Load Delivered</h2>
        <p>Load <strong>${loadNumber}</strong> has been delivered to <strong>${deliveryCity}, ${deliveryState}</strong>.</p>
      </div>
    `,
    text: `Load ${loadNumber} delivered to ${deliveryCity}, ${deliveryState}`,
  }),

  loadCancelled: (loadNumber: string) => ({
    subject: `Load ${loadNumber} Cancelled`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Load Cancelled</h2>
        <p>Load <strong>${loadNumber}</strong> has been cancelled.</p>
      </div>
    `,
    text: `Load ${loadNumber} has been cancelled`,
  }),

  invoiceCreated: (invoiceNumber: string, customerName: string, amount: number) => ({
    subject: `Invoice ${invoiceNumber} Created`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Invoice Created</h2>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Invoice:</strong> ${invoiceNumber}</p>
          <p><strong>Customer:</strong> ${customerName}</p>
          <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
        </div>
      </div>
    `,
    text: `Invoice ${invoiceNumber} created for ${customerName}: $${amount.toFixed(2)}`,
  }),

  invoiceOverdue: (invoiceNumber: string, customerName: string, amount: number, daysPastDue: number) => ({
    subject: `Invoice ${invoiceNumber} Overdue`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Invoice Overdue</h2>
        <div style="background: #fee2e2; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Invoice:</strong> ${invoiceNumber}</p>
          <p><strong>Customer:</strong> ${customerName}</p>
          <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
          <p><strong>Days Past Due:</strong> ${daysPastDue}</p>
        </div>
      </div>
    `,
    text: `Invoice ${invoiceNumber} overdue by ${daysPastDue} days: $${amount.toFixed(2)}`,
  }),

  settlementApproved: (settlementNumber: string, netPay: number) => ({
    subject: `Settlement ${settlementNumber} Approved`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Settlement Approved</h2>
        <p>Settlement <strong>${settlementNumber}</strong> has been approved.</p>
        <div style="background: #d1fae5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Net Pay:</strong> $${netPay.toFixed(2)}</p>
        </div>
      </div>
    `,
    text: `Settlement ${settlementNumber} approved. Net pay: $${netPay.toFixed(2)}`,
  }),

  settlementPaid: (settlementNumber: string, amount: number) => ({
    subject: `Settlement ${settlementNumber} Paid`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Settlement Paid</h2>
        <p>Settlement <strong>${settlementNumber}</strong> has been paid.</p>
        <div style="background: #d1fae5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
        </div>
      </div>
    `,
    text: `Settlement ${settlementNumber} paid: $${amount.toFixed(2)}`,
  }),

  truckOutOfService: (truckNumber: string, reason?: string) => ({
    subject: `Truck ${truckNumber} Out of Service`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Truck Out of Service</h2>
        <p>Truck <strong>${truckNumber}</strong> has been marked out of service.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      </div>
    `,
    text: `Truck ${truckNumber} out of service${reason ? `: ${reason}` : ''}`,
  }),

  rateConMissing: (loadNumber: string, customerName: string) => ({
    subject: `Rate Con Missing: Load ${loadNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Rate Confirmation Missing</h2>
        <p>Load <strong>${loadNumber}</strong> (${customerName}) was delivered but has no rate confirmation document uploaded.</p>
        <p>Please upload the rate confirmation as soon as possible.</p>
      </div>
    `,
    text: `Rate con missing for load ${loadNumber} (${customerName})`,
  }),

  maintenanceCompleted: (truckNumber: string, maintenanceType: string) => ({
    subject: `Maintenance Completed: ${truckNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Maintenance Completed</h2>
        <p>${maintenanceType} maintenance on truck <strong>${truckNumber}</strong> has been completed.</p>
      </div>
    `,
    text: `Maintenance completed: ${maintenanceType} on truck ${truckNumber}`,
  }),
};


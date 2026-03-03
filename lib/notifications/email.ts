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
    MAINTENANCE_DUE: 'maintenanceDue',
    HOS_VIOLATION: 'hosViolation',
    DOCUMENT_EXPIRING: 'documentExpiring',
    INVOICE_PAID: 'invoicePaid',
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
};


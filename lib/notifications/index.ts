/**
 * Notification System — Barrel Export
 *
 * Re-exports all notification triggers and helpers from domain-specific files.
 */

// Helpers
export { createNotification, notifyUsersByRole, notifyWithEmail } from './helpers';

// Load triggers
export {
  notifyLoadAssigned,
  notifyLoadStatusChanged,
  notifyLoadDelivered,
  notifyLoadCancelled,
  notifyRateConMissing,
} from './triggers/load-triggers';

// Safety triggers
export {
  notifyHOSViolation,
  notifyDocumentExpiring,
} from './triggers/safety-triggers';

// Fleet triggers
export {
  notifyMaintenanceDue,
  notifyMaintenanceCompleted,
  notifyTruckOutOfService,
} from './triggers/fleet-triggers';

// Accounting triggers
export {
  notifyInvoicePaid,
  notifyInvoiceCreated,
  notifyInvoiceOverdue,
  notifySettlementGenerated,
  notifySettlementApproved,
  notifySettlementPaid,
  notifyDetentionDetected,
  notifyBillingHold,
} from './triggers/accounting-triggers';

// CRM triggers
export {
  notifyFollowUpDue,
  notifyLeadSLABreach,
  notifyNewApplication,
} from './crm-triggers';

// Email
export { sendNotificationEmail, emailTemplates } from './email';

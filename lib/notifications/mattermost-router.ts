/**
 * Mattermost Notification Router
 *
 * Central routing layer that decides whether a Mattermost notification
 * should be posted immediately (critical) or batched via Inngest (routine).
 *
 * Triggers swap their direct `getMattermostNotificationService().notifyXxx()` calls
 * for the corresponding `routeXxx()` function from this file.
 */

import { inngest } from '@/lib/inngest/client';
import { getMattermostNotificationService } from '@/lib/services/MattermostNotificationService';

type AlertCategory = 'dispatch' | 'safety' | 'maintenance' | 'accounting' | 'fleet' | 'recruiting';

interface RouteOptions {
  category: AlertCategory;
  icon: string;
  title: string;
  lines: string[];
  immediate?: boolean;
}

async function routeToMattermost(opts: RouteOptions): Promise<void> {
  try {
    if (opts.immediate) {
      const header = `### ${opts.icon} ${opts.title}\n\n`;
      const body = opts.lines.map((l) => `**${l}**`).join('\n');
      await getMattermostNotificationService().postDigest(opts.category, header + body);
    } else {
      await inngest.send({
        name: 'mattermost/notification.queued',
        data: {
          category: opts.category,
          icon: opts.icon,
          title: opts.title,
          lines: opts.lines,
        },
      });
    }
  } catch (error) {
    console.error(`[MattermostRouter] Failed to route ${opts.title}:`, error);
  }
}

// ── Critical (immediate) ────────────────────────────────────────

export async function routeBreakdown(data: {
  truckNumber: string; driverName: string; description: string; locationLabel?: string;
}): Promise<void> {
  await routeToMattermost({
    category: 'maintenance', icon: ':rotating_light:', title: 'NEW BREAKDOWN REPORTED', immediate: true,
    lines: [`Truck: ${data.truckNumber}`, `Driver: ${data.driverName}`, `Location: ${data.locationLabel || 'Unknown'}`, data.description],
  });
}

export async function routeSafetyCritical(data: {
  truckNumber: string; score: number; reason: string;
}): Promise<void> {
  await routeToMattermost({
    category: 'safety', icon: ':warning:', title: 'SAFETY CRITICAL ALERT', immediate: true,
    lines: [`Truck ${data.truckNumber} score: ${data.score}`, data.reason],
  });
}

export async function routeHOSViolation(data: {
  driverName: string; driverNumber: string; violationType: string;
}): Promise<void> {
  await routeToMattermost({
    category: 'safety', icon: ':warning:', title: 'HOS VIOLATION', immediate: true,
    lines: [`${data.driverName} (#${data.driverNumber})`, data.violationType],
  });
}

export async function routeFuelTheft(data: {
  truckNumber: string; driverName: string; location: string; distance: number;
}): Promise<void> {
  await routeToMattermost({
    category: 'accounting', icon: ':rotating_light:', title: 'FUEL THEFT ALERT', immediate: true,
    lines: [`Truck: ${data.truckNumber}`, `Driver: ${data.driverName}`, `Location: ${data.location}`, `GPS Gap: ${data.distance.toFixed(1)}km`],
  });
}

export async function routeFaultCode(data: {
  truckNumber: string; faultCode: string; description: string; severity: string;
}): Promise<void> {
  const immediate = data.severity === 'CRITICAL';
  await routeToMattermost({
    category: 'maintenance', icon: immediate ? ':rotating_light:' : ':wrench:', title: 'ENGINE FAULT', immediate,
    lines: [`Truck: ${data.truckNumber}`, `Code: ${data.faultCode} (${data.severity})`, data.description],
  });
}

// ── Batchable (dispatch) ────────────────────────────────────────

export async function routeLoadAssigned(data: {
  loadNumber: string; driverName: string; pickupCity: string; pickupState: string; deliveryCity: string; deliveryState: string;
}): Promise<void> {
  await routeToMattermost({
    category: 'dispatch', icon: ':truck:', title: 'LOAD ASSIGNED',
    lines: [`#${data.loadNumber} → ${data.driverName}`, `${data.pickupCity}, ${data.pickupState} → ${data.deliveryCity}, ${data.deliveryState}`],
  });
}

export async function routeLoadStatusChanged(data: {
  loadNumber: string; oldStatus: string; newStatus: string; driverName?: string;
}): Promise<void> {
  const driver = data.driverName ? ` (${data.driverName})` : '';
  await routeToMattermost({
    category: 'dispatch', icon: ':arrows_counterclockwise:', title: 'STATUS',
    lines: [`#${data.loadNumber} ${data.oldStatus} → ${data.newStatus}${driver}`],
  });
}

export async function routeLoadDelivered(data: {
  loadNumber: string; customerName: string; deliveryCity: string; deliveryState: string; driverName?: string;
}): Promise<void> {
  const lines = [`#${data.loadNumber} to ${data.deliveryCity}, ${data.deliveryState} (${data.customerName})`];
  if (data.driverName) lines.push(`Driver: ${data.driverName}`);
  await routeToMattermost({ category: 'dispatch', icon: ':white_check_mark:', title: 'DELIVERED', lines });
}

export async function routeLoadCancelled(data: {
  loadNumber: string; customerName: string; driverName?: string;
}): Promise<void> {
  const lines = [`#${data.loadNumber} (${data.customerName})`];
  if (data.driverName) lines.push(`Driver: ${data.driverName}`);
  await routeToMattermost({ category: 'dispatch', icon: ':x:', title: 'CANCELLED', lines });
}

export async function routeRateConMissing(data: {
  loadNumber: string; customerName: string;
}): Promise<void> {
  await routeToMattermost({
    category: 'dispatch', icon: ':page_facing_up:', title: 'RATE CON MISSING',
    lines: [`#${data.loadNumber} (${data.customerName})`],
  });
}

export async function routeDetentionStart(data: {
  loadNumber: string; location: string; driverName: string;
}): Promise<void> {
  await routeToMattermost({
    category: 'dispatch', icon: ':clock3:', title: 'DETENTION STARTED',
    lines: [`#${data.loadNumber}`, `${data.location}`, `Driver: ${data.driverName}`],
  });
}

export async function routeDetentionDetected(data: {
  loadNumber: string; location: string; customerName: string; detentionHours: number; estimatedCharge: number; driverLate?: boolean;
}): Promise<void> {
  const lateTag = data.driverLate ? ' [DRIVER LATE]' : '';
  await routeToMattermost({
    category: 'dispatch', icon: ':clock3:', title: `DETENTION${lateTag}`,
    lines: [`#${data.loadNumber} at ${data.location} (${data.customerName})`, `${data.detentionHours.toFixed(1)}h · $${data.estimatedCharge.toFixed(2)}`],
  });
}

export async function routeGeofenceArrival(data: {
  truckNumber: string; geofenceName: string; geofenceType: string; loadNumber?: string;
}): Promise<void> {
  const lines = [`${data.truckNumber} at ${data.geofenceName} (${data.geofenceType})`];
  if (data.loadNumber) lines.push(`Load: #${data.loadNumber}`);
  await routeToMattermost({ category: 'dispatch', icon: ':round_pushpin:', title: 'GEOFENCE ENTRY', lines });
}

// ── Batchable (safety) ──────────────────────────────────────────

export async function routeDocumentExpiring(data: {
  entityType: string; entityName: string; documentType: string; expiryDate: string;
}): Promise<void> {
  await routeToMattermost({
    category: 'safety', icon: ':page_facing_up:', title: 'DOC EXPIRING',
    lines: [`${data.entityType}: ${data.entityName}`, `${data.documentType} expires ${data.expiryDate}`],
  });
}

// ── Batchable (accounting) ──────────────────────────────────────

export async function routeSettlementReady(data: {
  settlementNumber: string; driverName: string; netPay: number;
}): Promise<void> {
  await routeToMattermost({
    category: 'accounting', icon: ':money_with_wings:', title: 'SETTLEMENT READY',
    lines: [`${data.settlementNumber} · ${data.driverName} · $${data.netPay.toFixed(2)}`],
  });
}

export async function routeSettlementApproved(data: {
  settlementNumber: string; driverName: string; netPay: number;
}): Promise<void> {
  await routeToMattermost({
    category: 'accounting', icon: ':white_check_mark:', title: 'SETTLEMENT APPROVED',
    lines: [`${data.settlementNumber} · ${data.driverName} · $${data.netPay.toFixed(2)}`],
  });
}

export async function routeSettlementPaid(data: {
  settlementNumber: string; driverName: string; netPay: number;
}): Promise<void> {
  await routeToMattermost({
    category: 'accounting', icon: ':moneybag:', title: 'SETTLEMENT PAID',
    lines: [`${data.settlementNumber} · ${data.driverName} · $${data.netPay.toFixed(2)}`],
  });
}

export async function routeInvoicePaid(data: {
  invoiceNumber: string; customerName: string; amount: number;
}): Promise<void> {
  await routeToMattermost({
    category: 'accounting', icon: ':white_check_mark:', title: 'INVOICE PAID',
    lines: [`${data.invoiceNumber} · ${data.customerName} · $${data.amount.toFixed(2)}`],
  });
}

export async function routeInvoiceCreated(data: {
  invoiceNumber: string; customerName: string; amount: number;
}): Promise<void> {
  await routeToMattermost({
    category: 'accounting', icon: ':receipt:', title: 'INVOICE CREATED',
    lines: [`${data.invoiceNumber} · ${data.customerName} · $${data.amount.toFixed(2)}`],
  });
}

export async function routeInvoiceOverdue(data: {
  invoiceNumber: string; customerName: string; amount: number; daysPastDue: number;
}): Promise<void> {
  await routeToMattermost({
    category: 'accounting', icon: ':warning:', title: 'INVOICE OVERDUE',
    lines: [`${data.invoiceNumber} · ${data.customerName} · $${data.amount.toFixed(2)} · ${data.daysPastDue} days past due`],
  });
}

export async function routeBillingHold(data: {
  loadNumber: string; customerName: string; reason: string;
}): Promise<void> {
  await routeToMattermost({
    category: 'accounting', icon: ':no_entry_sign:', title: 'BILLING HOLD',
    lines: [`#${data.loadNumber} · ${data.customerName}`, data.reason],
  });
}

// ── Batchable (fleet) ───────────────────────────────────────────

export async function routeDormantEquipment(data: {
  type: string; number: string; daysSinceLastLoad: number;
}): Promise<void> {
  await routeToMattermost({
    category: 'fleet', icon: ':zzz:', title: `DORMANT ${data.type.toUpperCase()}`,
    lines: [`${data.number} · ${data.daysSinceLastLoad} days idle`],
  });
}

export async function routeDriverIdle(data: {
  driverName: string; driverNumber: string; idleHours: number;
}): Promise<void> {
  await routeToMattermost({
    category: 'fleet', icon: ':zzz:', title: 'DRIVER IDLE',
    lines: [`${data.driverName} (#${data.driverNumber}) · ${Math.round(data.idleHours)}h idle`],
  });
}

export async function routeTruckOutOfService(data: {
  truckNumber: string; reason?: string;
}): Promise<void> {
  const lines = [data.truckNumber];
  if (data.reason) lines.push(data.reason);
  await routeToMattermost({ category: 'fleet', icon: ':no_entry:', title: 'TRUCK OOS', lines });
}

export async function routeMaintenanceDue(data: {
  truckNumber: string; maintenanceType: string; dueDate: string;
}): Promise<void> {
  await routeToMattermost({
    category: 'maintenance', icon: ':wrench:', title: 'MAINTENANCE DUE',
    lines: [`${data.truckNumber} · ${data.maintenanceType} · due ${data.dueDate}`],
  });
}

export async function routeMaintenanceCompleted(data: {
  truckNumber: string; maintenanceType: string;
}): Promise<void> {
  await routeToMattermost({
    category: 'maintenance', icon: ':white_check_mark:', title: 'MAINTENANCE DONE',
    lines: [`${data.truckNumber} · ${data.maintenanceType}`],
  });
}

// ── Batchable (recruiting) ──────────────────────────────────────

export async function routeFollowUpDue(data: {
  leadName: string; leadNumber: string; note?: string;
}): Promise<void> {
  const lines = [`${data.leadName} (${data.leadNumber})`];
  if (data.note) lines.push(data.note);
  await routeToMattermost({ category: 'recruiting', icon: ':bell:', title: 'FOLLOW-UP DUE', lines });
}

export async function routeLeadSLABreach(data: {
  leadName: string; leadNumber: string; status: string; daysSinceEntry: number; threshold: number;
}): Promise<void> {
  await routeToMattermost({
    category: 'recruiting', icon: ':rotating_light:', title: 'SLA BREACH',
    lines: [`${data.leadName} (${data.leadNumber})`, `${data.status.replace(/_/g, ' ')} · ${data.daysSinceEntry}d (SLA: ${data.threshold}d)`],
  });
}

export async function routeNewApplication(data: {
  leadName: string; leadNumber: string;
}): Promise<void> {
  await routeToMattermost({
    category: 'recruiting', icon: ':new:', title: 'NEW APPLICATION',
    lines: [`${data.leadName} (${data.leadNumber})`],
  });
}

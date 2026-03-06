/**
 * MattermostNotificationService
 *
 * Routes automated notifications to category-specific Mattermost channels.
 * Falls back to `notificationChannelId` when a category channel is not configured.
 */

import { prisma } from '@/lib/prisma';

type AlertCategory = 'dispatch' | 'safety' | 'maintenance' | 'accounting' | 'fleet';

export class MattermostNotificationService {
  // ── Channel routing ────────────────────────────────────────────

  private async getChannelId(category: AlertCategory): Promise<string | null> {
    const settings = await prisma.mattermostSettings.findFirst();
    if (!settings) return null;

    const channelMap: Record<AlertCategory, string | null> = {
      dispatch: settings.dispatchChannelId,
      safety: settings.safetyChannelId,
      maintenance: settings.maintenanceChannelId,
      accounting: settings.accountingChannelId,
      fleet: settings.fleetChannelId,
    };

    return channelMap[category] || settings.notificationChannelId || null;
  }

  private async postToChannel(category: AlertCategory, message: string): Promise<void> {
    const settings = await prisma.mattermostSettings.findFirst();
    if (!settings?.serverUrl || !settings?.botToken) return;

    const channelId = await this.getChannelId(category);
    if (!channelId) return;

    try {
      const cleanUrl = settings.serverUrl.replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/api/v4/posts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${settings.botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ channel_id: channelId, message }),
      });
      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        console.error(`[Mattermost] Failed to post to ${category}: ${res.status} ${errorText}`);
      }
    } catch (error) {
      console.error(`[Mattermost] Failed to send ${category} notification:`, error);
    }
  }

  // ── Maintenance alerts ─────────────────────────────────────────

  async notifyBreakdown(breakdown: {
    id: string;
    truckNumber: string;
    driverName: string;
    description: string;
    locationLabel?: string;
  }): Promise<void> {
    const message =
      `### :rotating_light: NEW BREAKDOWN REPORTED\n\n` +
      `**Truck:** ${breakdown.truckNumber}\n` +
      `**Driver:** ${breakdown.driverName}\n` +
      `**Location:** ${breakdown.locationLabel || 'Unknown'}\n\n` +
      `**Description:** ${breakdown.description}\n\n` +
      `[View in Dashboard](${process.env.NEXTAUTH_URL || ''}/dashboard/fleet/breakdowns/${breakdown.id})`;

    await this.postToChannel('maintenance', message);
  }

  async notifyFaultCode(truck: {
    truckNumber: string;
    faultCode: string;
    description: string;
    severity: string;
  }): Promise<void> {
    const icon = truck.severity === 'CRITICAL' ? ':rotating_light:' : ':wrench:';
    const message =
      `### ${icon} ENGINE FAULT DETECTED\n\n` +
      `**Truck:** ${truck.truckNumber}\n` +
      `**Code:** ${truck.faultCode}\n` +
      `**Severity:** ${truck.severity}\n` +
      `**Description:** ${truck.description}`;

    await this.postToChannel('maintenance', message);
  }

  // ── Dispatch alerts ────────────────────────────────────────────

  async notifyDetentionStart(load: {
    loadNumber: string;
    location: string;
    driverName: string;
  }): Promise<void> {
    const message =
      `### :clock3: DETENTION AUTOMATION\n\n` +
      `Load **#${load.loadNumber}** has entered geofence at **${load.location}**.\n` +
      `Driver **${load.driverName}** is now on the clock.\n\n` +
      `_Automated status: AT PICKUP/DELIVERY_`;

    await this.postToChannel('dispatch', message);
  }

  async notifyLoadAssigned(load: {
    loadNumber: string;
    driverName: string;
    pickupCity: string;
    pickupState: string;
    deliveryCity: string;
    deliveryState: string;
  }): Promise<void> {
    const message =
      `### :truck: LOAD ASSIGNED\n\n` +
      `**Load:** #${load.loadNumber}\n` +
      `**Driver:** ${load.driverName}\n` +
      `**Route:** ${load.pickupCity}, ${load.pickupState} → ${load.deliveryCity}, ${load.deliveryState}`;

    await this.postToChannel('dispatch', message);
  }

  async notifyLoadStatusChanged(load: {
    loadNumber: string;
    oldStatus: string;
    newStatus: string;
    driverName?: string;
  }): Promise<void> {
    const message =
      `**Load #${load.loadNumber}** status: ${load.oldStatus} → **${load.newStatus}**` +
      (load.driverName ? ` (${load.driverName})` : '');

    await this.postToChannel('dispatch', message);
  }

  async notifyGeofenceArrival(event: {
    truckNumber: string;
    geofenceName: string;
    geofenceType: string;
    loadNumber?: string;
  }): Promise<void> {
    const message =
      `### :round_pushpin: GEOFENCE ENTRY\n\n` +
      `**Truck:** ${event.truckNumber} arrived at **${event.geofenceName}** (${event.geofenceType})` +
      (event.loadNumber ? `\n**Load:** #${event.loadNumber}` : '');

    await this.postToChannel('dispatch', message);
  }

  // ── Safety alerts ──────────────────────────────────────────────

  async notifySafetyCritical(truck: {
    truckNumber: string;
    score: number;
    reason: string;
  }): Promise<void> {
    const message =
      `### :warning: SAFETY CRITICAL ALERT\n\n` +
      `Truck **${truck.truckNumber}** safety score dropped to **${truck.score}**.\n` +
      `**Reason:** ${truck.reason}\n\n` +
      `Immediate intervention recommended.`;

    await this.postToChannel('safety', message);
  }

  async notifyHOSViolation(driver: {
    driverName: string;
    driverNumber: string;
    violationType: string;
  }): Promise<void> {
    const message =
      `### :warning: HOS VIOLATION\n\n` +
      `**Driver:** ${driver.driverName} (#${driver.driverNumber})\n` +
      `**Type:** ${driver.violationType}`;

    await this.postToChannel('safety', message);
  }

  async notifyDocumentExpiring(entity: {
    entityType: string;
    entityName: string;
    documentType: string;
    expiryDate: string;
  }): Promise<void> {
    const message =
      `### :page_facing_up: DOCUMENT EXPIRING\n\n` +
      `**${entity.entityType}:** ${entity.entityName}\n` +
      `**Document:** ${entity.documentType}\n` +
      `**Expires:** ${entity.expiryDate}`;

    await this.postToChannel('safety', message);
  }

  // ── Accounting alerts ──────────────────────────────────────────

  async notifyFuelTheft(alert: {
    truckNumber: string;
    driverName: string;
    location: string;
    distance: number;
  }): Promise<void> {
    const message =
      `### :rotating_light: CRITICAL FUEL THEFT ALERT\n\n` +
      `**Truck:** ${alert.truckNumber}\n` +
      `**Driver:** ${alert.driverName}\n` +
      `**Location:** ${alert.location}\n` +
      `**GPS Gap:** ${alert.distance.toFixed(1)}km\n\n` +
      `The fuel transaction occurred significantly far from the truck's actual GPS location.`;

    await this.postToChannel('accounting', message);
  }

  async notifySettlementReady(settlement: {
    settlementNumber: string;
    driverName: string;
    netPay: number;
  }): Promise<void> {
    const message =
      `### :money_with_wings: SETTLEMENT READY\n\n` +
      `**Settlement:** ${settlement.settlementNumber}\n` +
      `**Driver:** ${settlement.driverName}\n` +
      `**Net Pay:** $${settlement.netPay.toFixed(2)}`;

    await this.postToChannel('accounting', message);
  }

  async notifyBillingHold(load: {
    loadNumber: string;
    customerName: string;
    reason: string;
  }): Promise<void> {
    const message =
      `### :no_entry_sign: BILLING HOLD\n\n` +
      `**Load:** #${load.loadNumber}\n` +
      `**Customer:** ${load.customerName}\n` +
      `**Reason:** ${load.reason}`;

    await this.postToChannel('accounting', message);
  }

  async notifyInvoicePaid(invoice: {
    invoiceNumber: string;
    customerName: string;
    amount: number;
  }): Promise<void> {
    const message =
      `### :white_check_mark: INVOICE PAID\n\n` +
      `**Invoice:** ${invoice.invoiceNumber}\n` +
      `**Customer:** ${invoice.customerName}\n` +
      `**Amount:** $${invoice.amount.toFixed(2)}`;

    await this.postToChannel('accounting', message);
  }

  async notifyDetentionDetected(params: {
    loadNumber: string;
    location: string;
    customerName: string;
    detentionHours: number;
    estimatedCharge: number;
    driverLate?: boolean;
  }): Promise<void> {
    const lateTag = params.driverLate ? ' **[DRIVER LATE]**' : '';
    const message =
      `### :clock3: DETENTION DETECTED${lateTag}\n\n` +
      `**Load:** #${params.loadNumber}\n` +
      `**Location:** ${params.location} (${params.customerName})\n` +
      `**Duration:** ${params.detentionHours.toFixed(1)}h\n` +
      `**Est. Charge:** $${params.estimatedCharge.toFixed(2)}`;

    await this.postToChannel('dispatch', message);
  }

  // ── Fleet alerts ───────────────────────────────────────────────

  async notifyDormantEquipment(equipment: {
    type: string;
    number: string;
    daysSinceLastLoad: number;
  }): Promise<void> {
    const message =
      `### :zzz: DORMANT ${equipment.type.toUpperCase()}\n\n` +
      `**${equipment.type}:** ${equipment.number}\n` +
      `**Idle:** ${equipment.daysSinceLastLoad} days without a load`;

    await this.postToChannel('fleet', message);
  }

  async notifyDriverIdle(driver: {
    driverName: string;
    driverNumber: string;
    idleHours: number;
  }): Promise<void> {
    const message =
      `### :zzz: DRIVER IDLE\n\n` +
      `**Driver:** ${driver.driverName} (#${driver.driverNumber})\n` +
      `**Idle:** ${Math.round(driver.idleHours)} hours without a load`;

    await this.postToChannel('fleet', message);
  }
}

// Singleton helper
let instance: MattermostNotificationService | null = null;
export function getMattermostNotificationService(): MattermostNotificationService {
  if (!instance) {
    instance = new MattermostNotificationService();
  }
  return instance;
}

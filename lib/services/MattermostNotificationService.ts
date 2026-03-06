/**
 * MattermostNotificationService
 *
 * Orchestrates automated notifications for the fleet via Mattermost:
 * - Breakdown alerts to dispatchers
 * - Automated geofence entry/exit messages
 * - Safety score alerts
 * - Fuel theft detection alerts
 */

import { getMattermostService } from './MattermostService';
import { prisma } from '@/lib/prisma';

export class MattermostNotificationService {
  /**
   * Notify dispatchers about a new breakdown
   */
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

    await this.postToNotificationChannel(message);
  }

  /**
   * Automated Detention Alert
   */
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

    await this.postToNotificationChannel(message);
  }

  /**
   * Safety Score Drop Notification
   */
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

    await this.postToNotificationChannel(message);
  }

  /**
   * Fuel Theft Alert
   */
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

    await this.postToNotificationChannel(message);
  }

  /**
   * Send a notification message to the configured notification channel
   */
  private async postToNotificationChannel(
    message: string,
  ): Promise<void> {
    const service = getMattermostService();
    if (!service.isClientConnected()) return;

    const settings = await prisma.mattermostSettings.findFirst();
    if (!settings?.notificationChannelId) return;

    try {
      await service.sendMessage(
        settings.notificationChannelId,
        message,
      );
    } catch (error) {
      console.error(
        '[Mattermost] Failed to send notification:',
        error,
      );
    }
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

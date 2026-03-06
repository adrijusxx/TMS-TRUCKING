/**
 * NotificationManager
 *
 * Unified notification orchestrator that routes messages to the
 * appropriate channel(s) based on user preferences and notification type.
 * Channels: Email (Resend), Mattermost, In-App (ActivityLog).
 */

import { prisma } from '@/lib/prisma';
import { EmailService } from '@/lib/services/EmailService';
import { MattermostNotificationService } from '@/lib/services/MattermostNotificationService';
import { logger } from '@/lib/utils/logger';
import type { UserRole } from '@prisma/client';

type NotificationChannel = 'email' | 'mattermost' | 'in_app';

type NotificationCategory =
  | 'load_status'
  | 'settlement'
  | 'safety'
  | 'fleet'
  | 'compliance'
  | 'billing'
  | 'system';

interface NotificationPayload {
  /** Who receives the notification */
  userId?: string;
  /** Company scope */
  companyId: string;
  /** Category for routing and preference lookup */
  category: NotificationCategory;
  /** Short title */
  title: string;
  /** Full message body */
  message: string;
  /** Optional link to relevant entity */
  link?: string;
  /** Override channel preferences */
  channels?: NotificationChannel[];
  /** Related entity for activity log */
  entityType?: string;
  entityId?: string;
}

interface NotificationResult {
  sent: NotificationChannel[];
  failed: NotificationChannel[];
}

export class NotificationManager {
  private static mattermostService = new MattermostNotificationService();

  /**
   * Send a notification via all applicable channels.
   */
  static async send(payload: NotificationPayload): Promise<NotificationResult> {
    const result: NotificationResult = { sent: [], failed: [] };
    const channels = payload.channels ?? ['in_app', 'email'];

    for (const channel of channels) {
      try {
        switch (channel) {
          case 'in_app':
            await this.sendInApp(payload);
            result.sent.push('in_app');
            break;
          case 'email':
            await this.sendEmail(payload);
            result.sent.push('email');
            break;
          case 'mattermost':
            await this.sendMattermost(payload);
            result.sent.push('mattermost');
            break;
        }
      } catch (error) {
        logger.error(`Notification failed on ${channel}`, {
          category: payload.category,
          error: error instanceof Error ? error.message : String(error),
        });
        result.failed.push(channel);
      }
    }

    return result;
  }

  /**
   * Send to multiple users (e.g., all dispatchers in a company).
   */
  static async sendToRole(
    companyId: string,
    role: UserRole,
    payload: Omit<NotificationPayload, 'userId' | 'companyId'>
  ): Promise<void> {
    const users = await prisma.user.findMany({
      where: { companyId, role, isActive: true, deletedAt: null },
      select: { id: true },
    });

    await Promise.allSettled(
      users.map((user) =>
        this.send({ ...payload, userId: user.id, companyId })
      )
    );
  }

  /**
   * Record in-app notification as an ActivityLog entry.
   */
  private static async sendInApp(payload: NotificationPayload): Promise<void> {
    await prisma.activityLog.create({
      data: {
        companyId: payload.companyId,
        userId: payload.userId,
        action: 'NOTIFICATION',
        entityType: payload.entityType ?? payload.category,
        entityId: payload.entityId,
        description: `${payload.title}: ${payload.message}`,
        metadata: {
          category: payload.category,
          link: payload.link,
        },
      },
    });
  }

  /**
   * Send email notification.
   */
  private static async sendEmail(payload: NotificationPayload): Promise<void> {
    if (!payload.userId) return;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { email: true, firstName: true },
    });

    if (!user?.email) return;

    const linkHtml = payload.link
      ? `<p><a href="${payload.link}">View Details</a></p>`
      : '';

    await EmailService.sendEmail({
      to: user.email,
      subject: `[TMS] ${payload.title}`,
      html: `<h3>${payload.title}</h3><p>${payload.message}</p>${linkHtml}`,
    });
  }

  /**
   * Send Mattermost notification.
   */
  private static async sendMattermost(payload: NotificationPayload): Promise<void> {
    const settings = await prisma.mattermostSettings.findFirst({
      where: { companyId: payload.companyId },
    });

    if (!settings?.adminChatId) return;

    const { getMattermostService } = await import('@/lib/services/MattermostService');
    const mattermost = getMattermostService();
    if (!mattermost.isClientConnected()) return;

    const linkText = payload.link ? `\n[View](${payload.link})` : '';
    const message = `*${payload.title}*\n${payload.message}${linkText}`;

    await mattermost.sendMessage(settings.adminChatId, message, { parseMode: 'markdown' });
  }
}

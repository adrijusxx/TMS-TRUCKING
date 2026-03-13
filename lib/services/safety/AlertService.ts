import { PrismaClient, ComplianceAlert, ComplianceAlertType } from '@prisma/client';
import { APP_NAME } from '@/lib/config/branding';
import { BaseSafetyService } from './BaseSafetyService';
import { EmailService } from '@/lib/services/EmailService';

export class AlertService extends BaseSafetyService {
  constructor(prisma: PrismaClient, companyId: string, mcNumberId?: string) {
    super(prisma, companyId, mcNumberId);
  }

  async createAlert(data: {
    companyId: string;
    alertType: ComplianceAlertType | string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    title: string;
    message: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
    assignedTo?: string;
  }): Promise<ComplianceAlert> {
    const alert = await this.prisma.complianceAlert.create({
      data: {
        companyId: data.companyId,
        alertType: data.alertType as ComplianceAlertType,
        severity: data.severity,
        title: data.title,
        message: data.message,
        relatedEntityType: data.relatedEntityType,
        relatedEntityId: data.relatedEntityId,
        assignedTo: data.assignedTo,
        status: 'ACTIVE'
      }
    });

    // Auto-send email for CRITICAL and HIGH severity alerts
    if (data.severity === 'CRITICAL' || data.severity === 'HIGH') {
      await this.sendCriticalAlertEmail(alert);
    }

    return alert;
  }

  async getActiveAlerts(): Promise<ComplianceAlert[]> {
    if (!this.companyId) {
      throw new Error('Company ID is required');
    }
    return this.prisma.complianceAlert.findMany({
      where: {
        ...this.getCompanyFilter(),
        status: 'ACTIVE'
      },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 100
    });
  }

  async acknowledgeAlert(alertId: string, userId: string): Promise<ComplianceAlert> {
    return this.prisma.complianceAlert.update({
      where: { id: alertId },
      data: {
        acknowledgedAt: new Date(),
        acknowledgedBy: userId
      }
    });
  }

  async resolveAlert(alertId: string, resolvedByUserId: string): Promise<ComplianceAlert> {
    return this.prisma.complianceAlert.update({
      where: { id: alertId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
      }
    });
  }

  async escalateAlert(alertId: string): Promise<ComplianceAlert> {
    const alert = await this.prisma.complianceAlert.findUnique({
      where: { id: alertId },
    });
    if (!alert) throw new Error('Alert not found');

    const severityOrder = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
    const currentIdx = severityOrder.indexOf(alert.severity as typeof severityOrder[number]);
    const newSeverity = currentIdx < severityOrder.length - 1
      ? severityOrder[currentIdx + 1]
      : 'CRITICAL' as const;

    const updated = await this.prisma.complianceAlert.update({
      where: { id: alertId },
      data: { severity: newSeverity },
    });

    await this.sendCriticalAlertEmail(updated);
    return updated;
  }

  async sendCriticalAlertEmail(alert: ComplianceAlert): Promise<void> {
    try {
      // Find safety managers for the company
      const safetyUsers = await this.prisma.user.findMany({
        where: {
          companyId: this.companyId,
          role: { in: ['SAFETY', 'ADMIN', 'SUPER_ADMIN'] },
          isActive: true,
        },
        select: { email: true, firstName: true },
      });

      if (safetyUsers.length === 0) return;

      const emails = safetyUsers.map(u => u.email).filter(Boolean);
      if (emails.length === 0) return;

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: ${alert.severity === 'CRITICAL' ? '#dc2626' : '#f97316'}; color: white; padding: 16px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">⚠️ Safety Alert: ${alert.severity}</h2>
          </div>
          <div style="border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
            <h3 style="margin-top: 0;">${alert.title}</h3>
            <p style="color: #6b7280;">${alert.message}</p>
            <p style="color: #9ca3af; font-size: 14px;">Type: ${alert.alertType} | Created: ${alert.createdAt.toLocaleDateString()}</p>
            <div style="margin-top: 20px;">
              <a href="${appUrl}/dashboard/safety/alerts" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View in Dashboard</a>
            </div>
          </div>
        </div>
      `;

      await EmailService.sendEmail({
        to: emails,
        subject: `[${alert.severity}] Safety Alert: ${alert.title}`,
        html,
      });
    } catch (error) {
      console.error('Failed to send critical alert email:', error);
    }
  }

  async sendDailyDigest(): Promise<void> {
    try {
      const activeAlerts = await this.getActiveAlerts();
      if (activeAlerts.length === 0) return;

      const safetyUsers = await this.prisma.user.findMany({
        where: {
          companyId: this.companyId,
          role: { in: ['SAFETY', 'ADMIN', 'SUPER_ADMIN'] },
          isActive: true,
        },
        select: { email: true },
      });

      const emails = safetyUsers.map(u => u.email).filter(Boolean);
      if (emails.length === 0) return;

      const critical = activeAlerts.filter(a => a.severity === 'CRITICAL').length;
      const high = activeAlerts.filter(a => a.severity === 'HIGH').length;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

      const alertRows = activeAlerts.slice(0, 20).map(a =>
        `<tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${a.severity}</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${a.title}</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${a.alertType}</td></tr>`
      ).join('');

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Daily Safety Alert Digest</h2>
          <p>You have <strong>${activeAlerts.length}</strong> active alerts (${critical} critical, ${high} high priority).</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <thead><tr style="background: #f3f4f6;"><th style="padding: 8px; text-align: left;">Severity</th><th style="padding: 8px; text-align: left;">Title</th><th style="padding: 8px; text-align: left;">Type</th></tr></thead>
            <tbody>${alertRows}</tbody>
          </table>
          <a href="${appUrl}/dashboard/safety/alerts" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">View All Alerts</a>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">This is an automated digest from ${APP_NAME} Safety Module.</p>
        </div>
      `;

      await EmailService.sendEmail({
        to: emails,
        subject: `Safety Daily Digest: ${activeAlerts.length} Active Alerts`,
        html,
      });
    } catch (error) {
      console.error('Failed to send daily digest:', error);
    }
  }
}

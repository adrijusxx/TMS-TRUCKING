import { PrismaClient, ComplianceAlert, ComplianceAlertType, User } from '@prisma/client';
import { BaseSafetyService } from './BaseSafetyService';

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
    return this.prisma.complianceAlert.create({
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

  async sendEmailAlert(to: string, subject: string, body: string) {
    // In a real application, integrate with an email service (e.g., SendGrid, Nodemailer)
    console.log(`Sending email alert to: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);
    // Example: await emailService.sendEmail({ to, subject, body });
  }

  async sendSMSAlert(to: string, message: string) {
    // In a real application, integrate with an SMS service (e.g., Twilio)
    console.log(`Sending SMS alert to: ${to}`);
    console.log(`Message: ${message}`);
    // Example: await smsService.sendSMS({ to, message });
  }
}

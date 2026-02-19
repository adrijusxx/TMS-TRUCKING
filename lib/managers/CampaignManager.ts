/**
 * Campaign Manager
 *
 * Central business logic for SMS/Email campaigns:
 * - CRUD operations for campaigns and recipients
 * - Audience filter resolution (JSON → Prisma where clause)
 * - Template rendering with placeholder substitution
 * - Send execution (SMS via NetSapiens, Email via SES)
 * - Drip step scheduling
 */

import { prisma } from '@/lib/prisma';
import { sendSMS } from '@/lib/integrations/netsapiens/sms';
import { EmailService } from '@/lib/services/EmailService';
import type { CampaignChannel, CampaignRecipientStatus, Prisma } from '@prisma/client';

// Supported placeholders in message templates
const PLACEHOLDERS: Record<string, (lead: LeadData) => string> = {
  '{{firstName}}': (l) => l.firstName || '',
  '{{lastName}}': (l) => l.lastName || '',
  '{{leadNumber}}': (l) => l.leadNumber || '',
  '{{phone}}': (l) => l.phone || '',
  '{{email}}': (l) => l.email || '',
  '{{fullName}}': (l) => `${l.firstName || ''} ${l.lastName || ''}`.trim(),
};

interface LeadData {
  id: string;
  firstName: string;
  lastName: string;
  leadNumber: string;
  phone: string;
  email: string | null;
}

interface AudienceFilter {
  status?: string[];
  source?: string[];
  tags?: string[];
  assignedToId?: string;
  priority?: string[];
}

interface CreateCampaignInput {
  companyId: string;
  name: string;
  description?: string;
  channel: CampaignChannel;
  audienceFilter?: AudienceFilter;
  isDrip: boolean;
  createdById: string;
  steps: { templateId?: string; subject?: string; body?: string; delayDays?: number; delayHours?: number }[];
}

export class CampaignManager {
  /**
   * Create a campaign with steps (does NOT activate or enroll recipients yet)
   */
  static async createCampaign(input: CreateCampaignInput) {
    return prisma.campaign.create({
      data: {
        companyId: input.companyId,
        name: input.name,
        description: input.description,
        channel: input.channel,
        isDrip: input.isDrip,
        audienceFilter: input.audienceFilter as Prisma.InputJsonValue,
        createdById: input.createdById,
        steps: {
          create: input.steps.map((s, i) => ({
            sortOrder: i,
            templateId: s.templateId || null,
            subject: s.subject || null,
            body: s.body || null,
            delayDays: s.delayDays ?? 0,
            delayHours: s.delayHours ?? 0,
          })),
        },
      },
      include: { steps: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  /**
   * Resolve audience filter JSON into matching lead IDs
   */
  static async resolveAudienceFilter(
    filter: AudienceFilter | null | undefined,
    companyId: string
  ): Promise<string[]> {
    const where: Prisma.LeadWhereInput = { companyId, deletedAt: null };

    if (filter?.status?.length) {
      where.status = { in: filter.status as any[] };
    }
    if (filter?.source?.length) {
      where.source = { in: filter.source as any[] };
    }
    if (filter?.priority?.length) {
      where.priority = { in: filter.priority as any[] };
    }
    if (filter?.tags?.length) {
      where.tags = { hasSome: filter.tags };
    }
    if (filter?.assignedToId) {
      where.assignedToId = filter.assignedToId;
    }

    const leads = await prisma.lead.findMany({
      where,
      select: { id: true },
    });
    return leads.map((l) => l.id);
  }

  /**
   * Preview audience count without enrolling
   */
  static async previewAudienceCount(
    filter: AudienceFilter | null | undefined,
    companyId: string,
    channel: CampaignChannel
  ): Promise<{ total: number; withContact: number }> {
    const leadIds = await this.resolveAudienceFilter(filter, companyId);
    if (leadIds.length === 0) return { total: 0, withContact: 0 };

    const contactField = channel === 'SMS' ? 'phone' : 'email';
    const withContact = await prisma.lead.count({
      where: {
        id: { in: leadIds },
        [contactField]: { not: null },
      },
    });

    return { total: leadIds.length, withContact };
  }

  /**
   * Enroll leads as campaign recipients
   */
  static async enrollRecipients(campaignId: string, leadIds: string[]) {
    if (leadIds.length === 0) return;

    // Skip leads already enrolled
    const existing = await prisma.campaignRecipient.findMany({
      where: { campaignId, leadId: { in: leadIds } },
      select: { leadId: true },
    });
    const existingSet = new Set(existing.map((r) => r.leadId));
    const newIds = leadIds.filter((id) => !existingSet.has(id));

    if (newIds.length === 0) return;

    await prisma.campaignRecipient.createMany({
      data: newIds.map((leadId) => ({ campaignId, leadId })),
    });

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { totalRecipients: { increment: newIds.length } },
    });
  }

  /**
   * Activate a campaign: enroll recipients from audience filter, set ACTIVE
   */
  static async activateCampaign(campaignId: string) {
    const campaign = await prisma.campaign.findUniqueOrThrow({
      where: { id: campaignId },
      include: { steps: { orderBy: { sortOrder: 'asc' } } },
    });

    if (campaign.status !== 'DRAFT' && campaign.status !== 'PAUSED') {
      throw new Error(`Cannot activate campaign in ${campaign.status} status`);
    }

    // Enroll from audience filter if not already done
    if (campaign.audienceFilter && campaign.totalRecipients === 0) {
      const leadIds = await this.resolveAudienceFilter(
        campaign.audienceFilter as AudienceFilter,
        campaign.companyId
      );
      await this.enrollRecipients(campaignId, leadIds);
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'ACTIVE' },
    });

    return campaign;
  }

  /**
   * Pause a campaign
   */
  static async pauseCampaign(campaignId: string) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'PAUSED' },
    });
  }

  /**
   * Archive a campaign
   */
  static async archiveCampaign(campaignId: string) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'ARCHIVED' },
    });
  }

  /**
   * Replace placeholders in a message body with lead data
   */
  static renderTemplate(body: string, lead: LeadData): string {
    let rendered = body;
    for (const [placeholder, resolver] of Object.entries(PLACEHOLDERS)) {
      rendered = rendered.replaceAll(placeholder, resolver(lead));
    }
    return rendered;
  }

  /**
   * Resolve the actual message body for a step (template body or inline)
   */
  static async resolveStepContent(step: { templateId: string | null; subject: string | null; body: string | null }) {
    if (step.templateId) {
      const template = await prisma.messageTemplate.findUnique({
        where: { id: step.templateId },
      });
      if (template) {
        return { subject: template.subject, body: template.body };
      }
    }
    return { subject: step.subject, body: step.body };
  }

  /**
   * Execute a single send for one recipient + step
   */
  static async executeSend(
    recipientId: string,
    stepId: string,
    campaignId: string,
    senderId: string
  ): Promise<{ success: boolean; error?: string }> {
    const recipient = await prisma.campaignRecipient.findUniqueOrThrow({
      where: { id: recipientId },
      include: { lead: true, campaign: true },
    });

    const step = await prisma.campaignStep.findUniqueOrThrow({
      where: { id: stepId },
      include: { template: true },
    });

    const { subject, body } = await this.resolveStepContent(step);
    if (!body) {
      return this.recordExecution(recipientId, stepId, 'FAILED', 'No message body');
    }

    const renderedBody = this.renderTemplate(body, recipient.lead as LeadData);
    const renderedSubject = subject ? this.renderTemplate(subject, recipient.lead as LeadData) : undefined;

    const channel = recipient.campaign.channel;
    let sendResult: { success: boolean; error?: string };

    if (channel === 'SMS') {
      if (!recipient.lead.phone) {
        return this.recordExecution(recipientId, stepId, 'FAILED', 'Lead has no phone number');
      }
      // Get sender's PBX extension for SMS
      const sender = await prisma.user.findUnique({
        where: { id: senderId },
        select: { voipConfig: true, companyId: true },
      });
      const voipConfig = sender?.voipConfig as Record<string, any> | null;
      const fromExt = voipConfig?.pbxExtension || voipConfig?.username;
      if (!fromExt) {
        return this.recordExecution(recipientId, stepId, 'FAILED', 'Sender has no PBX extension');
      }
      sendResult = await sendSMS(fromExt, recipient.lead.phone, renderedBody, sender?.companyId);
    } else {
      if (!recipient.lead.email) {
        return this.recordExecution(recipientId, stepId, 'FAILED', 'Lead has no email');
      }
      const ok = await EmailService.sendEmail({
        to: recipient.lead.email,
        subject: renderedSubject || 'Message from our team',
        html: renderedBody,
      });
      sendResult = ok ? { success: true } : { success: false, error: 'Email send failed' };
    }

    const status: CampaignRecipientStatus = sendResult.success ? 'SENT' : 'FAILED';
    await this.recordExecution(recipientId, stepId, status, sendResult.error);

    // Log as LeadActivity
    await prisma.leadActivity.create({
      data: {
        leadId: recipient.leadId,
        type: channel === 'SMS' ? 'SMS' : 'EMAIL',
        content: renderedBody.slice(0, 500),
        userId: senderId,
        metadata: {
          sent: sendResult.success,
          campaignId,
          stepId,
          automated: true,
        },
      },
    });

    // Update lead lastContactedAt on success
    if (sendResult.success) {
      await prisma.lead.update({
        where: { id: recipient.leadId },
        data: { lastContactedAt: new Date() },
      });
    }

    return sendResult;
  }

  /**
   * Record a step execution result and update campaign stats
   */
  private static async recordExecution(
    recipientId: string,
    stepId: string,
    status: CampaignRecipientStatus,
    error?: string
  ) {
    await prisma.campaignStepExecution.upsert({
      where: { recipientId_stepId: { recipientId, stepId } },
      create: {
        recipientId,
        stepId,
        status,
        error: error || null,
        sentAt: status === 'SENT' ? new Date() : null,
      },
      update: {
        status,
        error: error || null,
        sentAt: status === 'SENT' ? new Date() : null,
      },
    });

    // Update recipient status
    await prisma.campaignRecipient.update({
      where: { id: recipientId },
      data: { status },
    });

    // Update campaign stats
    const recipient = await prisma.campaignRecipient.findUnique({
      where: { id: recipientId },
      select: { campaignId: true },
    });
    if (recipient) {
      const field = status === 'SENT' ? 'totalSent' : 'totalFailed';
      await prisma.campaign.update({
        where: { id: recipient.campaignId },
        data: { [field]: { increment: 1 } },
      });
    }

    return { success: status === 'SENT', error };
  }

  /**
   * Schedule the next drip step for a recipient
   */
  static async scheduleNextStep(recipientId: string, campaignId: string) {
    const recipient = await prisma.campaignRecipient.findUniqueOrThrow({
      where: { id: recipientId },
    });

    const steps = await prisma.campaignStep.findMany({
      where: { campaignId },
      orderBy: { sortOrder: 'asc' },
    });

    const nextIndex = recipient.currentStepIndex + 1;
    if (nextIndex >= steps.length) {
      // All steps done — mark recipient complete
      await prisma.campaignRecipient.update({
        where: { id: recipientId },
        data: { status: 'SENT', currentStepIndex: nextIndex },
      });
      return null;
    }

    const nextStep = steps[nextIndex];
    const delayMs = (nextStep.delayDays * 24 * 60 + nextStep.delayHours * 60) * 60 * 1000;
    const nextSendAt = new Date(Date.now() + delayMs);

    await prisma.campaignRecipient.update({
      where: { id: recipientId },
      data: {
        currentStepIndex: nextIndex,
        nextSendAt,
        status: 'PENDING',
      },
    });

    return nextSendAt;
  }

  /**
   * Check if all recipients are done and mark campaign COMPLETED
   */
  static async checkCampaignCompletion(campaignId: string) {
    const pending = await prisma.campaignRecipient.count({
      where: { campaignId, status: 'PENDING' },
    });
    if (pending === 0) {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: 'COMPLETED' },
      });
    }
  }
}

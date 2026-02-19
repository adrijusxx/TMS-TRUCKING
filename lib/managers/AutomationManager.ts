/**
 * Automation Manager
 *
 * Evaluates automation rules when lead events occur.
 * Matches triggers and executes send actions (SMS/Email).
 */

import { prisma } from '@/lib/prisma';
import { sendSMS } from '@/lib/integrations/netsapiens/sms';
import { EmailService } from '@/lib/services/EmailService';
import { CampaignManager } from './CampaignManager';

interface TriggerMetadata {
    fromStatus?: string;
    toStatus?: string;
    tag?: string;
    [key: string]: unknown;
}

interface LeadData {
    id: string;
    firstName: string;
    lastName: string;
    leadNumber: string;
    phone: string;
    email: string | null;
}

export class AutomationManager {
    /**
     * Evaluate all automation rules for a lead event
     */
    static async evaluateLeadEvent(
        leadId: string,
        companyId: string,
        eventType: string,
        metadata?: TriggerMetadata
    ) {
        // Find enabled rules for this company and event type
        const rules = await prisma.automationRule.findMany({
            where: {
                companyId,
                enabled: true,
                triggerType: eventType,
            },
            include: { template: true },
        });

        if (rules.length === 0) return { matched: 0 };

        const lead = await prisma.lead.findUnique({
            where: { id: leadId },
            select: { id: true, firstName: true, lastName: true, leadNumber: true, phone: true, email: true },
        });

        if (!lead) return { matched: 0 };

        let sent = 0;
        for (const rule of rules) {
            if (!this.matchesTrigger(rule.triggerValue as Record<string, any>, metadata)) {
                continue;
            }

            const success = await this.executeRuleAction(rule, lead as LeadData, companyId);
            if (success) sent++;
        }

        return { matched: rules.length, sent };
    }

    /**
     * Check if trigger metadata matches the rule's trigger value
     */
    private static matchesTrigger(
        triggerValue: Record<string, any>,
        metadata?: TriggerMetadata
    ): boolean {
        if (!metadata) return true; // No conditions = always match

        // status_change: match toStatus (and optionally fromStatus)
        if (triggerValue.toStatus) {
            if (metadata.toStatus !== triggerValue.toStatus) return false;
        }
        if (triggerValue.fromStatus) {
            if (metadata.fromStatus !== triggerValue.fromStatus) return false;
        }

        // tag_added: match tag name
        if (triggerValue.tag) {
            if (metadata.tag !== triggerValue.tag) return false;
        }

        return true;
    }

    /**
     * Execute the send action for a matched rule
     */
    private static async executeRuleAction(
        rule: any,
        lead: LeadData,
        companyId: string
    ): Promise<boolean> {
        const body = rule.template?.body || rule.body;
        if (!body) return false;

        const renderedBody = CampaignManager.renderTemplate(body, lead);
        const renderedSubject = (rule.template?.subject || rule.subject)
            ? CampaignManager.renderTemplate(rule.template?.subject || rule.subject, lead)
            : undefined;

        let success = false;

        if (rule.channel === 'SMS') {
            if (!lead.phone) return false;
            // Use a system-level sender — get first user with PBX extension in the company
            const sender = await this.findCompanySender(companyId);
            if (!sender) return false;

            const result = await sendSMS(sender.extension, lead.phone, renderedBody, companyId);
            success = result.success;
        } else {
            if (!lead.email) return false;
            success = await EmailService.sendEmail({
                to: lead.email,
                subject: renderedSubject || 'Message from our team',
                html: renderedBody,
            });
        }

        // Log as LeadActivity
        if (success) {
            await prisma.leadActivity.create({
                data: {
                    leadId: lead.id,
                    type: rule.channel === 'SMS' ? 'SMS' : 'EMAIL',
                    content: renderedBody.slice(0, 500),
                    userId: 'system',
                    metadata: {
                        sent: true,
                        automationRuleId: rule.id,
                        ruleName: rule.name,
                        automated: true,
                    },
                },
            });

            await prisma.lead.update({
                where: { id: lead.id },
                data: { lastContactedAt: new Date() },
            });
        }

        return success;
    }

    /**
     * Find a user with PBX extension in the company to use as SMS sender
     */
    private static async findCompanySender(
        companyId: string
    ): Promise<{ extension: string } | null> {
        const users = await prisma.user.findMany({
            where: { companyId },
            select: { voipConfig: true },
        });

        for (const user of users) {
            const config = user.voipConfig as Record<string, any> | null;
            const ext = config?.pbxExtension || config?.username;
            if (ext) return { extension: ext };
        }

        return null;
    }
}

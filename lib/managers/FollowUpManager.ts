/**
 * FollowUpManager
 *
 * Manages automated follow-up reminders with escalation for CRM leads.
 * Tracks overdue follow-ups, schedules new ones, and escalates leads
 * that haven't been contacted within configurable thresholds.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
import { NotFoundError, ValidationError } from '@/lib/errors';
import type { Prisma } from '@prisma/client';

/** Escalation tiers based on days overdue */
const ESCALATION_TIERS = {
  NOTIFY_ASSIGNEE: 3,
  ESCALATE_MANAGER: 7,
  MARK_AT_RISK: 14,
} as const;

type EscalationLevel = 'NONE' | 'NOTIFY_ASSIGNEE' | 'ESCALATE_MANAGER' | 'AT_RISK';

export interface FollowUpItem {
  id: string;
  leadId: string;
  leadNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  status: string;
  priority: string;
  nextFollowUpDate: Date | null;
  nextFollowUpNote: string | null;
  lastContactedAt: Date | null;
  assignedTo: { id: string; firstName: string; lastName: string } | null;
  daysOverdue: number;
  escalationLevel: EscalationLevel;
}

export interface ScheduleFollowUpInput {
  leadId: string;
  date: Date;
  assigneeId?: string;
  notes?: string;
  companyId: string;
  userId: string;
}

interface EscalationResult {
  total: number;
  notifyAssignee: string[];
  escalateManager: string[];
  markedAtRisk: string[];
}

export class FollowUpManager {
  /**
   * Find leads/prospects with overdue follow-up dates
   */
  static async getOverdueFollowUps(companyId: string): Promise<FollowUpItem[]> {
    const now = new Date();

    const leads = await prisma.lead.findMany({
      where: {
        companyId,
        deletedAt: null,
        nextFollowUpDate: { lt: now },
        status: { notIn: ['HIRED', 'REJECTED'] },
      },
      select: {
        id: true,
        leadNumber: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
        priority: true,
        nextFollowUpDate: true,
        nextFollowUpNote: true,
        lastContactedAt: true,
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { nextFollowUpDate: 'asc' },
    });

    return leads.map((lead) => {
      const daysOverdue = lead.nextFollowUpDate
        ? Math.floor((now.getTime() - lead.nextFollowUpDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        ...lead,
        leadId: lead.id,
        daysOverdue,
        escalationLevel: getEscalationLevel(daysOverdue),
      };
    });
  }

  /**
   * Schedule a follow-up reminder for a lead
   */
  static async scheduleFollowUp(input: ScheduleFollowUpInput) {
    const { leadId, date, assigneeId, notes, companyId, userId } = input;

    if (date <= new Date()) {
      throw new ValidationError('Follow-up date must be in the future');
    }

    const lead = await prisma.lead.findFirst({
      where: { id: leadId, companyId, deletedAt: null },
    });

    if (!lead) {
      throw new NotFoundError('Lead', leadId);
    }

    const updateData: Prisma.LeadUpdateInput = {
      nextFollowUpDate: date,
      nextFollowUpNote: notes || null,
    };

    if (assigneeId) {
      updateData.assignedTo = { connect: { id: assigneeId } };
    }

    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: updateData,
    });

    // Log activity
    await prisma.leadActivity.create({
      data: {
        leadId,
        type: 'NOTE',
        content: `Follow-up scheduled for ${date.toLocaleDateString()}${notes ? `: ${notes}` : ''}`,
        userId,
      },
    });

    logger.info('Follow-up scheduled', { leadId, date: date.toISOString(), assigneeId });
    return updated;
  }

  /**
   * Escalate leads that haven't been contacted within threshold days.
   * - 3+ days overdue: notify assignee
   * - 7+ days overdue: escalate to manager
   * - 14+ days overdue: mark as at-risk (set priority to HOT)
   */
  static async escalateOverdue(
    companyId: string,
    thresholdDays?: number
  ): Promise<EscalationResult> {
    const overdueLeads = await this.getOverdueFollowUps(companyId);
    const result: EscalationResult = {
      total: overdueLeads.length,
      notifyAssignee: [],
      escalateManager: [],
      markedAtRisk: [],
    };

    const threshold = thresholdDays ?? ESCALATION_TIERS.NOTIFY_ASSIGNEE;

    for (const lead of overdueLeads) {
      if (lead.daysOverdue < threshold) continue;

      if (lead.daysOverdue >= ESCALATION_TIERS.MARK_AT_RISK) {
        await markLeadAtRisk(lead.leadId);
        result.markedAtRisk.push(lead.leadId);
      } else if (lead.daysOverdue >= ESCALATION_TIERS.ESCALATE_MANAGER) {
        result.escalateManager.push(lead.leadId);
      } else if (lead.daysOverdue >= ESCALATION_TIERS.NOTIFY_ASSIGNEE) {
        result.notifyAssignee.push(lead.leadId);
      }
    }

    logger.info('Escalation completed', {
      companyId,
      total: result.total,
      atRisk: result.markedAtRisk.length,
      escalated: result.escalateManager.length,
      notified: result.notifyAssignee.length,
    });

    return result;
  }

  /**
   * Get a user's follow-up queue sorted by urgency
   * (overdue first, then by follow-up date ascending)
   */
  static async getFollowUpQueue(userId: string): Promise<FollowUpItem[]> {
    const now = new Date();

    const leads = await prisma.lead.findMany({
      where: {
        assignedToId: userId,
        deletedAt: null,
        nextFollowUpDate: { not: null },
        status: { notIn: ['HIRED', 'REJECTED'] },
      },
      select: {
        id: true,
        leadNumber: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
        priority: true,
        nextFollowUpDate: true,
        nextFollowUpNote: true,
        lastContactedAt: true,
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { nextFollowUpDate: 'asc' },
    });

    return leads
      .map((lead) => {
        const daysOverdue = lead.nextFollowUpDate
          ? Math.max(0, Math.floor((now.getTime() - lead.nextFollowUpDate.getTime()) / (1000 * 60 * 60 * 24)))
          : 0;

        return {
          ...lead,
          leadId: lead.id,
          daysOverdue,
          escalationLevel: getEscalationLevel(daysOverdue),
        };
      })
      .sort((a, b) => {
        // Overdue items first, then by urgency
        if (a.daysOverdue > 0 && b.daysOverdue === 0) return -1;
        if (a.daysOverdue === 0 && b.daysOverdue > 0) return 1;
        if (a.daysOverdue !== b.daysOverdue) return b.daysOverdue - a.daysOverdue;
        // Then by follow-up date
        const aDate = a.nextFollowUpDate?.getTime() ?? Infinity;
        const bDate = b.nextFollowUpDate?.getTime() ?? Infinity;
        return aDate - bDate;
      });
  }
}

/** Determine escalation level from days overdue */
function getEscalationLevel(daysOverdue: number): EscalationLevel {
  if (daysOverdue >= ESCALATION_TIERS.MARK_AT_RISK) return 'AT_RISK';
  if (daysOverdue >= ESCALATION_TIERS.ESCALATE_MANAGER) return 'ESCALATE_MANAGER';
  if (daysOverdue >= ESCALATION_TIERS.NOTIFY_ASSIGNEE) return 'NOTIFY_ASSIGNEE';
  return 'NONE';
}

/** Mark a lead as at-risk by setting priority to HOT */
async function markLeadAtRisk(leadId: string) {
  await prisma.lead.update({
    where: { id: leadId },
    data: { priority: 'HOT' },
  });

  await prisma.leadActivity.create({
    data: {
      leadId,
      type: 'NOTE',
      content: 'Lead automatically marked as at-risk due to 14+ days without follow-up',
      userId: 'SYSTEM',
    },
  });
}

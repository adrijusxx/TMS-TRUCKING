/**
 * IncidentInvestigationManager
 *
 * Manages the lifecycle of safety incident investigations.
 * Status flow: PENDING -> IN_PROGRESS -> COMPLETED (also ON_HOLD)
 *
 * Uses the Manager pattern: static methods, prisma from @/lib/prisma, structured logging.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
import { NotFoundError, ValidationError } from '@/lib/errors/AppError';

export interface StartInvestigationParams {
  incidentId: string;
  investigatorId: string;
  companyId: string;
  dueDate?: Date;
}

export interface CompleteInvestigationParams {
  incidentId: string;
  rootCause: string;
  correctiveActions: string;
  followUpDate?: Date;
  findings?: string;
  recommendations?: string;
  contributingFactors?: string;
}

export interface UpdateInvestigationParams {
  incidentId: string;
  driverInterviewed?: boolean;
  eldDataReviewed?: boolean;
  vehicleExamined?: boolean;
  photosReviewed?: boolean;
  witnessStatementsReviewed?: boolean;
  policeReportReviewed?: boolean;
  contributingFactors?: string;
  rootCause?: string;
  findings?: string;
  correctiveActions?: string;
  recommendations?: string;
}

export interface InvestigationResult {
  id: string;
  incidentId: string;
  status: string;
  investigatorId: string | null;
  rootCause: string | null;
  correctiveActions: string | null;
  assignedDate: Date;
  dueDate: Date | null;
}

export class IncidentInvestigationManager {
  /**
   * Start an investigation for an incident.
   * Transitions the investigation to IN_PROGRESS.
   */
  static async startInvestigation(
    params: StartInvestigationParams
  ): Promise<InvestigationResult> {
    const { incidentId, investigatorId, companyId, dueDate } = params;

    logger.info('Starting investigation', { incidentId, investigatorId });

    // Verify incident exists and belongs to company
    const incident = await prisma.safetyIncident.findFirst({
      where: { id: incidentId, companyId, deletedAt: null },
      include: { investigation: true },
    });

    if (!incident) {
      throw new NotFoundError('SafetyIncident', incidentId);
    }

    if (incident.investigation?.status === 'COMPLETED') {
      throw new ValidationError('Investigation is already completed', {
        incidentId,
        currentStatus: incident.investigation.status,
      });
    }

    // Calculate default due date: 30 days from now
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 30);

    const investigation = await prisma.investigation.upsert({
      where: { incidentId },
      update: {
        investigatorId,
        status: 'IN_PROGRESS',
        assignedDate: new Date(),
        dueDate: dueDate ?? defaultDueDate,
      },
      create: {
        companyId,
        incidentId,
        investigatorId,
        assignedDate: new Date(),
        dueDate: dueDate ?? defaultDueDate,
        status: 'IN_PROGRESS',
      },
    });

    // Sync status back to the incident
    await prisma.safetyIncident.update({
      where: { id: incidentId },
      data: {
        investigationStatus: 'IN_PROGRESS',
        status: 'UNDER_INVESTIGATION',
        investigatorId,
      },
    });

    logger.info('Investigation started', { investigationId: investigation.id });
    return investigation;
  }

  /**
   * Complete an investigation with root cause and corrective actions.
   */
  static async completeInvestigation(
    params: CompleteInvestigationParams
  ): Promise<InvestigationResult> {
    const { incidentId, rootCause, correctiveActions, followUpDate, findings, recommendations, contributingFactors } = params;

    logger.info('Completing investigation', { incidentId });

    if (!rootCause?.trim()) {
      throw new ValidationError('Root cause is required to complete an investigation');
    }
    if (!correctiveActions?.trim()) {
      throw new ValidationError('Corrective actions are required to complete an investigation');
    }

    const existing = await prisma.investigation.findUnique({
      where: { incidentId },
    });

    if (!existing) {
      throw new NotFoundError('Investigation for incident', incidentId);
    }

    if (existing.status === 'COMPLETED') {
      throw new ValidationError('Investigation is already completed');
    }

    const investigation = await prisma.investigation.update({
      where: { incidentId },
      data: {
        status: 'COMPLETED',
        rootCause,
        correctiveActions,
        findings: findings ?? null,
        recommendations: recommendations ?? null,
        contributingFactors: contributingFactors ?? null,
        dueDate: followUpDate ?? existing.dueDate,
      },
    });

    // Sync status back to the incident
    await prisma.safetyIncident.update({
      where: { id: incidentId },
      data: {
        investigationStatus: 'COMPLETED',
        status: 'INVESTIGATION_COMPLETE',
        rootCause,
        correctiveActions,
      },
    });

    logger.info('Investigation completed', { investigationId: investigation.id });
    return investigation;
  }

  /**
   * Update investigation progress (evidence gathering steps).
   */
  static async updateProgress(params: UpdateInvestigationParams): Promise<InvestigationResult> {
    const { incidentId, ...updates } = params;

    const existing = await prisma.investigation.findUnique({
      where: { incidentId },
    });

    if (!existing) {
      throw new NotFoundError('Investigation for incident', incidentId);
    }

    if (existing.status === 'COMPLETED') {
      throw new ValidationError('Cannot update a completed investigation');
    }

    const investigation = await prisma.investigation.update({
      where: { incidentId },
      data: updates,
    });

    logger.debug('Investigation progress updated', { investigationId: investigation.id });
    return investigation;
  }

  /**
   * Put investigation on hold (e.g. waiting for external info).
   */
  static async putOnHold(incidentId: string, reason?: string): Promise<InvestigationResult> {
    const existing = await prisma.investigation.findUnique({ where: { incidentId } });
    if (!existing) throw new NotFoundError('Investigation for incident', incidentId);

    const investigation = await prisma.investigation.update({
      where: { incidentId },
      data: { status: 'ON_HOLD' },
    });

    logger.info('Investigation put on hold', { investigationId: investigation.id, reason });
    return investigation;
  }

  /**
   * Fetch an investigation by incident ID with full relations.
   */
  static async getByIncidentId(incidentId: string) {
    return prisma.investigation.findUnique({
      where: { incidentId },
      include: {
        incident: {
          include: {
            driver: { include: { user: { select: { firstName: true, lastName: true } } } },
            truck: { select: { truckNumber: true } },
          },
        },
        documents: true,
      },
    });
  }

  /**
   * Get overdue investigations for a company.
   */
  static async getOverdue(companyId: string) {
    return prisma.investigation.findMany({
      where: {
        companyId,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        dueDate: { lt: new Date() },
        deletedAt: null,
      },
      include: {
        incident: {
          include: {
            driver: { include: { user: { select: { firstName: true, lastName: true } } } },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }
}

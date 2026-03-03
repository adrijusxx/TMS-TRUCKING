/**
 * BackgroundCheckManager
 *
 * Manages background check records for CRM leads using LeadActivity
 * entries with BACKGROUND_CHECK type and structured JSON metadata.
 * Supports MVR, criminal, employment history, drug test, and credit checks.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
import { NotFoundError, ValidationError, ConflictError } from '@/lib/errors';

export const CHECK_TYPES = [
  'MVR',
  'CRIMINAL',
  'EMPLOYMENT_HISTORY',
  'DRUG_TEST',
  'CREDIT',
] as const;
export type BackgroundCheckType = typeof CHECK_TYPES[number];

export const CHECK_STATUSES = [
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'FAILED',
] as const;
export type BackgroundCheckStatus = typeof CHECK_STATUSES[number];

export interface BackgroundCheckRecord {
  checkId: string;
  leadId: string;
  checkType: BackgroundCheckType;
  status: BackgroundCheckStatus;
  results?: string | null;
  initiatedAt: string;
  completedAt?: string | null;
  initiatedBy: string;
}

/** Metadata shape stored in LeadActivity.metadata */
interface CheckMetadata {
  backgroundCheck: true;
  checkId: string;
  checkType: BackgroundCheckType;
  status: BackgroundCheckStatus;
  results?: string | null;
  completedAt?: string | null;
}

const REQUIRED_CHECK_TYPES: BackgroundCheckType[] = [
  'MVR',
  'CRIMINAL',
  'DRUG_TEST',
];

export class BackgroundCheckManager {
  /**
   * Initiate a new background check for a lead
   */
  static async initiateCheck(
    leadId: string,
    checkType: BackgroundCheckType,
    companyId: string,
    userId: string
  ): Promise<BackgroundCheckRecord> {
    if (!CHECK_TYPES.includes(checkType)) {
      throw new ValidationError(`Invalid check type: ${checkType}`, {
        validTypes: CHECK_TYPES as unknown as string[],
      });
    }

    const lead = await prisma.lead.findFirst({
      where: { id: leadId, companyId, deletedAt: null },
    });
    if (!lead) throw new NotFoundError('Lead', leadId);

    // Check for duplicate active check
    const existing = await getChecksByLead(leadId);
    const activeCheck = existing.find(
      (c) => c.checkType === checkType && c.status !== 'FAILED'
    );
    if (activeCheck) {
      throw new ConflictError(
        `A ${checkType} check already exists for this lead (status: ${activeCheck.status})`
      );
    }

    const checkId = generateCheckId(checkType);

    const activity = await prisma.leadActivity.create({
      data: {
        leadId,
        type: 'NOTE',
        content: `Background check initiated: ${formatCheckType(checkType)}`,
        userId,
        metadata: {
          backgroundCheck: true,
          checkId,
          checkType,
          status: 'PENDING' as BackgroundCheckStatus,
          results: null,
          completedAt: null,
        },
      },
    });

    logger.info('Background check initiated', { leadId, checkType, checkId });

    return {
      checkId,
      leadId,
      checkType,
      status: 'PENDING',
      results: null,
      initiatedAt: activity.createdAt.toISOString(),
      completedAt: null,
      initiatedBy: userId,
    };
  }

  /**
   * Update background check status and optional results
   */
  static async updateCheckStatus(
    checkId: string,
    status: BackgroundCheckStatus,
    results?: string
  ): Promise<BackgroundCheckRecord> {
    if (!CHECK_STATUSES.includes(status)) {
      throw new ValidationError(`Invalid status: ${status}`);
    }

    const activity = await findActivityByCheckId(checkId);
    if (!activity) throw new NotFoundError('Background check', checkId);

    const meta = activity.metadata as unknown as CheckMetadata;
    const updatedMeta: CheckMetadata = {
      ...meta,
      status,
      results: results ?? meta.results ?? null,
      completedAt: status === 'COMPLETED' || status === 'FAILED'
        ? new Date().toISOString()
        : meta.completedAt ?? null,
    };

    await prisma.leadActivity.update({
      where: { id: activity.id },
      data: {
        metadata: updatedMeta as any,
        content: `Background check ${formatCheckType(meta.checkType)}: ${status.toLowerCase()}`,
      },
    });

    logger.info('Background check updated', { checkId, status });

    return {
      checkId: meta.checkId,
      leadId: activity.leadId,
      checkType: meta.checkType,
      status,
      results: updatedMeta.results,
      initiatedAt: activity.createdAt.toISOString(),
      completedAt: updatedMeta.completedAt,
      initiatedBy: activity.userId,
    };
  }

  /**
   * Get all background checks for a lead
   */
  static async getCheckStatus(leadId: string): Promise<BackgroundCheckRecord[]> {
    return getChecksByLead(leadId);
  }

  /**
   * Return true if all required checks (MVR, CRIMINAL, DRUG_TEST) are completed
   */
  static async isCheckComplete(leadId: string): Promise<{
    complete: boolean;
    checks: { type: BackgroundCheckType; status: BackgroundCheckStatus | 'NOT_STARTED' }[];
  }> {
    const records = await getChecksByLead(leadId);

    const checks = REQUIRED_CHECK_TYPES.map((type) => {
      const record = records.find((r) => r.checkType === type);
      return {
        type,
        status: record?.status ?? ('NOT_STARTED' as const),
      };
    });

    const complete = checks.every((c) => c.status === 'COMPLETED');
    return { complete, checks };
  }
}

// --------------- Helpers ---------------

async function getChecksByLead(leadId: string): Promise<BackgroundCheckRecord[]> {
  const activities = await prisma.leadActivity.findMany({
    where: {
      leadId,
      type: 'NOTE',
    },
    orderBy: { createdAt: 'desc' },
  });

  return activities
    .filter((a) => {
      const meta = a.metadata as any;
      return meta?.backgroundCheck === true && meta?.checkId;
    })
    .map((a) => {
      const meta = a.metadata as unknown as CheckMetadata;
      return {
        checkId: meta.checkId,
        leadId: a.leadId,
        checkType: meta.checkType,
        status: meta.status,
        results: meta.results ?? null,
        initiatedAt: a.createdAt.toISOString(),
        completedAt: meta.completedAt ?? null,
        initiatedBy: a.userId,
      };
    });
}

async function findActivityByCheckId(checkId: string) {
  const activities = await prisma.leadActivity.findMany({
    where: { type: 'NOTE' },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return activities.find((a) => {
    const meta = a.metadata as any;
    return meta?.checkId === checkId;
  }) ?? null;
}

function generateCheckId(checkType: BackgroundCheckType): string {
  const prefix = checkType.substring(0, 3).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CHK-${prefix}-${rand}`;
}

function formatCheckType(type: BackgroundCheckType): string {
  const labels: Record<BackgroundCheckType, string> = {
    MVR: 'Motor Vehicle Record',
    CRIMINAL: 'Criminal Background',
    EMPLOYMENT_HISTORY: 'Employment History',
    DRUG_TEST: 'Drug Test',
    CREDIT: 'Credit Check',
  };
  return labels[type] ?? type;
}

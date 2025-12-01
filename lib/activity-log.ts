/**
 * Activity Log Utility
 * 
 * Tracks user actions and system events for audit trails
 */

import { prisma } from './prisma';

type ActivityAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'ASSIGN'
  | 'UNASSIGN'
  | 'STATUS_CHANGE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'EXPORT'
  | 'GENERATE'
  | 'INVOICE_GENERATED'
  | 'SEND'
  | 'APPROVE'
  | 'REJECT'
  | 'AI_SUGGESTION_CREATED'
  | 'AI_SUGGESTION_APPROVED'
  | 'AI_SUGGESTION_REJECTED'
  | 'AI_SUGGESTION_APPLIED';

type EntityType =
  | 'Load'
  | 'Driver'
  | 'Truck'
  | 'Trailer'
  | 'Customer'
  | 'Invoice'
  | 'Settlement'
  | 'Document'
  | 'User'
  | 'Company'
  | 'AISuggestion';

interface CreateActivityLogParams {
  companyId: string;
  userId?: string;
  action: ActivityAction;
  entityType: EntityType;
  entityId?: string;
  description?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an activity log entry
 */
export async function createActivityLog(params: CreateActivityLogParams) {
  try {
    return await prisma.activityLog.create({
      data: {
        companyId: params.companyId,
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        description: params.description,
        metadata: params.metadata || {},
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    // Don't throw - activity logging should not break main functionality
    console.error('Failed to create activity log:', error);
    return null;
  }
}

/**
 * Get activity logs for a company
 */
export async function getActivityLogs(
  companyId: string,
  options?: {
    userId?: string;
    entityType?: EntityType;
    entityId?: string;
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
  }
) {
  const where: any = {
    companyId,
  };

  if (options?.userId) {
    where.userId = options.userId;
  }

  if (options?.entityType) {
    where.entityType = options.entityType;
  }

  if (options?.entityId) {
    where.entityId = options.entityId;
  }

  if (options?.startDate || options?.endDate) {
    where.createdAt = {};
    if (options.startDate) {
      where.createdAt.gte = options.startDate;
    }
    if (options.endDate) {
      where.createdAt.lte = options.endDate;
    }
  }

  return await prisma.activityLog.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: options?.limit || 50,
    skip: options?.offset || 0,
  });
}


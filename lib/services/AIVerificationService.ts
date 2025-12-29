/**
 * AI Verification Service
 * Handles creation, approval, and application of AI suggestions that affect financial data
 */

import { prisma } from '@/lib/prisma';
import { AISuggestionStatus } from '@prisma/client';
import { createActivityLog } from '@/lib/activity-log';

interface CreateSuggestionInput {
  companyId: string;
  suggestionType: string; // e.g., 'RATE_RECOMMENDATION', 'EXPENSE_CATEGORIZATION', 'INVOICE_MATCHING'
  entityType: string; // e.g., 'LOAD', 'INVOICE', 'SETTLEMENT', 'EXPENSE'
  entityId?: string;
  aiConfidence: number; // 0-100
  aiReasoning: string;
  suggestedValue: any; // The suggested financial value(s)
  originalValue?: any; // Original value for comparison
}

interface ApproveSuggestionInput {
  suggestionId: string;
  reviewedById: string;
  approved: boolean;
  rejectionReason?: string;
}

interface ApplySuggestionInput {
  suggestionId: string;
  appliedById: string;
}

export class AIVerificationService {
  /**
   * Create a new AI suggestion requiring approval
   */
  async createSuggestion(input: CreateSuggestionInput, userId?: string) {
    const suggestion = await prisma.aISuggestion.create({
      data: {
        companyId: input.companyId,
        suggestionType: input.suggestionType,
        entityType: input.entityType,
        entityId: input.entityId,
        aiConfidence: input.aiConfidence,
        aiReasoning: input.aiReasoning,
        suggestedValue: input.suggestedValue,
        originalValue: input.originalValue,
        status: AISuggestionStatus.PENDING,
      },
    });

    // Log activity
    if (userId) {
      await createActivityLog({
        companyId: input.companyId,
        userId,
        action: 'AI_SUGGESTION_CREATED',
        entityType: 'AISuggestion',
        entityId: suggestion.id,
        description: `AI suggestion created: ${input.suggestionType} for ${input.entityType}`,
        metadata: {
          suggestionType: input.suggestionType,
          entityType: input.entityType,
          entityId: input.entityId,
          confidence: input.aiConfidence,
        },
      });
    }

    return suggestion;
  }

  /**
   * Approve or reject an AI suggestion
   */
  async approveSuggestion(input: ApproveSuggestionInput) {
    const suggestion = await prisma.aISuggestion.findUnique({
      where: { id: input.suggestionId },
    });

    if (!suggestion) {
      throw new Error('AI suggestion not found');
    }

    if (suggestion.status !== AISuggestionStatus.PENDING) {
      throw new Error(`Cannot approve/reject suggestion with status: ${suggestion.status}`);
    }

    const updated = await prisma.aISuggestion.update({
      where: { id: input.suggestionId },
      data: {
        status: input.approved ? AISuggestionStatus.APPROVED : AISuggestionStatus.REJECTED,
        reviewedById: input.reviewedById,
        reviewedAt: new Date(),
        approved: input.approved,
        rejectionReason: input.rejectionReason || null,
      },
    });

    // Log activity
    await createActivityLog({
      companyId: suggestion.companyId,
      userId: input.reviewedById,
      action: input.approved ? 'AI_SUGGESTION_APPROVED' : 'AI_SUGGESTION_REJECTED',
      entityType: 'AISuggestion',
      entityId: suggestion.id,
      description: input.approved
        ? `AI suggestion approved: ${suggestion.suggestionType}`
        : `AI suggestion rejected: ${suggestion.suggestionType}`,
      metadata: {
        suggestionType: suggestion.suggestionType,
        entityType: suggestion.entityType,
        entityId: suggestion.entityId,
        rejectionReason: input.rejectionReason,
      },
    });

    return updated;
  }

  /**
   * Apply an approved suggestion to the entity
   */
  async applySuggestion(input: ApplySuggestionInput) {
    const suggestion = await prisma.aISuggestion.findUnique({
      where: { id: input.suggestionId },
    });

    if (!suggestion) {
      throw new Error('AI suggestion not found');
    }

    if (suggestion.status !== AISuggestionStatus.APPROVED) {
      throw new Error(`Cannot apply suggestion with status: ${suggestion.status}. Must be APPROVED.`);
    }

    if (!suggestion.approved) {
      throw new Error('Suggestion must be approved before applying');
    }

    // Apply the suggestion based on entity type
    await this.applySuggestionToEntity(suggestion);

    // Mark suggestion as applied
    const updated = await prisma.aISuggestion.update({
      where: { id: input.suggestionId },
      data: {
        status: AISuggestionStatus.APPLIED,
        appliedById: input.appliedById,
        appliedAt: new Date(),
      },
    });

    // Log activity
    await createActivityLog({
      companyId: suggestion.companyId,
      userId: input.appliedById,
      action: 'AI_SUGGESTION_APPLIED',
      entityType: 'AISuggestion',
      entityId: suggestion.id,
      description: `AI suggestion applied: ${suggestion.suggestionType} to ${suggestion.entityType}`,
      metadata: {
        suggestionType: suggestion.suggestionType,
        entityType: suggestion.entityType,
        entityId: suggestion.entityId,
        suggestedValue: suggestion.suggestedValue,
      },
    });

    return updated;
  }

  /**
   * Get pending suggestions for a company
   */
  async getPendingSuggestions(companyId: string, filters?: {
    suggestionType?: string;
    entityType?: string;
    minConfidence?: number;
  }) {
    return await prisma.aISuggestion.findMany({
      where: {
        companyId,
        status: AISuggestionStatus.PENDING,
        ...(filters?.suggestionType && { suggestionType: filters.suggestionType }),
        ...(filters?.entityType && { entityType: filters.entityType }),
        ...(filters?.minConfidence && { aiConfidence: { gte: filters.minConfidence } }),
      },
      include: {
        reviewedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        appliedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [
        { aiConfidence: 'desc' },
        { createdAt: 'asc' },
      ],
    });
  }

  /**
   * Get suggestion by ID
   */
  async getSuggestion(suggestionId: string) {
    return await prisma.aISuggestion.findUnique({
      where: { id: suggestionId },
      include: {
        reviewedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        appliedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Apply suggestion to the actual entity
   */
  private async applySuggestionToEntity(suggestion: any) {
    const { entityType, entityId, suggestedValue } = suggestion;

    switch (entityType) {
      case 'LOAD':
        if (entityId && suggestedValue.revenue !== undefined) {
          await prisma.load.update({
            where: { id: entityId },
            data: {
              revenue: suggestedValue.revenue,
              ...(suggestedValue.driverPay !== undefined && { driverPay: suggestedValue.driverPay }),
              ...(suggestedValue.expenses !== undefined && { expenses: suggestedValue.expenses }),
              ...(suggestedValue.fuelAdvance !== undefined && { fuelAdvance: suggestedValue.fuelAdvance }),
            },
          });
        }
        break;

      case 'INVOICE':
        if (entityId && suggestedValue.total !== undefined) {
          await prisma.invoice.update({
            where: { id: entityId },
            data: {
              subtotal: suggestedValue.subtotal,
              tax: suggestedValue.tax,
              total: suggestedValue.total,
            },
          });
        }
        break;

      case 'EXPENSE':
        if (entityId && suggestedValue.category !== undefined) {
          await prisma.loadExpense.update({
            where: { id: entityId },
            data: {
              category: suggestedValue.category,
              ...(suggestedValue.expenseType !== undefined && { expenseType: suggestedValue.expenseType }),
            },
          });
        }
        break;

      case 'FUEL_ENTRY':
        if (entityId && suggestedValue.costPerGallon !== undefined) {
          await prisma.fuelEntry.update({
            where: { id: entityId },
            data: {
              costPerGallon: suggestedValue.costPerGallon,
              totalCost: suggestedValue.totalCost,
            },
          });
        }
        break;

      case 'MAINTENANCE_RECORD':
        if (entityId && suggestedValue.cost !== undefined) {
          await prisma.maintenanceRecord.update({
            where: { id: entityId },
            data: {
              cost: suggestedValue.cost,
            },
          });
        }
        break;

      default:
        console.warn(`Unknown entity type for suggestion application: ${entityType}`);
    }
  }

  /**
   * Expire old pending suggestions (older than 30 days)
   */
  async expireOldSuggestions(companyId?: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return await prisma.aISuggestion.updateMany({
      where: {
        status: AISuggestionStatus.PENDING,
        createdAt: { lt: thirtyDaysAgo },
        ...(companyId && { companyId }),
      },
      data: {
        status: AISuggestionStatus.EXPIRED,
      },
    });
  }

  /**
   * Get suggestion statistics for a company
   */
  async getSuggestionStats(companyId: string) {
    const [total, pending, approved, rejected, applied] = await Promise.all([
      prisma.aISuggestion.count({ where: { companyId } }),
      prisma.aISuggestion.count({ where: { companyId, status: AISuggestionStatus.PENDING } }),
      prisma.aISuggestion.count({ where: { companyId, status: AISuggestionStatus.APPROVED } }),
      prisma.aISuggestion.count({ where: { companyId, status: AISuggestionStatus.REJECTED } }),
      prisma.aISuggestion.count({ where: { companyId, status: AISuggestionStatus.APPLIED } }),
    ]);

    return {
      total,
      pending,
      approved,
      rejected,
      applied,
      approvalRate: total > 0 ? (approved / total) * 100 : 0,
      applicationRate: approved > 0 ? (applied / approved) * 100 : 0,
    };
  }
}


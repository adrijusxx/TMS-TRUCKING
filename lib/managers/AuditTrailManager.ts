/**
 * AuditTrailManager
 *
 * General-purpose audit trail for entity changes.
 * Records who changed what, when, with old/new values.
 * Uses ActivityLog table with structured metadata.
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/utils/logger';

interface AuditEntry {
  companyId: string;
  userId?: string;
  entityType: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'OVERRIDE';
  changes?: FieldChange[];
  description?: string;
  metadata?: Record<string, unknown>;
}

interface FieldChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export class AuditTrailManager {
  /**
   * Record an audit entry for an entity change.
   */
  static async record(entry: AuditEntry): Promise<void> {
    try {
      await prisma.activityLog.create({
        data: {
          companyId: entry.companyId,
          userId: entry.userId,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          description: entry.description ?? this.buildDescription(entry),
          metadata: {
            changes: entry.changes as unknown as Prisma.InputJsonValue,
            ...entry.metadata,
          } as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      // Audit failures should not break the main operation
      logger.error('Failed to record audit trail', {
        entityType: entry.entityType,
        entityId: entry.entityId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Compute field-level changes between old and new data.
   * Useful for UPDATE audits.
   */
  static diff(
    oldData: Record<string, unknown>,
    newData: Record<string, unknown>,
    fields?: string[]
  ): FieldChange[] {
    const changes: FieldChange[] = [];
    const keysToCheck = fields ?? Object.keys(newData);

    for (const key of keysToCheck) {
      const oldVal = oldData[key];
      const newVal = newData[key];

      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changes.push({ field: key, oldValue: oldVal, newValue: newVal });
      }
    }

    return changes;
  }

  /**
   * Get audit history for an entity.
   */
  static async getHistory(
    entityType: string,
    entityId: string,
    options?: { limit?: number; offset?: number }
  ) {
    return prisma.activityLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  /**
   * Record a settings change (for settings audit log).
   */
  static async recordSettingsChange(
    companyId: string,
    userId: string,
    settingsArea: string,
    changes: FieldChange[]
  ): Promise<void> {
    if (changes.length === 0) return;

    await this.record({
      companyId,
      userId,
      entityType: 'SETTINGS',
      entityId: settingsArea,
      action: 'UPDATE',
      changes,
      description: `Updated ${settingsArea} settings (${changes.length} field${changes.length > 1 ? 's' : ''})`,
    });
  }

  private static buildDescription(entry: AuditEntry): string {
    const changeCount = entry.changes?.length ?? 0;
    switch (entry.action) {
      case 'CREATE':
        return `Created ${entry.entityType}`;
      case 'UPDATE':
        return `Updated ${entry.entityType} (${changeCount} field${changeCount !== 1 ? 's' : ''})`;
      case 'DELETE':
        return `Deleted ${entry.entityType}`;
      case 'STATUS_CHANGE':
        return `Changed ${entry.entityType} status`;
      case 'OVERRIDE':
        return `Override on ${entry.entityType}`;
      default:
        return `${entry.action} on ${entry.entityType}`;
    }
  }
}

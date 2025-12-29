import { prisma } from '@/lib/prisma';
import type { UserColumnPreferences, ColumnPreference } from '@/components/data-table/types';
import type { Prisma } from '@prisma/client';

/**
 * Manager for handling user column preferences
 */
export class ColumnPreferenceManager {
  /**
   * Get user's column preferences for an entity type
   */
  static async getUserColumnPreferences(
    userId: string,
    entityType: string
  ): Promise<UserColumnPreferences | null> {
    const preference = await prisma.userColumnPreference.findUnique({
      where: {
        userId_entityType: {
          userId,
          entityType,
        },
      },
    });

    if (!preference) {
      return null;
    }

    // Prisma Json type needs to be cast to our expected type
    return preference.columnPreferences as unknown as UserColumnPreferences;
  }

  /**
   * Save user's column preferences for an entity type
   */
  static async saveUserColumnPreferences(
    userId: string,
    entityType: string,
    preferences: UserColumnPreferences
  ): Promise<void> {
    await prisma.userColumnPreference.upsert({
      where: {
        userId_entityType: {
          userId,
          entityType,
        },
      },
      create: {
        userId,
        entityType,
        columnPreferences: preferences as unknown as Prisma.InputJsonValue,
      },
      update: {
        columnPreferences: preferences as unknown as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Delete user's column preferences for an entity type
   */
  static async deleteUserColumnPreferences(
    userId: string,
    entityType: string
  ): Promise<void> {
    await prisma.userColumnPreference.delete({
      where: {
        userId_entityType: {
          userId,
          entityType,
        },
      },
    });
  }

  // Utilities have been moved to @/lib/utils/column-preferences.ts
  // to avoid importing Prisma in Client Components. 
  // Please import mergePreferences, preferencesToVisibilityState, etc. from there.
}


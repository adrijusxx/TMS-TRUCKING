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

  /**
   * Merge default preferences with user preferences
   */
  static mergePreferences(
    defaultPreferences: UserColumnPreferences,
    userPreferences: UserColumnPreferences | null
  ): UserColumnPreferences {
    if (!userPreferences) {
      return defaultPreferences;
    }

    const merged: UserColumnPreferences = { ...defaultPreferences };

    // Apply user preferences, but keep defaults for columns not in user preferences
    Object.keys(userPreferences).forEach((columnId) => {
      if (defaultPreferences[columnId] !== undefined) {
        merged[columnId] = {
          ...defaultPreferences[columnId],
          ...userPreferences[columnId],
        };
      }
    });

    return merged;
  }

  /**
   * Convert preferences to visibility state for TanStack Table
   */
  static preferencesToVisibilityState(
    preferences: UserColumnPreferences
  ): Record<string, boolean> {
    const visibility: Record<string, boolean> = {};

    Object.keys(preferences).forEach((columnId) => {
      visibility[columnId] = preferences[columnId].visible;
    });

    return visibility;
  }

  /**
   * Convert visibility state to preferences
   */
  static visibilityStateToPreferences(
    visibility: Record<string, boolean>,
    existingPreferences?: UserColumnPreferences
  ): UserColumnPreferences {
    const preferences: UserColumnPreferences = {};

    Object.keys(visibility).forEach((columnId) => {
      preferences[columnId] = {
        visible: visibility[columnId],
        width: existingPreferences?.[columnId]?.width,
        order: existingPreferences?.[columnId]?.order,
      };
    });

    return preferences;
  }
}


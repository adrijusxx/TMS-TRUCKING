import type { UserColumnPreferences } from '@/components/data-table/types';

/**
 * Shared utility functions for column preferences
 * Safe to use in Client Components (no Prisma dependencies)
 */

/**
 * Merge default preferences with user preferences
 */
export function mergePreferences(
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
export function preferencesToVisibilityState(
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
export function visibilityStateToPreferences(
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

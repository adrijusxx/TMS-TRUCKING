'use client';

import * as React from 'react';
import type { VisibilityState } from '@tanstack/react-table';
import type { ExtendedColumnDef, UserColumnPreferences } from '../types';
import { apiUrl } from '@/lib/utils';
import {
  mergePreferences,
  preferencesToVisibilityState,
  visibilityStateToPreferences,
  preferencesToColumnOrder,
  columnOrderToPreferences,
} from '@/lib/utils/column-preferences';

type TableData = Record<string, any>;

interface UseColumnPreferencesProps<TData extends TableData> {
  entityType: string;
  columns: ExtendedColumnDef<TData>[];
  defaultVisibleColumns?: string[];
  enableColumnVisibility?: boolean;
  enableColumnReorder?: boolean;
}

/**
 * Manages column preferences (visibility, order) with server persistence.
 * Loads user preferences on mount, merges with defaults, and saves changes.
 */
export function useColumnPreferences<TData extends TableData>({
  entityType,
  columns,
  defaultVisibleColumns,
  enableColumnVisibility = true,
  enableColumnReorder = false,
}: UseColumnPreferencesProps<TData>) {
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnOrder, setColumnOrder] = React.useState<string[]>([]);
  const [userPreferences, setUserPreferences] = React.useState<UserColumnPreferences | null>(null);

  // Build default visibility state from column definitions
  const defaultVisibility = React.useMemo(() => {
    const visibility: VisibilityState = {};
    const defaults = defaultVisibleColumns || [];

    columns.forEach((column) => {
      const columnId = column.id || (typeof column.accessorKey === 'string' ? column.accessorKey : '');
      if (defaults.length > 0) {
        visibility[columnId] = Array.isArray(defaults) && defaults.includes(columnId);
      } else {
        visibility[columnId] = column.defaultVisible ?? true;
      }
    });

    return visibility;
  }, [columns, defaultVisibleColumns]);

  // Load user column preferences
  const lastEntityTypeRef = React.useRef<string | null>(null);
  const defaultVisibilityStringRef = React.useRef<string>('');
  const defaultVisibilityString = React.useMemo(() => JSON.stringify(defaultVisibility), [defaultVisibility]);

  React.useEffect(() => {
    if (defaultVisibilityString === defaultVisibilityStringRef.current && lastEntityTypeRef.current === entityType) {
      return;
    }
    defaultVisibilityStringRef.current = defaultVisibilityString;

    if (!enableColumnVisibility) {
      setColumnVisibility((prev) => {
        const defaultKeys = Object.keys(defaultVisibility);
        const prevKeys = Object.keys(prev);
        if (defaultKeys.length !== prevKeys.length) return defaultVisibility;
        for (const key of defaultKeys) {
          if (prev[key] !== defaultVisibility[key]) return defaultVisibility;
        }
        return prev;
      });
      return;
    }

    if (lastEntityTypeRef.current === entityType && lastEntityTypeRef.current !== null) {
      return;
    }
    lastEntityTypeRef.current = entityType;

    const loadPreferences = async () => {
      try {
        const response = await fetch(
          apiUrl(`/api/user-preferences/column-visibility?entityType=${entityType}`)
        );

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const preferences = result.data as UserColumnPreferences;
            setUserPreferences(preferences);

            const defaultPrefs: UserColumnPreferences = {};
            Object.keys(defaultVisibility).forEach((key) => {
              defaultPrefs[key] = { visible: defaultVisibility[key] ?? true };
            });
            const merged = mergePreferences(defaultPrefs, preferences);
            setColumnVisibility(preferencesToVisibilityState(merged));

            const order = preferencesToColumnOrder(merged);
            if (order.length > 0) setColumnOrder(order);
          } else {
            setColumnVisibility(defaultVisibility);
          }
        } else {
          setColumnVisibility(defaultVisibility);
        }
      } catch (error) {
        console.error('Error loading column preferences:', error);
        setColumnVisibility(defaultVisibility);
      }
    };

    loadPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, enableColumnVisibility, defaultVisibilityString]);

  // Initialize column order from columns if not yet set
  React.useEffect(() => {
    if (enableColumnReorder && columnOrder.length === 0 && columns.length > 0) {
      const ids = columns
        .map((col) => col.id || (typeof col.accessorKey === 'string' ? col.accessorKey : ''))
        .filter(Boolean);
      if (ids.length > 0) setColumnOrder(ids);
    }
  }, [enableColumnReorder, columnOrder.length, columns]);

  // Save visibility changes to server
  const handleColumnVisibilityChange = React.useCallback((visibility: VisibilityState) => {
    setColumnVisibility(visibility);

    if (entityType) {
      try {
        const currentPrefs = visibilityStateToPreferences(visibility, userPreferences || {});
        setUserPreferences(currentPrefs);

        fetch(apiUrl('/api/user-preferences/column-visibility'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entityType, preferences: currentPrefs }),
        }).catch(console.error);
      } catch (err) {
        console.error('Error saving column visibility:', err);
      }
    }
  }, [entityType, userPreferences]);

  // Save order changes to server
  const handleColumnOrderChange = React.useCallback((newOrder: string[]) => {
    setColumnOrder(newOrder);

    if (entityType) {
      try {
        const currentPrefs = visibilityStateToPreferences(columnVisibility, userPreferences || {});
        const newPrefs = columnOrderToPreferences(newOrder, userPreferences || {});
        const mergedToSave = { ...currentPrefs, ...newPrefs };

        setUserPreferences(mergedToSave);

        fetch(apiUrl('/api/user-preferences/column-visibility'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entityType, preferences: mergedToSave }),
        }).catch(console.error);
      } catch (err) {
        console.error('Error saving column order:', err);
      }
    }
  }, [entityType, columnVisibility, userPreferences]);

  return {
    columnVisibility,
    columnOrder,
    defaultVisibility,
    handleColumnVisibilityChange,
    handleColumnOrderChange,
  };
}

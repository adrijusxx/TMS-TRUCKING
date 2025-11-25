'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';
import type { ExtendedColumnDef, UserColumnPreferences } from './types';
import type { VisibilityState } from '@tanstack/react-table';

interface ColumnVisibilityManagerProps<TData extends Record<string, any>> {
  /**
   * Column definitions
   */
  columns: ExtendedColumnDef<TData>[];
  /**
   * Current visibility state
   */
  columnVisibility: VisibilityState;
  /**
   * Visibility change handler
   */
  onColumnVisibilityChange: (visibility: VisibilityState) => void;
  /**
   * Entity type (for saving preferences)
   */
  entityType: string;
  /**
   * Whether to save preferences to database
   */
  savePreferences?: boolean;
  /**
   * Default visibility state
   */
  defaultVisibility?: VisibilityState;
}

/**
 * Column visibility manager component
 * Allows users to toggle column visibility and save preferences
 */
export function ColumnVisibilityManager<TData extends Record<string, any>>({
  columns,
  columnVisibility,
  onColumnVisibilityChange,
  entityType,
  savePreferences = true,
  defaultVisibility,
}: ColumnVisibilityManagerProps<TData>) {
  const [isSaving, setIsSaving] = React.useState(false);

  // Filter out columns that cannot be hidden
  const toggleableColumns = columns.filter(
    (col) => col.enableHiding !== false && col.required !== true
  );

  const handleToggleColumn = async (columnId: string, visible: boolean) => {
    const newVisibility = {
      ...columnVisibility,
      [columnId]: visible,
    };
    onColumnVisibilityChange(newVisibility);

    // Save preferences if enabled
    if (savePreferences) {
      try {
        setIsSaving(true);
        const preferences: UserColumnPreferences = {};

        Object.keys(newVisibility).forEach((colId) => {
          preferences[colId] = {
            visible: newVisibility[colId] ?? true,
          };
        });

        const response = await fetch(apiUrl('/api/user-preferences/column-visibility'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entityType,
            preferences,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save column preferences');
        }
      } catch (error: any) {
        console.error('Error saving column preferences:', error);
        toast.error('Failed to save column preferences');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleResetToDefaults = async () => {
    if (!defaultVisibility) {
      toast.error('No default visibility available');
      return;
    }

    onColumnVisibilityChange(defaultVisibility);

    if (savePreferences) {
      try {
        setIsSaving(true);
        const response = await fetch(
          apiUrl(`/api/user-preferences/column-visibility?entityType=${entityType}`),
          {
            method: 'DELETE',
          }
        );

        if (!response.ok) {
          throw new Error('Failed to reset column preferences');
        }

        toast.success('Column preferences reset to defaults');
      } catch (error: any) {
        console.error('Error resetting column preferences:', error);
        toast.error('Failed to reset column preferences');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const visibleCount = Object.values(columnVisibility).filter((v) => v).length;
  const totalCount = toggleableColumns.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isSaving}>
          <Settings2 className="h-4 w-4 mr-2" />
          Columns ({visibleCount}/{totalCount})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {toggleableColumns.map((column) => {
          const columnId = column.id || (typeof column.accessorKey === 'string' ? column.accessorKey : '');
          const isVisible = columnVisibility[columnId] ?? column.defaultVisible ?? true;

          return (
            <DropdownMenuCheckboxItem
              key={columnId}
              checked={isVisible}
              onCheckedChange={(checked) => handleToggleColumn(columnId, checked)}
              disabled={isSaving}
            >
              {typeof column.header === 'string'
                ? column.header
                : (column as any).meta?.header || columnId}
            </DropdownMenuCheckboxItem>
          );
        })}
        {defaultVisibility && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={false}
              onCheckedChange={handleResetToDefaults}
              disabled={isSaving}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </DropdownMenuCheckboxItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


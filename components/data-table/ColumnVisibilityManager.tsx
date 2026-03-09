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
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Settings2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';
import type { ExtendedColumnDef, UserColumnPreferences } from './types';
import type { VisibilityState } from '@tanstack/react-table';

import { visibilityStateToPreferences, columnOrderToPreferences } from '@/lib/utils/column-preferences';

interface ColumnVisibilityManagerProps<TData extends Record<string, any>> {
  columns: ExtendedColumnDef<TData>[];
  columnVisibility: VisibilityState;
  onColumnVisibilityChange: (visibility: VisibilityState) => void;
  entityType: string;
  savePreferences?: boolean;
  defaultVisibility?: VisibilityState;
  onColumnOrderChange?: (order: string[]) => void;
  columnOrder?: string[];
}

export function ColumnVisibilityManager<TData extends Record<string, any>>({
  columns,
  columnVisibility,
  onColumnVisibilityChange,
  entityType,
  savePreferences = true,
  defaultVisibility,
  onColumnOrderChange,
  columnOrder,
}: ColumnVisibilityManagerProps<TData>) {
  const [isSaving, setIsSaving] = React.useState(false);

  // Filter out columns that cannot be hidden
  const toggleableColumns = columns.filter(
    (col) => col.enableHiding !== false && col.required !== true
  );

  const handleToggleColumn = async (columnId: string, visible: boolean) => {
    const newVisibility = { ...columnVisibility, [columnId]: visible };
    onColumnVisibilityChange(newVisibility);

    if (savePreferences) {
      await saveVisibilityPreferences(newVisibility);
    }
  };

  const saveVisibilityPreferences = async (visibility: VisibilityState) => {
    try {
      setIsSaving(true);

      // Convert visibility to preferences
      let preferences = visibilityStateToPreferences(visibility);

      // If column order is provided, merge it
      if (columnOrder && columnOrder.length > 0) {
        preferences = columnOrderToPreferences(columnOrder, preferences);
      } else {
        // Fallback: simple visibility object if helpers fail or no order
        if (Object.keys(preferences).length === 0) {
          const fallback: UserColumnPreferences = {};
          Object.keys(visibility).forEach((colId) => {
            fallback[colId] = { visible: visibility[colId] ?? true };
          });
          preferences = fallback;
        }
      }

      const response = await fetch(apiUrl('/api/user-preferences/column-visibility'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType, preferences }),
      });

      if (!response.ok) throw new Error('Failed to save');
    } catch (error) {
      console.error('Error saving column preferences:', error);
    } finally {
      setIsSaving(false);
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
        await fetch(apiUrl(`/api/user-preferences/column-visibility?entityType=${entityType}`), {
          method: 'DELETE',
        });
        toast.success('Column preferences reset to defaults');
      } catch (error) {
        console.error('Error resetting:', error);
        toast.error('Failed to reset');
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
        {/* Column Toggles */}
        <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[300px] overflow-y-auto">
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
        </div>

        {/* Reset */}
        {defaultVisibility && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleResetToDefaults} disabled={isSaving}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

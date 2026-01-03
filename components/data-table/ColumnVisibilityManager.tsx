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
import { Settings2, RotateCcw, Sparkles, Truck, DollarSign, Minimize2, Maximize2, Users, ShieldCheck, Wrench, Building2, Link, Headphones, Container } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';
import type { ExtendedColumnDef, UserColumnPreferences } from './types';
import type { VisibilityState } from '@tanstack/react-table';
import { getPresetsForEntity, type ColumnPreset } from '@/lib/config/column-presets';

import { visibilityStateToPreferences, columnOrderToPreferences } from '@/lib/utils/column-preferences';

// Icon mapping for presets
const iconMap: Record<string, React.ReactNode> = {
  Truck: <Truck className="h-4 w-4 mr-2" />,
  DollarSign: <DollarSign className="h-4 w-4 mr-2" />,
  Minimize2: <Minimize2 className="h-4 w-4 mr-2" />,
  Maximize2: <Maximize2 className="h-4 w-4 mr-2" />,
  Users: <Users className="h-4 w-4 mr-2" />,
  ShieldCheck: <ShieldCheck className="h-4 w-4 mr-2" />,
  Wrench: <Wrench className="h-4 w-4 mr-2" />,
  Building2: <Building2 className="h-4 w-4 mr-2" />,
  Link: <Link className="h-4 w-4 mr-2" />,
  Headphones: <Headphones className="h-4 w-4 mr-2" />,
  Container: <Container className="h-4 w-4 mr-2" />,
};

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
  const [activePreset, setActivePreset] = React.useState<string | null>(null);

  // Get presets for this entity
  const presets = getPresetsForEntity(entityType);

  // Filter out columns that cannot be hidden
  const toggleableColumns = columns.filter(
    (col) => col.enableHiding !== false && col.required !== true
  );

  const handleToggleColumn = async (columnId: string, visible: boolean) => {
    const newVisibility = { ...columnVisibility, [columnId]: visible };
    onColumnVisibilityChange(newVisibility);
    setActivePreset(null); // Clear preset when manually toggling

    if (savePreferences) {
      await saveVisibilityPreferences(newVisibility);
    }
  };

  const handleApplyPreset = async (preset: ColumnPreset) => {
    // Build visibility state from preset
    const newVisibility: VisibilityState = {};
    const presetColumnsSet = new Set(preset.columns);

    columns.forEach((col) => {
      const columnId = col.id || (typeof col.accessorKey === 'string' ? col.accessorKey : '');
      if (columnId && col.required !== true) {
        newVisibility[columnId] = presetColumnsSet.has(columnId);
      }
    });

    onColumnVisibilityChange(newVisibility);

    // Update column order if handler provided
    if (onColumnOrderChange) {
      const otherCols = columns
        .map((col) => col.id || (typeof col.accessorKey === 'string' ? col.accessorKey : ''))
        .filter((id) => id && !presetColumnsSet.has(id));

      onColumnOrderChange([...preset.columns, ...otherCols]);
    }

    setActivePreset(preset.id);
    toast.success(`Applied "${preset.name}" preset`);

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
        // (Though visibilityStateToPreferences should work)
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
    setActivePreset(null);

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
        {/* Presets Section */}
        {presets.length > 0 && (
          <>
            <DropdownMenuLabel className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Quick Presets
            </DropdownMenuLabel>
            {presets.map((preset) => (
              <DropdownMenuItem
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                className={activePreset === preset.id ? 'bg-accent' : ''}
              >
                {preset.icon && iconMap[preset.icon]}
                <div className="flex-1">
                  <div className="font-medium">{preset.name}</div>
                  {preset.description && (
                    <div className="text-xs text-muted-foreground">{preset.description}</div>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}

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

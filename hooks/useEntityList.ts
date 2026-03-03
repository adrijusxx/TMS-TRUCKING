'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { usePermissions } from '@/hooks/usePermissions';
import { type Permission } from '@/lib/permissions';
import { bulkDeleteEntities } from '@/lib/actions/bulk-delete';
import { toast } from 'sonner';

type SheetMode = 'create' | 'edit' | 'view';

interface UseEntityListOptions {
  /** Entity type identifier (e.g., 'drivers', 'trucks') */
  entityType: string;
  /** Permission key for editing (e.g., 'drivers.edit') */
  editPermission: Permission;
  /** URL search param key for deep linking (e.g., 'driverId') */
  idParam: string;
  /** Query key for TanStack Query invalidation */
  queryKey?: string;
}

interface UseEntityListReturn {
  /** Whether the sheet/dialog is open */
  sheetOpen: boolean;
  /** Set sheet open state */
  setSheetOpen: (open: boolean) => void;
  /** Current sheet mode */
  sheetMode: SheetMode;
  /** Currently selected entity ID */
  selectedId: string | null;
  /** Open the sheet in a specific mode */
  openSheet: (mode: SheetMode, id?: string) => void;
  /** Callback to refresh data after mutations */
  handleUpdate: () => void;
  /** Callback for bulk delete */
  handleDelete: (ids: string[]) => Promise<void>;
  /** Trigger import dialog via hidden button */
  handleImport: () => void;
  /** Row selection state */
  rowSelection: Record<string, boolean>;
  /** Set row selection */
  setRowSelection: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  /** Array of selected row IDs */
  selectedRowIds: string[];
  /** Permission check shortcut */
  can: (permission: Permission) => boolean;
  /** Whether user can edit this entity */
  canEdit: boolean;
  /** Get the appropriate mode (edit or view) based on permissions */
  getViewMode: () => SheetMode;
}

/**
 * Shared hook for entity list pages.
 * Encapsulates sheet state, deep linking, row selection, and data refresh logic.
 */
export function useEntityList({
  entityType,
  editPermission,
  idParam,
  queryKey,
}: UseEntityListOptions): UseEntityListReturn {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [sheetMode, setSheetMode] = React.useState<SheetMode>('view');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});

  const canEdit = can(editPermission);
  const effectiveQueryKey = queryKey || entityType;

  const getViewMode = React.useCallback((): SheetMode => {
    return canEdit ? 'edit' : 'view';
  }, [canEdit]);

  const openSheet = React.useCallback((mode: SheetMode, id?: string) => {
    setSheetMode(mode);
    if (id) setSelectedId(id);
    setSheetOpen(true);
  }, []);

  // Deep linking support
  React.useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'new') {
      openSheet('create');
    } else if (action === 'import') {
      const trigger = document.querySelector(
        `[data-import-trigger="${entityType}"]`
      ) as HTMLButtonElement;
      if (trigger) trigger.click();
    }

    const idFromUrl = searchParams.get(idParam);
    if (idFromUrl) {
      setSelectedId(idFromUrl);
      setSheetMode(canEdit ? 'edit' : 'view');
      setSheetOpen(true);
    }
  }, [searchParams, canEdit, idParam, entityType, openSheet]);

  const handleUpdate = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [effectiveQueryKey] });
    router.refresh();
  }, [queryClient, router, effectiveQueryKey]);

  const handleDelete = React.useCallback(async (ids: string[]) => {
    try {
      const singular = entityType.endsWith('s')
        ? entityType.slice(0, -1)
        : entityType;
      const result = await bulkDeleteEntities(singular, ids);
      if (result.success) {
        toast.success(
          `Successfully deleted ${result.deletedCount || ids.length} ${entityType}`
        );
        queryClient.invalidateQueries({ queryKey: [effectiveQueryKey] });
        router.refresh();
      } else {
        toast.error(result.error || `Failed to delete ${entityType}`);
      }
    } catch {
      toast.error(`Failed to delete ${entityType}`);
    }
  }, [entityType, queryClient, effectiveQueryKey, router]);

  const handleImport = React.useCallback(() => {
    const trigger = document.querySelector(
      `[data-import-trigger="${entityType}"]`
    ) as HTMLButtonElement;
    if (trigger) trigger.click();
  }, [entityType]);

  const selectedRowIds = React.useMemo(() => {
    return Object.keys(rowSelection).filter((key) => rowSelection[key]);
  }, [rowSelection]);

  return {
    sheetOpen,
    setSheetOpen,
    sheetMode,
    selectedId,
    openSheet,
    handleUpdate,
    handleDelete,
    handleImport,
    rowSelection,
    setRowSelection,
    selectedRowIds,
    can,
    canEdit,
    getViewMode,
  };
}

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Download, Edit, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import { BulkEditDialog } from './BulkEditDialog';
import type { CustomBulkAction, BulkEditField } from './types';

interface BulkActionBarProps {
  /**
   * Selected row IDs
   */
  selectedIds: string[];
  /**
   * Clear selection handler
   */
  onClearSelection: () => void;
  /**
   * Entity type
   */
  entityType: string;
  /**
   * Custom bulk actions
   */
  customActions?: CustomBulkAction[];
  /**
   * Custom bulk actions (alias for customActions for consistency)
   */
  customBulkActions?: CustomBulkAction[];
  /**
   * Bulk edit fields (if bulk edit is enabled)
   */
  bulkEditFields?: BulkEditField[];
  /**
   * Enable bulk edit
   */
  enableBulkEdit?: boolean;
  /**
   * Enable bulk delete
   */
  enableBulkDelete?: boolean;
  /**
   * Enable bulk export
   */
  enableBulkExport?: boolean;
  /**
   * On action complete callback
   */
  onActionComplete?: () => void;
}

/**
 * Enhanced bulk action bar with permission checks and custom actions
 */
export function BulkActionBar({
  selectedIds,
  onClearSelection,
  entityType,
  customActions = [],
  customBulkActions = [],
  bulkEditFields = [],
  enableBulkEdit = true,
  enableBulkDelete = true,
  enableBulkExport = true,
  onActionComplete,
}: BulkActionBarProps) {
  const { can } = usePermissions();
  const [bulkEditOpen, setBulkEditOpen] = React.useState(false);
  const queryClient = useQueryClient();
  
  // Merge customActions and customBulkActions (support both prop names)
  const allCustomActions = [...customActions, ...customBulkActions];

  const bulkDeleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(apiUrl('/api/bulk-actions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType,
          action: 'delete',
          ids: selectedIds,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Bulk delete failed');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success(`Successfully deleted ${selectedIds.length} record(s)`);
      // Invalidate queries - entityType is already plural (e.g., 'loads', 'trucks')
      queryClient.invalidateQueries({ queryKey: [entityType] });
      onClearSelection();
      onActionComplete?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Bulk delete failed');
    },
  });

  const bulkExportMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        apiUrl(`/api/import-export/${entityType}?ids=${selectedIds.join(',')}&format=csv`)
      );

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const csv = await response.text();
      const blob = new Blob([csv], { type: 'text/csv' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${entityType}-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    },
    onSuccess: () => {
      toast.success('Export completed successfully');
      onActionComplete?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Export failed');
    },
  });

  const handleBulkDelete = () => {
    if (
      !confirm(
        `Are you sure you want to delete ${selectedIds.length} selected record(s)? This action cannot be undone.`
      )
    ) {
      return;
    }

    bulkDeleteMutation.mutate();
  };

  const handleBulkExport = () => {
    bulkExportMutation.mutate();
  };

  const handleCustomAction = async (action: CustomBulkAction) => {
    if (action.requiresConfirmation) {
      const message =
        action.confirmationMessage ||
        `Are you sure you want to ${action.label.toLowerCase()} ${selectedIds.length} selected record(s)?`;
      if (!confirm(message)) {
        return;
      }
    }

    try {
      await action.handler(selectedIds);
      // Show success toast and invalidate queries for custom actions
      toast.success(`Successfully ${action.label.toLowerCase()} ${selectedIds.length} record(s)`);
      queryClient.invalidateQueries({ queryKey: [entityType] });
      onClearSelection();
      onActionComplete?.();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${action.label.toLowerCase()}`);
    }
  };

  // Filter actions based on permissions
  // Check both entity-specific and generic permissions
  const entityBulkEdit = can(`${entityType}.bulk_edit` as any);
  const dataBulkEdit = can('data.bulk_edit');
  const entityBulkDelete = can(`${entityType}.bulk_delete` as any);
  const dataBulkDelete = can('data.bulk_delete');
  const dataExport = can('data.export');
  const exportExecute = can('export.execute');
  
  const canBulkEdit = 
    enableBulkEdit && 
    bulkEditFields.length > 0 && 
    (entityBulkEdit || dataBulkEdit);
  const canBulkDelete =
    enableBulkDelete && (entityBulkDelete || dataBulkDelete);
  const canBulkExport = enableBulkExport && (dataExport || exportExecute);
  const visibleCustomActions = allCustomActions.filter(
    (action) => !action.permission || can(action.permission as any)
  );

  // Debug logging
  React.useEffect(() => {
    if (selectedIds.length > 0) {
      console.log('BulkActionBar Debug:', {
        selectedIds: selectedIds.length,
        entityType,
        enableBulkEdit,
        enableBulkDelete,
        enableBulkExport,
        bulkEditFieldsCount: bulkEditFields.length,
        entityBulkEdit,
        dataBulkEdit,
        entityBulkDelete,
        dataBulkDelete,
        dataExport,
        exportExecute,
        canBulkEdit,
        canBulkDelete,
        canBulkExport,
        hasCustomActions: visibleCustomActions.length,
      });
    }
  }, [selectedIds.length, entityType, enableBulkEdit, enableBulkDelete, enableBulkExport, bulkEditFields.length, entityBulkEdit, dataBulkEdit, entityBulkDelete, dataBulkDelete, dataExport, exportExecute, canBulkEdit, canBulkDelete, canBulkExport, visibleCustomActions.length]);

  if (selectedIds.length === 0) {
    return null;
  }

  // Check if any actions are available
  const hasAnyActions = canBulkEdit || canBulkDelete || canBulkExport || visibleCustomActions.length > 0;

  return (
    <>
      <div className="sticky bottom-4 left-0 right-0 z-40 bg-background border rounded-lg shadow-lg p-4 mx-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox checked={true} onCheckedChange={onClearSelection} />
              <span className="text-sm font-medium">
                {selectedIds.length} item{selectedIds.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={onClearSelection}>
              Clear
            </Button>
          </div>

          {hasAnyActions ? (
            <div className="flex items-center gap-2">
              {canBulkEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBulkEditOpen(true)}
                  disabled={bulkDeleteMutation.isPending}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Bulk Edit
                </Button>
              )}

              {canBulkExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkExport}
                  disabled={bulkExportMutation.isPending}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Selected
                </Button>
              )}

              {canBulkDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={bulkDeleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {bulkDeleteMutation.isPending 
                    ? 'Deleting...' 
                    : `Delete All Selected (${selectedIds.length})`}
                </Button>
              )}

              {visibleCustomActions.map((action) => (
                <Button
                  key={action.id}
                  variant={action.variant || 'outline'}
                  size="sm"
                  onClick={() => handleCustomAction(action)}
                  disabled={bulkDeleteMutation.isPending || bulkExportMutation.isPending}
                >
                  {action.icon}
                  <span className="ml-2">{action.label}</span>
                </Button>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              No bulk actions available
            </div>
          )}
        </div>
      </div>

      {canBulkEdit && bulkEditFields.length > 0 && (
        <BulkEditDialog
          open={bulkEditOpen}
          onOpenChange={setBulkEditOpen}
          selectedIds={selectedIds}
          entityType={entityType}
          fields={bulkEditFields}
          onSuccess={() => {
            // Invalidate all queries that start with the entityType
            queryClient.invalidateQueries({ queryKey: [entityType], exact: false });
            onClearSelection();
            onActionComplete?.();
          }}
        />
      )}
    </>
  );
}


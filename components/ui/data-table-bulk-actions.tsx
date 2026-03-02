// Re-export from canonical location — the DataTable component uses this
// The canonical bulk actions are in BulkActionBar.tsx but this simpler version
// is used directly by DataTable.tsx for basic delete/export/clear functionality.

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Download, X } from 'lucide-react';

interface DataTableBulkActionsProps {
  selectedCount: number;
  onDelete?: (selectedIds: string[]) => void;
  onExport?: (selectedIds: string[]) => void;
  selectedIds: string[];
  onClearSelection?: () => void;
}

export function DataTableBulkActions({
  selectedCount,
  onDelete,
  onExport,
  selectedIds,
  onClearSelection,
}: DataTableBulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-200">
      <div className="bg-background border rounded-lg shadow-lg px-4 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
          </span>
        </div>
        <div className="h-6 w-px bg-border" />
        <div className="flex items-center gap-2">
          {onExport && (
            <Button variant="outline" size="sm" onClick={() => onExport(selectedIds)} className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          )}
          {onDelete && (
            <Button variant="destructive" size="sm" onClick={() => onDelete(selectedIds)} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}
          {onClearSelection && (
            <Button variant="ghost" size="sm" onClick={onClearSelection} className="gap-2">
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

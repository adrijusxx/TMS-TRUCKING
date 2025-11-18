'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '@/lib/utils';

interface BulkActionBarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  entityType: string;
  actions?: Array<{
    label: string;
    action: string;
    icon?: React.ReactNode;
    variant?: 'default' | 'destructive';
    requiresConfirmation?: boolean;
  }>;
  onActionComplete?: () => void;
}

export default function BulkActionBar({
  selectedIds,
  onClearSelection,
  entityType,
  actions = [],
  onActionComplete,
}: BulkActionBarProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  const defaultActions = [
    { label: 'Delete', action: 'delete', icon: <Trash2 className="h-4 w-4" />, variant: 'destructive' as const, requiresConfirmation: true },
    { label: 'Export Selected', action: 'export', icon: <Download className="h-4 w-4" /> },
    ...actions,
  ];

  const bulkActionMutation = useMutation({
    mutationFn: async (action: string) => {
      const response = await fetch(apiUrl('/api/bulk-actions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType,
          action,
          ids: selectedIds,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Bulk action failed');
      }

      return response.json();
    },
    onSuccess: (data, action) => {
      toast.success(data.data?.message || `Successfully performed ${action} on ${selectedIds.length} item(s)`);
      queryClient.invalidateQueries({ queryKey: [entityType + 's'] });
      onClearSelection();
      onActionComplete?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Bulk action failed');
    },
    onSettled: () => {
      setIsProcessing(false);
    },
  });

  const handleAction = async (action: string, requiresConfirmation = false) => {
    if (requiresConfirmation) {
      if (!confirm(`Are you sure you want to ${action} ${selectedIds.length} selected item(s)?`)) {
        return;
      }
    }

    setIsProcessing(true);
    bulkActionMutation.mutate(action);
  };

  if (selectedIds.length === 0) return null;

  return (
    <div className="sticky bottom-4 left-0 right-0 z-40 bg-white border rounded-lg shadow-lg p-4 mx-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox checked={true} onCheckedChange={onClearSelection} />
            <span className="text-sm font-medium">
              {selectedIds.length} item{selectedIds.length !== 1 ? 's' : ''} selected
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={isProcessing}
          >
            Clear
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {defaultActions.map((actionItem) => (
            <Button
              key={actionItem.action}
              variant={actionItem.variant || 'outline'}
              size="sm"
              onClick={() => handleAction(actionItem.action, actionItem.requiresConfirmation)}
              disabled={isProcessing}
            >
              {actionItem.icon}
              <span className="ml-2">{actionItem.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}


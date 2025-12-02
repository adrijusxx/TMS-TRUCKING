'use client';

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoadStatus } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';
import { apiUrl, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { statusColors, formatStatus } from '@/lib/config/entities/loads';

interface InlineStatusEditorProps {
  loadId: string;
  currentStatus: LoadStatus;
  onStatusChange?: () => void;
}

async function updateLoadStatus(loadId: string, status: LoadStatus) {
  const response = await fetch(apiUrl(`/api/loads/${loadId}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update load status');
  }
  return response.json();
}

// All available load statuses
const allStatuses: LoadStatus[] = [
  'PENDING',
  'ASSIGNED',
  'EN_ROUTE_PICKUP',
  'AT_PICKUP',
  'LOADED',
  'EN_ROUTE_DELIVERY',
  'AT_DELIVERY',
  'DELIVERED',
  'BILLING_HOLD',
  'READY_TO_BILL',
  'INVOICED',
  'PAID',
  'CANCELLED',
];

const statusIcons: Record<LoadStatus, typeof CheckCircle> = {
  PENDING: Clock,
  ASSIGNED: Clock,
  EN_ROUTE_PICKUP: Clock,
  AT_PICKUP: Clock,
  LOADED: CheckCircle,
  EN_ROUTE_DELIVERY: Clock,
  AT_DELIVERY: Clock,
  DELIVERED: CheckCircle,
  BILLING_HOLD: Clock,
  READY_TO_BILL: CheckCircle,
  INVOICED: CheckCircle,
  PAID: CheckCircle,
  CANCELLED: XCircle,
};


export function InlineStatusEditor({
  loadId,
  currentStatus,
  onStatusChange,
}: InlineStatusEditorProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [optimisticStatus, setOptimisticStatus] = React.useState<LoadStatus | null>(null);

  const updateMutation = useMutation({
    mutationFn: (status: LoadStatus) => updateLoadStatus(loadId, status),
    onMutate: async (newStatus) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['load', loadId] });
      await queryClient.cancelQueries({ queryKey: ['loads'] });

      // Snapshot the previous value
      const previousLoad = queryClient.getQueryData(['load', loadId]);
      const previousLoads = queryClient.getQueryData(['loads']);

      // Optimistically update to the new value
      setOptimisticStatus(newStatus);
      
      // Optimistically update the load in cache
      queryClient.setQueryData(['load', loadId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            status: newStatus,
          },
        };
      });

      // Optimistically update the loads list cache
      queryClient.setQueriesData({ queryKey: ['loads'] }, (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((load: any) =>
            load.id === loadId ? { ...load, status: newStatus } : load
          ),
        };
      });

      // Return a context object with the snapshotted value
      return { previousLoad, previousLoads };
    },
    onError: (error: Error, newStatus, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousLoad) {
        queryClient.setQueryData(['load', loadId], context.previousLoad);
      }
      if (context?.previousLoads) {
        queryClient.setQueryData(['loads'], context.previousLoads);
      }
      setOptimisticStatus(null);
      toast.error(error.message || 'Failed to update load status');
    },
    onSuccess: () => {
      setOptimisticStatus(null);
      toast.success('Load status updated successfully');
      // Refetch to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['load', loadId] });
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      setOpen(false);
      onStatusChange?.();
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['load', loadId] });
      queryClient.invalidateQueries({ queryKey: ['loads'] });
    },
  });

  // Show all statuses except the current one
  const availableStatuses = allStatuses.filter((status) => status !== currentStatus);

  // Use optimistic status if available, otherwise use current status
  const displayStatus = optimisticStatus || currentStatus;
  const isUpdating = updateMutation.isPending;

  const handleStatusSelect = (status: LoadStatus) => {
    // Close dropdown immediately for instant feedback
    setOpen(false);
    // Trigger the mutation (which will optimistically update)
    updateMutation.mutate(status);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 hover:bg-transparent"
          disabled={isUpdating}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Badge
            variant="outline"
            className={cn(
              statusColors[displayStatus],
              'cursor-pointer hover:opacity-80 transition-opacity',
              isUpdating && 'opacity-70'
            )}
          >
            {isUpdating && (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            )}
            {formatStatus(displayStatus)}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()} className="max-h-[300px] overflow-y-auto">
        {availableStatuses.map((status) => {
          const Icon = statusIcons[status] || CheckCircle;
          return (
            <DropdownMenuItem
              key={status}
              onClick={() => handleStatusSelect(status)}
              disabled={isUpdating}
            >
              <Icon className="h-4 w-4 mr-2" />
              {formatStatus(status)}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


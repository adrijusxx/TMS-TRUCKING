'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { LoadStatus } from '@prisma/client';

interface LoadStatusQuickActionsProps {
  loadId: string;
  currentStatus: LoadStatus;
}

async function updateLoadStatus(loadId: string, status: LoadStatus) {
  const response = await fetch(`/api/loads/${loadId}`, {
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

const statusTransitions: Record<LoadStatus, LoadStatus[]> = {
  PENDING: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['EN_ROUTE_PICKUP', 'CANCELLED'],
  EN_ROUTE_PICKUP: ['AT_PICKUP'],
  AT_PICKUP: ['LOADED'],
  LOADED: ['EN_ROUTE_DELIVERY'],
  EN_ROUTE_DELIVERY: ['AT_DELIVERY'],
  AT_DELIVERY: ['DELIVERED'],
  DELIVERED: ['INVOICED'],
  INVOICED: ['PAID'],
  PAID: [],
  CANCELLED: [],
};

const statusIcons: Record<LoadStatus, typeof CheckCircle> = {
  PENDING: Clock,
  ASSIGNED: Clock,
  EN_ROUTE_PICKUP: Clock,
  AT_PICKUP: Clock,
  LOADED: CheckCircle,
  EN_ROUTE_DELIVERY: Clock,
  AT_DELIVERY: Clock,
  DELIVERED: CheckCircle,
  INVOICED: CheckCircle,
  PAID: CheckCircle,
  CANCELLED: XCircle,
};

export default function LoadStatusQuickActions({
  loadId,
  currentStatus,
}: LoadStatusQuickActionsProps) {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (status: LoadStatus) => updateLoadStatus(loadId, status),
    onSuccess: () => {
      toast.success('Load status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['load', loadId] });
      queryClient.invalidateQueries({ queryKey: ['loads'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update load status');
    },
  });

  const availableStatuses = statusTransitions[currentStatus] || [];

  if (availableStatuses.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableStatuses.map((status) => {
          const Icon = statusIcons[status] || CheckCircle;
          return (
            <DropdownMenuItem
              key={status}
              onClick={() => updateMutation.mutate(status)}
              disabled={updateMutation.isPending}
            >
              <Icon className="h-4 w-4 mr-2" />
              {status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { LoadDispatchStatus } from '@prisma/client';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import {
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Package,
  Truck,
  AlertCircle,
} from 'lucide-react';

interface DispatchStatusSelectorProps {
  loadId: string;
  currentDispatchStatus: LoadDispatchStatus | null;
  className?: string;
}

async function updateDispatchStatus(loadId: string, dispatchStatus: LoadDispatchStatus | null) {
  const response = await fetch(apiUrl(`/api/loads/${loadId}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dispatchStatus }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update dispatch status');
  }
  return response.json();
}

const dispatchStatusOptions: Array<{
  value: LoadDispatchStatus;
  label: string;
  icon: typeof CheckCircle;
  color: string;
}> = [
  {
    value: 'BOOKED',
    label: 'Booked',
    icon: Package,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  {
    value: 'PENDING_DISPATCH',
    label: 'Pending Dispatch',
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  {
    value: 'DISPATCHED',
    label: 'Dispatched',
    icon: Truck,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  {
    value: 'ON_ROUTE_TO_PICKUP',
    label: 'On Route to Pickup',
    icon: MapPin,
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  {
    value: 'AT_PICKUP',
    label: 'At Pickup',
    icon: MapPin,
    color: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  {
    value: 'LOADED',
    label: 'Loaded',
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800 border-green-200',
  },
  {
    value: 'ON_ROUTE_TO_DELIVERY',
    label: 'On Route to Delivery',
    icon: MapPin,
    color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  },
  {
    value: 'AT_DELIVERY',
    label: 'At Delivery',
    icon: MapPin,
    color: 'bg-pink-100 text-pink-800 border-pink-200',
  },
  {
    value: 'DELIVERED',
    label: 'Delivered',
    icon: CheckCircle,
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  {
    value: 'CANCELLED',
    label: 'Cancelled',
    icon: XCircle,
    color: 'bg-red-100 text-red-800 border-red-200',
  },
];

function formatDispatchStatus(status: LoadDispatchStatus | null): string {
  if (!status) return 'Not Set';
  const option = dispatchStatusOptions.find((opt) => opt.value === status);
  return option?.label || status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function DispatchStatusSelector({
  loadId,
  currentDispatchStatus,
  className,
}: DispatchStatusSelectorProps) {
  const queryClient = useQueryClient();
  const { isDispatcher, isAdmin } = usePermissions();

  // Only show for dispatchers and admins
  if (!isDispatcher && !isAdmin) {
    return null;
  }

  const updateMutation = useMutation({
    mutationFn: (status: LoadDispatchStatus | null) => updateDispatchStatus(loadId, status),
    onSuccess: () => {
      toast.success('Dispatch status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['load', loadId] });
      queryClient.invalidateQueries({ queryKey: ['loads'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update dispatch status');
    },
  });

  const currentOption = currentDispatchStatus
    ? dispatchStatusOptions.find((opt) => opt.value === currentDispatchStatus)
    : null;

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-auto">
            <div className="flex items-center gap-2">
              {currentOption ? (
                <>
                  <currentOption.icon className="h-4 w-4" />
                  <span className="text-sm">{formatDispatchStatus(currentDispatchStatus)}</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Set Dispatch Status</span>
                </>
              )}
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            onClick={() => updateMutation.mutate(null)}
            disabled={updateMutation.isPending || currentDispatchStatus === null}
          >
            <AlertCircle className="h-4 w-4 mr-2 text-muted-foreground" />
            Clear Status
          </DropdownMenuItem>
          {dispatchStatusOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = currentDispatchStatus === option.value;
            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => updateMutation.mutate(option.value)}
                disabled={updateMutation.isPending || isSelected}
                className={isSelected ? 'bg-muted' : ''}
              >
                <Icon className="h-4 w-4 mr-2" />
                {option.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Badge component for displaying dispatch status
export function DispatchStatusBadge({ status }: { status: LoadDispatchStatus | null }) {
  if (!status) return null;

  const option = dispatchStatusOptions.find((opt) => opt.value === status);
  if (!option) return null;

  const Icon = option.icon;

  return (
    <Badge variant="outline" className={option.color}>
      <Icon className="h-3 w-3 mr-1" />
      {option.label}
    </Badge>
  );
}


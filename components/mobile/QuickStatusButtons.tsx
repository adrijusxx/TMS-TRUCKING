/**
 * Quick Status Buttons
 *
 * Large, thumb-friendly buttons for common load status transitions.
 * Based on the current load status, shows the single next logical status.
 * Includes a confirmation dialog and offline queueing support.
 */

'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Truck,
  MapPin,
  Package,
  Navigation,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePWA } from '@/hooks/usePWA';
import { saveOfflineData } from '@/lib/mobile/offline-storage';
import { apiUrl } from '@/lib/utils';

interface QuickStatusButtonsProps {
  loadId: string;
  currentStatus: string;
}

interface StatusTransition {
  nextStatus: string;
  label: string;
  icon: React.ElementType;
  color: string;
  description: string;
}

/** Map from current status to the next logical transition. */
const STATUS_TRANSITIONS: Record<string, StatusTransition> = {
  ASSIGNED: {
    nextStatus: 'EN_ROUTE_PICKUP',
    label: 'En Route to Pickup',
    icon: Navigation,
    color: 'bg-blue-600 hover:bg-blue-700 text-white',
    description: 'Confirm you are driving to the pickup location.',
  },
  EN_ROUTE_PICKUP: {
    nextStatus: 'AT_PICKUP',
    label: 'Arrived at Pickup',
    icon: MapPin,
    color: 'bg-orange-600 hover:bg-orange-700 text-white',
    description: 'Confirm you have arrived at the pickup location.',
  },
  AT_PICKUP: {
    nextStatus: 'LOADED',
    label: 'Loaded',
    icon: Package,
    color: 'bg-green-600 hover:bg-green-700 text-white',
    description: 'Confirm the truck has been loaded.',
  },
  LOADED: {
    nextStatus: 'EN_ROUTE_DELIVERY',
    label: 'En Route to Delivery',
    icon: Truck,
    color: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    description: 'Confirm you are driving to the delivery location.',
  },
  EN_ROUTE_DELIVERY: {
    nextStatus: 'AT_DELIVERY',
    label: 'Arrived at Delivery',
    icon: MapPin,
    color: 'bg-purple-600 hover:bg-purple-700 text-white',
    description: 'Confirm you have arrived at the delivery location.',
  },
  AT_DELIVERY: {
    nextStatus: 'DELIVERED',
    label: 'Delivered',
    icon: CheckCircle,
    color: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    description: 'Confirm the load has been delivered.',
  },
};

export default function QuickStatusButtons({
  loadId,
  currentStatus,
}: QuickStatusButtonsProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const queryClient = useQueryClient();
  const { isOffline } = usePWA();

  const transition = STATUS_TRANSITIONS[currentStatus];

  const updateMutation = useMutation({
    mutationFn: async (nextStatus: string) => {
      if (isOffline) {
        // Queue for later sync
        await saveOfflineData('pending-status-updates', `status-${loadId}-${Date.now()}`, {
          loadId,
          status: nextStatus,
          timestamp: Date.now(),
        });
        return { queued: true };
      }

      const response = await fetch(apiUrl(`/api/mobile/loads/${loadId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update status');
      }

      return response.json();
    },
    onSuccess: (result) => {
      if (result && 'queued' in result) {
        toast.info('Status update queued. It will sync when you are back online.');
      } else {
        toast.success(`Status updated to "${transition?.label}"`);
      }
      queryClient.invalidateQueries({ queryKey: ['driver-load', loadId] });
      queryClient.invalidateQueries({ queryKey: ['driver-loads'] });
      queryClient.invalidateQueries({ queryKey: ['driver-stats'] });
      setShowConfirm(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update status');
    },
  });

  const handleConfirm = useCallback(() => {
    if (!transition) return;
    updateMutation.mutate(transition.nextStatus);
  }, [transition, updateMutation]);

  // No transition available for this status
  if (!transition) return null;

  const Icon = transition.icon;

  return (
    <>
      <Button
        size="lg"
        className={`w-full h-16 text-lg font-semibold rounded-xl shadow-md active:scale-[0.98] transition-transform ${transition.color}`}
        onClick={() => setShowConfirm(true)}
        disabled={updateMutation.isPending}
      >
        {updateMutation.isPending ? (
          <>
            <Loader2 className="h-6 w-6 mr-3 animate-spin" />
            Updating...
          </>
        ) : (
          <>
            <Icon className="h-6 w-6 mr-3" />
            {transition.label}
          </>
        )}
      </Button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Status</AlertDialogTitle>
            <AlertDialogDescription>
              {transition.description}
              {isOffline && (
                <span className="block mt-2 text-yellow-600 font-medium">
                  You are offline. This update will be queued and synced automatically.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={updateMutation.isPending}
              className={transition.color}
            >
              {updateMutation.isPending ? 'Updating...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

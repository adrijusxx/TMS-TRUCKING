'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Truck, Package, Loader2, AlertCircle } from 'lucide-react';
import TruckCombobox from '@/components/trucks/TruckCombobox';
import TrailerCombobox from '@/components/trailers/TrailerCombobox';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';

interface QuickAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driver: {
    id: string;
    driverNumber: string;
    user: {
      firstName: string;
      lastName: string;
    };
    currentTruck?: {
      id: string;
      truckNumber: string;
    } | null;
    currentTrailer?: {
      id: string;
      trailerNumber: string;
    } | null;
  };
}

async function fetchTrucks() {
  const response = await fetch(apiUrl('/api/trucks?limit=1000&status=AVAILABLE'));
  if (!response.ok) throw new Error('Failed to fetch trucks');
  return response.json();
}

async function fetchTrailers() {
  const response = await fetch(apiUrl('/api/trailers?limit=1000'));
  if (!response.ok) throw new Error('Failed to fetch trailers');
  return response.json();
}

async function updateDriverAssignment(
  driverId: string,
  data: { currentTruckId?: string | null; currentTrailerId?: string | null; reason?: string }
) {
  const response = await fetch(apiUrl(`/api/drivers/${driverId}/assign`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update assignment');
  }
  return response.json();
}

export default function QuickAssignmentDialog({
  open,
  onOpenChange,
  driver,
}: QuickAssignmentDialogProps) {
  const queryClient = useQueryClient();
  const [selectedTruckId, setSelectedTruckId] = useState<string>('');
  const [selectedTrailerNumber, setSelectedTrailerNumber] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  const { data: trucksData } = useQuery({
    queryKey: ['trucks', 'quick-assign'],
    queryFn: fetchTrucks,
    enabled: open,
  });

  const { data: trailersData } = useQuery({
    queryKey: ['trailers', 'quick-assign'],
    queryFn: fetchTrailers,
    enabled: open,
  });

  interface Trailer {
    id: string;
    trailerNumber: string;
  }

  interface Truck {
    id: string;
    truckNumber: string;
  }

  const trucks: Truck[] = trucksData?.data || [];
  const trailers: Trailer[] = trailersData?.data || [];

  // Initialize with current assignments
  useEffect(() => {
    if (open && driver) {
      setSelectedTruckId(driver.currentTruck?.id || '');
      setSelectedTrailerNumber(driver.currentTrailer?.trailerNumber || '');
      setReason('');
    }
  }, [open, driver]);

  const assignmentMutation = useMutation({
    mutationFn: (data: { currentTruckId?: string | null; currentTrailerId?: string | null; reason?: string }) =>
      updateDriverAssignment(driver.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['driver', driver.id] });
      queryClient.invalidateQueries({ queryKey: ['trucks'] });
      queryClient.invalidateQueries({ queryKey: ['trailers'] });
      toast.success('Assignment updated successfully');
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update assignment');
    },
  });

  const handleSave = () => {
    const truckChanged = selectedTruckId !== (driver.currentTruck?.id || '');
    const trailerChanged = selectedTrailerNumber !== (driver.currentTrailer?.trailerNumber || '');

    if (!truckChanged && !trailerChanged) {
      toast.info('No changes to save');
      return;
    }

    // Find trailer ID from trailer number
    const selectedTrailer = trailers.find((t) => t.trailerNumber === selectedTrailerNumber);
    const trailerId = selectedTrailer?.id || null;

    assignmentMutation.mutate({
      currentTruckId: selectedTruckId || null,
      currentTrailerId: trailerId,
      reason: reason.trim() || undefined,
    });
  };

  const truckChanged = selectedTruckId !== (driver.currentTruck?.id || '');
  const trailerChanged = selectedTrailerNumber !== (driver.currentTrailer?.trailerNumber || '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Quick Assignment Change</DialogTitle>
          <DialogDescription>
            Update truck and trailer assignment for{' '}
            <span className="font-medium">
              {driver.user.firstName} {driver.user.lastName} (#{driver.driverNumber})
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Assignments Display */}
          <div className="p-3 bg-muted rounded-md space-y-2">
            <p className="text-sm font-medium">Current Assignments:</p>
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span>
                  Truck:{' '}
                  {driver.currentTruck ? (
                    <span className="font-medium">#{driver.currentTruck.truckNumber}</span>
                  ) : (
                    <span className="text-muted-foreground">None</span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span>
                  Trailer:{' '}
                  {driver.currentTrailer ? (
                    <span className="font-medium">#{driver.currentTrailer.trailerNumber}</span>
                  ) : (
                    <span className="text-muted-foreground">None</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Truck Selection */}
          <div className="space-y-2">
            <Label htmlFor="truck" className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-muted-foreground" />
              Truck Assignment
            </Label>
            <TruckCombobox
              value={selectedTruckId}
              onValueChange={setSelectedTruckId}
              placeholder="Search truck by number..."
              trucks={trucks}
            />
            {truckChanged && (
              <p className="text-xs text-muted-foreground">
                Changing from{' '}
                {driver.currentTruck ? `#${driver.currentTruck.truckNumber}` : 'None'} to{' '}
                {selectedTruckId
                  ? `#${trucks.find((t) => t.id === selectedTruckId)?.truckNumber || 'Unknown'}`
                  : 'None'}
              </p>
            )}
          </div>

          {/* Trailer Selection */}
          <div className="space-y-2">
            <Label htmlFor="trailer" className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              Trailer Assignment
            </Label>
            <TrailerCombobox
              value={selectedTrailerNumber}
              onValueChange={setSelectedTrailerNumber}
              placeholder="Search trailer by number..."
              trailers={trailers}
            />
            {trailerChanged && (
              <p className="text-xs text-muted-foreground">
                Changing from{' '}
                {driver.currentTrailer ? `#${driver.currentTrailer.trailerNumber}` : 'None'} to{' '}
                {selectedTrailerNumber ? `#${selectedTrailerNumber}` : 'None'}
              </p>
            )}
          </div>

          {/* Reason (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Change (Optional)</Label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Re-power, maintenance swap, etc."
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Warning if truck changed */}
          {truckChanged && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Changing the truck assignment will automatically split any active loads if needed.
                This action will be recorded in the driver's truck history.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={assignmentMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={assignmentMutation.isPending || (!truckChanged && !trailerChanged)}
          >
            {assignmentMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Assignment'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


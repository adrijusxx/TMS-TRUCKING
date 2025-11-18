'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Package, Truck, User } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';

interface LoadAssignmentDialogProps {
  load: {
    id: string;
    loadNumber: string;
    pickupCity: string;
    pickupState: string;
    deliveryCity: string;
    deliveryState: string;
  } | null;
  availableDrivers: any[];
  availableTrucks: any[];
  onAssign?: (driverId?: string, truckId?: string) => void;
  selectedLoadIds?: string[];
  isBulk?: boolean;
}

async function assignLoad(loadId: string, driverId: string | undefined, truckId: string | undefined) {
  const body: any = {};
  if (driverId && driverId !== 'none') {
    body.driverId = driverId;
  }
  if (truckId && truckId !== 'none') {
    body.truckId = truckId;
  }

  const response = await fetch(apiUrl(`/api/loads/${loadId}/assign`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to assign load');
  }
  return response.json();
}

export default function LoadAssignmentDialog({
  load,
  availableDrivers,
  availableTrucks,
  onAssign,
  selectedLoadIds,
  isBulk = false,
}: LoadAssignmentDialogProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<string>('none');
  const [selectedTruck, setSelectedTruck] = useState<string>('none');
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedDriver('none');
      setSelectedTruck('none');
      setError(null);
    }
  }, [isOpen]);

  const assignMutation = useMutation({
    mutationFn: () => {
      const driverId = selectedDriver === 'none' ? undefined : selectedDriver;
      const truckId = selectedTruck === 'none' ? undefined : selectedTruck;
      if (isBulk && onAssign) {
        onAssign(driverId, truckId);
        return Promise.resolve({ success: true });
      }
      if (!load) throw new Error('Load is required');
      return assignLoad(load.id, driverId, truckId);
    },
    onSuccess: () => {
      if (!isBulk) {
        queryClient.invalidateQueries({ queryKey: ['dispatch-board'] });
        queryClient.invalidateQueries({ queryKey: ['loads'] });
        if (load?.id) {
          queryClient.invalidateQueries({ queryKey: ['load', load.id] });
        }
        toast.success('Load assigned successfully');
        if (onAssign) {
          onAssign();
        }
      } else {
        toast.success(`${selectedLoadIds?.length || 0} load(s) assigned successfully`);
      }
      setIsOpen(false);
      setSelectedDriver('none');
      setSelectedTruck('none');
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleAssign = () => {
    const driverId = selectedDriver === 'none' ? undefined : selectedDriver;
    const truckId = selectedTruck === 'none' ? undefined : selectedTruck;
    
    if (!driverId && !truckId) {
      setError('Please select at least a driver or truck');
      return;
    }
    setError(null);
    assignMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={isBulk ? 'default' : 'outline'}>
          {isBulk ? 'Bulk Assign' : 'Assign'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isBulk
              ? `Assign ${selectedLoadIds?.length || 0} Load(s)`
              : `Assign Load ${load?.loadNumber}`}
          </DialogTitle>
          <DialogDescription>
            {isBulk
              ? 'Assign a driver and/or truck to selected loads'
              : 'Assign a driver and/or truck to this load'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!isBulk && load && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">{load.loadNumber}</p>
              <p className="text-sm text-muted-foreground">
                {load.pickupCity}, {load.pickupState} → {load.deliveryCity},{' '}
                {load.deliveryState}
              </p>
            </div>
          )}
          {isBulk && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium">
                {selectedLoadIds?.length || 0} load(s) selected for bulk assignment
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="driver">Driver *</Label>
            <Select value={selectedDriver} onValueChange={setSelectedDriver}>
              <SelectTrigger>
                <SelectValue placeholder="Select a driver" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {availableDrivers && availableDrivers.length > 0 ? (
                  availableDrivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.user?.firstName} {driver.user?.lastName} ({driver.driverNumber})
                      {driver.currentTruck && (
                        <span className="text-muted-foreground">
                          {' '}
                          - {driver.currentTruck.truckNumber}
                        </span>
                      )}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    No drivers available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">At least one driver or truck is required</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="truck">Truck *</Label>
            <Select value={selectedTruck} onValueChange={setSelectedTruck}>
              <SelectTrigger>
                <SelectValue placeholder="Select a truck" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {availableTrucks && availableTrucks.length > 0 ? (
                  availableTrucks.map((truck) => (
                    <SelectItem key={truck.id} value={truck.id}>
                      {truck.truckNumber} - {truck.equipmentType?.replace(/_/g, ' ') || 'Unknown'}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    No trucks available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">At least one driver or truck is required</p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={assignMutation.isPending || (selectedDriver === 'none' && selectedTruck === 'none')}
            >
              {assignMutation.isPending
                ? 'Assigning...'
                : isBulk
                ? `Assign ${selectedLoadIds?.length || 0} Load(s)`
                : 'Assign Load'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


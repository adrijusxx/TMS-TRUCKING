'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { LoadStatus } from '@prisma/client';
import { apiUrl } from '@/lib/utils';

interface LoadStatusUpdateProps {
  loadId: string;
  currentStatus: string;
}

const statusOptions = [
  { value: 'EN_ROUTE_PICKUP', label: 'En Route to Pickup' },
  { value: 'AT_PICKUP', label: 'At Pickup' },
  { value: 'LOADED', label: 'Loaded' },
  { value: 'EN_ROUTE_DELIVERY', label: 'En Route to Delivery' },
  { value: 'AT_DELIVERY', label: 'At Delivery' },
  { value: 'DELIVERED', label: 'Delivered' },
];

async function updateLoadStatus(loadId: string, status: string, notes?: string) {
  const response = await fetch(apiUrl(`/api/mobile/loads/${loadId}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status,
      notes,
    }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update load status');
  }
  return response.json();
}

export default function LoadStatusUpdate({ loadId, currentStatus }: LoadStatusUpdateProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({ status, notes }: { status: string; notes?: string }) =>
      updateLoadStatus(loadId, status, notes),
    onSuccess: () => {
      toast.success('Load status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['driver-load', loadId] });
      queryClient.invalidateQueries({ queryKey: ['driver-loads'] });
      setOpen(false);
      setStatus('');
      setNotes('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update load status');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!status) {
      toast.error('Please select a status');
      return;
    }
    updateMutation.mutate({ status, notes: notes || undefined });
  };

  // Filter out current status and previous statuses
  const availableStatuses = statusOptions.filter((option) => {
    const statusOrder = [
      'ASSIGNED',
      'EN_ROUTE_PICKUP',
      'AT_PICKUP',
      'LOADED',
      'EN_ROUTE_DELIVERY',
      'AT_DELIVERY',
      'DELIVERED',
    ];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const optionIndex = statusOrder.indexOf(option.value);
    return optionIndex > currentIndex;
  });

  if (availableStatuses.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" size="lg">
          <CheckCircle className="h-5 w-5 mr-2" />
          Update Status
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Load Status</DialogTitle>
          <DialogDescription>
            Update the status of this load
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status">New Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this status update..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!status || updateMutation.isPending}
              className="flex-1"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Status'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


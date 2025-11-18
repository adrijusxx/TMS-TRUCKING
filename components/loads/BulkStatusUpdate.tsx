'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { LoadStatus } from '@prisma/client';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';
import { apiUrl } from '@/lib/utils';

interface BulkStatusUpdateProps {
  selectedLoadIds: string[];
  onSuccess?: () => void;
}

const statusOptions: LoadStatus[] = [
  'PENDING',
  'ASSIGNED',
  'EN_ROUTE_PICKUP',
  'AT_PICKUP',
  'LOADED',
  'EN_ROUTE_DELIVERY',
  'AT_DELIVERY',
  'DELIVERED',
  'INVOICED',
  'PAID',
  'CANCELLED',
];

function formatStatus(status: LoadStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

async function bulkUpdateStatus(loadIds: string[], status: LoadStatus) {
  const response = await fetch(apiUrl('/api/loads/bulk'), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      loadIds,
      updates: {
        status,
      },
    }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update load statuses');
  }
  return response.json();
}

export default function BulkStatusUpdate({ selectedLoadIds, onSuccess }: BulkStatusUpdateProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<LoadStatus | ''>('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (status: LoadStatus) => bulkUpdateStatus(selectedLoadIds, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      toast.success(`Updated ${selectedLoadIds.length} load(s) status`);
      setOpen(false);
      setStatus('');
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update load statuses');
    },
  });

  const handleSubmit = () => {
    if (!status) {
      toast.error('Please select a status');
      return;
    }
    mutation.mutate(status as LoadStatus);
  };

  if (selectedLoadIds.length === 0) {
    return null;
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={selectedLoadIds.length === 0}
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Update Status ({selectedLoadIds.length})
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Update Status</DialogTitle>
            <DialogDescription>
              Update status for {selectedLoadIds.length} selected load(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">New Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as LoadStatus)}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {formatStatus(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={mutation.isPending || !status}>
              {mutation.isPending ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


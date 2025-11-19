'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PayType } from '@prisma/client';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';

interface BulkUpdatePayDialogProps {
  selectedDriverIds?: string[];
  trigger?: React.ReactNode;
}

async function bulkUpdatePay(data: { payRate: number; payType?: PayType; driverIds?: string[] }) {
  const response = await fetch(apiUrl('/api/drivers/bulk-update-pay'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update driver pay');
  }
  return response.json();
}

export default function BulkUpdatePayDialog({
  selectedDriverIds,
  trigger,
}: BulkUpdatePayDialogProps) {
  const [open, setOpen] = useState(false);
  const [payRate, setPayRate] = useState('0.63');
  const [payType, setPayType] = useState<PayType>('PER_MILE');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: bulkUpdatePay,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success(`Updated pay rate for ${data.count} driver(s)`);
      setOpen(false);
      setPayRate('0.63');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update driver pay');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      payRate: parseFloat(payRate),
      payType,
      driverIds: selectedDriverIds && selectedDriverIds.length > 0 ? selectedDriverIds : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk Update Driver Pay</DialogTitle>
          <DialogDescription>
            {selectedDriverIds && selectedDriverIds.length > 0
              ? `Update pay rate for ${selectedDriverIds.length} selected driver(s)`
              : 'Update pay rate for all drivers'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payType">Pay Type</Label>
            <Select value={payType} onValueChange={(value) => setPayType(value as PayType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PER_MILE">Per Mile</SelectItem>
                <SelectItem value="PER_LOAD">Per Load</SelectItem>
                <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                <SelectItem value="HOURLY">Hourly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="payRate">Pay Rate</Label>
            <Input
              id="payRate"
              type="number"
              step="0.01"
              value={payRate}
              onChange={(e) => setPayRate(e.target.value)}
              placeholder="0.63"
              required
            />
            <p className="text-sm text-muted-foreground">
              {payType === 'PER_MILE' && 'Amount per mile'}
              {payType === 'PER_LOAD' && 'Amount per load'}
              {payType === 'PERCENTAGE' && 'Percentage of revenue'}
              {payType === 'HOURLY' && 'Amount per hour'}
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Updating...' : 'Update Pay Rate'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


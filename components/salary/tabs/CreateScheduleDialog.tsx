'use client';

import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
import DeductionRuleForm from '@/components/drivers/DriverEditTabs/DeductionRuleForm';

interface CreateScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAddition?: boolean;
}

export default function CreateScheduleDialog({ open, onOpenChange, isAddition = false }: CreateScheduleDialogProps) {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = React.useState(false);

  const handleCreate = async (data: any) => {
    setIsCreating(true);
    try {
      const res = await fetch(apiUrl('/api/deduction-rules'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, isActive: true }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed');
      }
      toast.success('Scheduled payment created');
      queryClient.invalidateQueries({ queryKey: ['deduction-rules-scheduled'] });
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Scheduled {isAddition ? 'Addition' : 'Deduction'}</DialogTitle>
          <DialogDescription>Set up a recurring {isAddition ? 'addition' : 'deduction'} for drivers.</DialogDescription>
        </DialogHeader>
        <DeductionRuleForm
          isAddition={isAddition}
          onSubmit={handleCreate}
          isPending={isCreating}
        />
      </DialogContent>
    </Dialog>
  );
}

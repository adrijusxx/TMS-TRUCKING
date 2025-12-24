'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EditableRateConfCellProps {
  loadId: string;
  rateConfId: string | null;
  rateConfNumber: string | null;
  onUpdate?: () => void;
}

async function updateRateConfirmation(rateConfId: string, rateConfNumber: string) {
  const response = await fetch(apiUrl(`/api/rate-confirmations/${rateConfId}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rateConfNumber }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update rate confirmation');
  }
  return response.json();
}

export default function EditableRateConfCell({
  loadId,
  rateConfId,
  rateConfNumber,
  onUpdate,
}: EditableRateConfCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(rateConfNumber || '');
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (newValue: string) => {
      if (!rateConfId) {
        throw new Error('Rate confirmation ID is required');
      }
      return updateRateConfirmation(rateConfId, newValue);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      queryClient.invalidateQueries({ queryKey: ['load', loadId] });
      toast.success('Rate confirmation number updated');
      setIsEditing(false);
      onUpdate?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update rate confirmation number');
    },
  });

  const handleSave = () => {
    if (!rateConfId) {
      toast.error('Rate confirmation not found');
      return;
    }
    updateMutation.mutate(value);
  };

  const handleCancel = () => {
    setValue(rateConfNumber || '');
    setIsEditing(false);
  };

  if (!rateConfId) {
    return <span className="text-muted-foreground">N/A</span>;
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-7 w-32"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSave();
            } else if (e.key === 'Escape') {
              handleCancel();
            }
          }}
        />
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={handleSave}
          disabled={updateMutation.isPending}
        >
          <Check className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={handleCancel}
          disabled={updateMutation.isPending}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="text-left hover:underline text-primary cursor-pointer"
      title="Click to edit"
    >
      {rateConfNumber || 'N/A'}
    </button>
  );
}




























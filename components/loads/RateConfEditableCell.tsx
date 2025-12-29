'use client';

import { EditableCell } from '@/components/ui/editable-cell';
import { apiUrl } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface RateConfEditableCellProps {
  loadId: string;
  rateConfId: string | null;
  rateConfNumber: string | null;
}

/**
 * Editable cell for Rate Confirmation Number
 * Uses EditableCell component with custom handler for rate confirmation updates
 */
export function RateConfEditableCell({
  loadId,
  rateConfId,
  rateConfNumber,
}: RateConfEditableCellProps) {
  const queryClient = useQueryClient();

  const handleSave = async (
    rowId: string,
    columnId: string,
    value: string | number
  ): Promise<void> => {
    if (!rateConfId) {
      toast.error('Rate confirmation not found');
      throw new Error('Rate confirmation ID is required');
    }

    try {
      const response = await fetch(apiUrl(`/api/rate-confirmations/${rateConfId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rateConfNumber: String(value) }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update rate confirmation');
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      queryClient.invalidateQueries({ queryKey: ['load', loadId] });
      toast.success('Rate confirmation number updated');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update rate confirmation number';
      toast.error(message);
      throw error;
    }
  };

  if (!rateConfId) {
    return <span className="text-muted-foreground">N/A</span>;
  }

  return (
    <EditableCell
      value={rateConfNumber}
      rowId={loadId}
      columnId="rateConfNumber"
      onSave={handleSave}
      type="text"
      placeholder="Rate Con #"
    />
  );
}




























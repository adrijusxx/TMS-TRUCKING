'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { apiUrl } from '@/lib/utils';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface BatchInfoCardsProps {
  batch: any;
  batchId: string;
}

export default function BatchInfoCards({ batch, batchId }: BatchInfoCardsProps) {
  const queryClient = useQueryClient();
  const [editNotes, setEditNotes] = useState(batch.notes || '');
  const [editMc, setEditMc] = useState(batch.mcNumber || '');

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(apiUrl(`/api/batches/${batchId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: editNotes || null, mcNumber: editMc || null }),
      });
      if (!res.ok) throw new Error('Failed to save');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch', batchId] });
      toast.success('Batch updated');
    },
    onError: () => toast.error('Failed to save batch fields'),
  });

  const isDirty = editNotes !== (batch.notes || '') || editMc !== (batch.mcNumber || '');

  return (
    <div className="space-y-3">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">MC Number</label>
          <Input
            value={editMc}
            onChange={(e) => setEditMc(e.target.value)}
            placeholder="MC-XXXXXX"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Notes</label>
          <Textarea
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            placeholder="Batch notes..."
            rows={2}
          />
        </div>
      </div>
      {isDirty && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Save, X } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';

interface LocationInlineEditProps {
  row: {
    id: string;
    name: string;
    address: string;
    notes?: string | null;
  };
  onSave?: () => void;
  onCancel?: () => void;
}

async function updateLocation(locationId: string, data: any) {
  const response = await fetch(apiUrl(`/api/locations/${locationId}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update location');
  }
  return response.json();
}

export default function LocationInlineEdit({ row, onSave, onCancel }: LocationInlineEditProps) {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: row.name || '',
      address: row.address || '',
      notes: row.notes || '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateLocation(row.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.invalidateQueries({ queryKey: ['location', row.id] });
      toast.success('Location updated successfully');
      onSave?.();
      setIsSaving(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update location');
      setIsSaving(false);
    },
  });

  const onSubmit = (data: any) => {
    setIsSaving(true);
    const updateData: any = {
      name: data.name,
      address: data.address,
      notes: data.notes || null,
    };
    updateMutation.mutate(updateData);
  };

  return (
    <Card className="m-4 border-l-4 border-l-primary">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register('name', { required: 'Name is required' })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...register('address', { required: 'Address is required' })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              rows={3}
              placeholder="Additional notes about this location..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSaving || updateMutation.isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving || updateMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving || updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}




























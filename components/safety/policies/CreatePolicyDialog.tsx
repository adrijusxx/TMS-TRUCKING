'use client';

import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { PolicyData } from './PoliciesColumns';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editPolicy?: PolicyData | null;
}

const categories = [
  { value: 'ACCIDENT_PROCEDURES', label: 'Accident Procedures' },
  { value: 'DRUG_ALCOHOL_POLICY', label: 'Drug & Alcohol Policy' },
  { value: 'VEHICLE_USE_POLICY', label: 'Vehicle Use Policy' },
  { value: 'PERSONAL_CONDUCT', label: 'Personal Conduct' },
  { value: 'OTHER', label: 'Other' },
];

export default function CreatePolicyDialog({ open, onOpenChange, onSuccess, editPolicy }: Props) {
  const isEdit = !!editPolicy;

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const data = {
        policyName: formData.get('policyName'),
        category: formData.get('category'),
        content: formData.get('content'),
        effectiveDate: formData.get('effectiveDate'),
      };

      const url = isEdit ? apiUrl(`/api/safety/policies/${editPolicy.id}`) : apiUrl('/api/safety/policies');
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to save policy');
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Policy updated' : 'Policy created');
      onOpenChange(false);
      onSuccess();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Policy' : 'Create Safety Policy'}</DialogTitle>
        </DialogHeader>
        <form action={(formData) => mutation.mutate(formData)} className="space-y-4">
          <div>
            <Label htmlFor="policyName">Policy Name *</Label>
            <Input id="policyName" name="policyName" required defaultValue={editPolicy?.policyName ?? ''} />
          </div>
          <div>
            <Label htmlFor="category">Category *</Label>
            <Select name="category" defaultValue={editPolicy?.category ?? 'OTHER'}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="effectiveDate">Effective Date *</Label>
            <Input id="effectiveDate" name="effectiveDate" type="date" required defaultValue={editPolicy ? new Date(editPolicy.effectiveDate).toISOString().split('T')[0] : ''} />
          </div>
          <div>
            <Label htmlFor="content">Policy Content *</Label>
            <Textarea id="content" name="content" rows={8} required defaultValue={editPolicy?.content ?? ''} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

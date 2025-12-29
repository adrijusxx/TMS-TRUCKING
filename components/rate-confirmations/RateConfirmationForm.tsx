'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency, apiUrl } from '@/lib/utils';
import { toast } from 'sonner';

interface RateConfirmationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loadId?: string;
  confirmationId?: string;
  onSuccess?: () => void;
}

async function fetchLoads() {
  const response = await fetch(apiUrl('/api/loads?limit=1000'));
  if (!response.ok) throw new Error('Failed to fetch loads');
  return response.json();
}

async function fetchConfirmation(confirmationId: string) {
  const response = await fetch(apiUrl(`/api/rate-confirmations/${confirmationId}`));
  if (!response.ok) throw new Error('Failed to fetch rate confirmation');
  return response.json();
}

export default function RateConfirmationForm({
  open,
  onOpenChange,
  loadId,
  confirmationId,
  onSuccess,
}: RateConfirmationFormProps) {
  const [formData, setFormData] = useState({
    loadId: loadId || '',
    rateConfNumber: '',
    baseRate: 0,
    fuelSurcharge: 0,
    accessorialCharges: 0,
    totalRate: 0,
    paymentTerms: 30,
    paymentMethod: '',
    notes: '',
  });
  const queryClient = useQueryClient();
  const isEditing = !!confirmationId;

  // Fetch loads for dropdown
  const { data: loadsData } = useQuery({
    queryKey: ['loads-dropdown-form'],
    queryFn: fetchLoads,
    enabled: open && !loadId,
    staleTime: 60000,
  });

  // Fetch existing confirmation if editing
  const { data: confirmationData } = useQuery({
    queryKey: ['rate-confirmation', confirmationId],
    queryFn: () => fetchConfirmation(confirmationId!),
    enabled: isEditing && !!confirmationId && open,
  });

  // Populate form when editing
  useEffect(() => {
    if (confirmationData?.data && isEditing) {
      const conf = confirmationData.data;
      setFormData({
        loadId: conf.loadId,
        rateConfNumber: conf.rateConfNumber || '',
        baseRate: conf.baseRate,
        fuelSurcharge: conf.fuelSurcharge,
        accessorialCharges: conf.accessorialCharges,
        totalRate: conf.totalRate,
        paymentTerms: conf.paymentTerms,
        paymentMethod: conf.paymentMethod || '',
        notes: conf.notes || '',
      });
    } else if (loadId) {
      setFormData((prev) => ({ ...prev, loadId }));
    }
  }, [confirmationData, isEditing, loadId]);

  // Auto-calculate total when rates change
  useEffect(() => {
    const total =
      (formData.baseRate || 0) +
      (formData.fuelSurcharge || 0) +
      (formData.accessorialCharges || 0);
    setFormData((prev) => ({ ...prev, totalRate: total }));
  }, [formData.baseRate, formData.fuelSurcharge, formData.accessorialCharges]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(apiUrl('/api/rate-confirmations'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create rate confirmation');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Rate confirmation created');
      queryClient.invalidateQueries({ queryKey: ['rate-confirmations'] });
      onOpenChange(false);
      onSuccess?.();
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create rate confirmation');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(apiUrl(`/api/rate-confirmations/${confirmationId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update rate confirmation');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Rate confirmation updated');
      queryClient.invalidateQueries({ queryKey: ['rate-confirmations'] });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update rate confirmation');
    },
  });

  const resetForm = () => {
    setFormData({
      loadId: loadId || '',
      rateConfNumber: '',
      baseRate: 0,
      fuelSurcharge: 0,
      accessorialCharges: 0,
      totalRate: 0,
      paymentTerms: 30,
      paymentMethod: '',
      notes: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.loadId) {
      toast.error('Load is required');
      return;
    }

    if (formData.totalRate <= 0) {
      toast.error('Total rate must be greater than 0');
      return;
    }

    if (isEditing) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const loads = loadsData?.data || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Rate Confirmation' : 'Create Rate Confirmation'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update rate confirmation details'
              : 'Enter rate confirmation information for a load'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Load Selection */}
            {!loadId && (
              <div className="space-y-2">
                <Label htmlFor="loadId">Load *</Label>
                <Select
                  value={formData.loadId}
                  onValueChange={(value) => setFormData({ ...formData, loadId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a load" />
                  </SelectTrigger>
                  <SelectContent>
                    {loads.map((load: any) => (
                      <SelectItem key={load.id} value={load.id}>
                        {load.loadNumber} - {load.customer?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Rate Confirmation Number */}
            <div className="space-y-2">
              <Label htmlFor="rateConfNumber">Confirmation Number</Label>
              <Input
                id="rateConfNumber"
                value={formData.rateConfNumber}
                onChange={(e) => setFormData({ ...formData, rateConfNumber: e.target.value })}
                placeholder="RC-12345"
              />
            </div>

            {/* Rate Breakdown */}
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-900">Rate Breakdown</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="baseRate">Base Rate *</Label>
                  <Input
                    id="baseRate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.baseRate}
                    onChange={(e) =>
                      setFormData({ ...formData, baseRate: parseFloat(e.target.value) || 0 })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fuelSurcharge">Fuel Surcharge</Label>
                  <Input
                    id="fuelSurcharge"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.fuelSurcharge}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fuelSurcharge: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accessorialCharges">Accessorials</Label>
                  <Input
                    id="accessorialCharges"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.accessorialCharges}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        accessorialCharges: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <div className="pt-2 border-t border-blue-300">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-blue-900">Total Rate:</span>
                  <span className="text-lg font-bold text-blue-900">
                    {formatCurrency(formData.totalRate)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Terms */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment Terms (days)</Label>
                <Input
                  id="paymentTerms"
                  type="number"
                  min="0"
                  value={formData.paymentTerms}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentTerms: parseInt(e.target.value) || 30 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select
                  value={formData.paymentMethod || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, paymentMethod: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="FACTOR">Factor</SelectItem>
                    <SelectItem value="DIRECT">Direct</SelectItem>
                    <SelectItem value="QUICK_PAY">Quick Pay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this rate confirmation"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                createMutation.isPending ||
                updateMutation.isPending ||
                !formData.loadId ||
                formData.totalRate <= 0
              }
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : isEditing
                  ? 'Update'
                  : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


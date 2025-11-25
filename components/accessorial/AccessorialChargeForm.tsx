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
import { AccessorialChargeType } from '@prisma/client';
import { formatCurrency, apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
import LoadCombobox from '@/components/loads/LoadCombobox';

interface AccessorialChargeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loadId?: string;
  chargeId?: string;
  onSuccess?: () => void;
}

const chargeTypeLabels: Record<AccessorialChargeType, string> = {
  DETENTION: 'Detention',
  LAYOVER: 'Layover',
  TONU: 'TONU (Truck Ordered Not Used)',
  LUMPER: 'Lumper',
  SCALE_TICKET: 'Scale Ticket',
  ADDITIONAL_STOP: 'Additional Stop',
  FUEL_SURCHARGE: 'Fuel Surcharge',
  RECLASSIFICATION: 'Reclassification',
  REEFER_FUEL: 'Reefer Fuel',
  DRIVER_ASSIST: 'Driver Assist',
  SORT_SEGREGATE: 'Sort/Segregate',
  INSIDE_DELIVERY: 'Inside Delivery',
  RESIDENTIAL_DELIVERY: 'Residential Delivery',
  SATURDAY_DELIVERY: 'Saturday Delivery',
  AFTER_HOURS: 'After Hours',
  OTHER: 'Other',
};

async function fetchCharge(chargeId: string) {
  const response = await fetch(apiUrl(`/api/accessorial-charges/${chargeId}`));
  if (!response.ok) throw new Error('Failed to fetch charge');
  return response.json();
}

export default function AccessorialChargeForm({
  open,
  onOpenChange,
  loadId,
  chargeId,
  onSuccess,
}: AccessorialChargeFormProps) {
  const [formData, setFormData] = useState({
    loadId: loadId || '',
    chargeType: 'DETENTION' as AccessorialChargeType,
    description: '',
    amount: 0,
    detentionHours: 0,
    detentionRate: 0,
    layoverDays: 0,
    layoverRate: 0,
    tonuReason: '',
    notes: '',
  });

  const queryClient = useQueryClient();
  const isEditing = !!chargeId;

  // Fetch existing charge if editing
  const { data: chargeData } = useQuery({
    queryKey: ['accessorial-charge', chargeId],
    queryFn: () => fetchCharge(chargeId!),
    enabled: isEditing && !!chargeId,
  });


  // Populate form when editing
  useEffect(() => {
    if (chargeData?.data && isEditing) {
      const charge = chargeData.data;
      setFormData({
        loadId: charge.loadId,
        chargeType: charge.chargeType,
        description: charge.description,
        amount: charge.amount,
        detentionHours: charge.detentionHours || 0,
        detentionRate: charge.detentionRate || 0,
        layoverDays: charge.layoverDays || 0,
        layoverRate: charge.layoverRate || 0,
        tonuReason: charge.tonuReason || '',
        notes: charge.notes || '',
      });
    } else if (loadId) {
      setFormData((prev) => ({ ...prev, loadId }));
    }
  }, [chargeData, isEditing, loadId]);

  // Calculate amount based on charge type
  useEffect(() => {
    if (formData.chargeType === 'DETENTION' && formData.detentionHours && formData.detentionRate) {
      setFormData((prev) => ({
        ...prev,
        amount: formData.detentionHours * formData.detentionRate,
      }));
    } else if (formData.chargeType === 'LAYOVER' && formData.layoverDays && formData.layoverRate) {
      setFormData((prev) => ({
        ...prev,
        amount: formData.layoverDays * formData.layoverRate,
      }));
    }
  }, [
    formData.chargeType,
    formData.detentionHours,
    formData.detentionRate,
    formData.layoverDays,
    formData.layoverRate,
  ]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(apiUrl('/api/accessorial-charges'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create accessorial charge');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Accessorial charge created');
      queryClient.invalidateQueries({ queryKey: ['accessorial-charges'] });
      queryClient.invalidateQueries({ queryKey: ['load', formData.loadId] });
      onOpenChange(false);
      onSuccess?.();
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create accessorial charge');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(apiUrl(`/api/accessorial-charges/${chargeId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update accessorial charge');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Accessorial charge updated');
      queryClient.invalidateQueries({ queryKey: ['accessorial-charges'] });
      queryClient.invalidateQueries({ queryKey: ['load', formData.loadId] });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update accessorial charge');
    },
  });

  const resetForm = () => {
    setFormData({
      loadId: loadId || '',
      chargeType: 'DETENTION',
      description: '',
      amount: 0,
      detentionHours: 0,
      detentionRate: 0,
      layoverDays: 0,
      layoverRate: 0,
      tonuReason: '',
      notes: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.loadId) {
      toast.error('Load ID is required');
      return;
    }

    if (isEditing) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const showDetentionFields = formData.chargeType === 'DETENTION';
  const showLayoverFields = formData.chargeType === 'LAYOVER';
  const showTonuFields = formData.chargeType === 'TONU';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Accessorial Charge' : 'Create Accessorial Charge'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update accessorial charge details'
              : 'Add an accessorial charge to a load'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Load Selection */}
            <div className="space-y-2">
              <Label htmlFor="loadId">Load *</Label>
              <LoadCombobox
                value={formData.loadId}
                onValueChange={(value) => setFormData({ ...formData, loadId: value })}
                placeholder="Search or select a load..."
                disabled={isEditing} // Disable when editing - load cannot be changed for existing charges
              />
              {!formData.loadId && (
                <p className="text-sm text-muted-foreground">
                  Search by load number, customer name, or location (e.g., "Dallas", "TX")
                </p>
              )}
            </div>

            {/* Charge Type */}
            <div className="space-y-2">
              <Label htmlFor="chargeType">Charge Type *</Label>
              <Select
                value={formData.chargeType}
                onValueChange={(value) =>
                  setFormData({ ...formData, chargeType: value as AccessorialChargeType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(chargeTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Detention Fields */}
            {showDetentionFields && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="space-y-2">
                  <Label htmlFor="detentionHours">Detention Hours *</Label>
                  <Input
                    id="detentionHours"
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.detentionHours}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        detentionHours: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="detentionRate">Rate per Hour *</Label>
                  <Input
                    id="detentionRate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.detentionRate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        detentionRate: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>
                {formData.detentionHours > 0 && formData.detentionRate > 0 && (
                  <div className="col-span-2 text-sm font-medium text-blue-900">
                    Total: {formatCurrency(formData.detentionHours * formData.detentionRate)}
                  </div>
                )}
              </div>
            )}

            {/* Layover Fields */}
            {showLayoverFields && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="space-y-2">
                  <Label htmlFor="layoverDays">Layover Days *</Label>
                  <Input
                    id="layoverDays"
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.layoverDays}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        layoverDays: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="layoverRate">Rate per Day *</Label>
                  <Input
                    id="layoverRate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.layoverRate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        layoverRate: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>
                {formData.layoverDays > 0 && formData.layoverRate > 0 && (
                  <div className="col-span-2 text-sm font-medium text-blue-900">
                    Total: {formatCurrency(formData.layoverDays * formData.layoverRate)}
                  </div>
                )}
              </div>
            )}

            {/* TONU Fields */}
            {showTonuFields && (
              <div className="space-y-2 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <Label htmlFor="tonuReason">TONU Reason *</Label>
                <Textarea
                  id="tonuReason"
                  value={formData.tonuReason}
                  onChange={(e) => setFormData({ ...formData, tonuReason: e.target.value })}
                  placeholder="Explain why the truck was ordered but not used"
                  rows={3}
                  required
                />
              </div>
            )}

            {/* Amount (manual entry for other types) */}
            {!showDetentionFields && !showLayoverFields && (
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                  }
                  required
                />
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the accessorial charge"
                rows={3}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes"
                rows={2}
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
                formData.amount <= 0
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


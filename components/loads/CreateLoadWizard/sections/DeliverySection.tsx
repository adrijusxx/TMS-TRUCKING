'use client';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Clock, Building2, Phone } from 'lucide-react';
import type { CreateLoadInput } from '@/lib/validations/load';

interface DeliverySectionProps {
  loadData: Partial<CreateLoadInput>;
  onFieldChange: (field: keyof CreateLoadInput, value: any) => void;
  errors?: Record<string, string>;
}

export default function DeliverySection({
  loadData,
  onFieldChange,
  errors = {},
}: DeliverySectionProps) {
  const formatDateTimeLocal = (date: string | Date | undefined) => {
    if (!date) return '';
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b">
        <MapPin className="h-4 w-4 text-red-600" />
        <h4 className="font-semibold text-sm">Delivery Information</h4>
      </div>

      {/* Location Name & Company */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="deliveryLocation" className="text-xs">
            Location Name *
          </Label>
          <Input
            id="deliveryLocation"
            value={loadData.deliveryLocation || ''}
            onChange={(e) => onFieldChange('deliveryLocation', e.target.value)}
            className={`h-9 ${errors.deliveryLocation ? 'border-destructive' : ''}`}
            placeholder="Warehouse name"
          />
          {errors.deliveryLocation && (
            <p className="text-xs text-destructive">{errors.deliveryLocation}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="deliveryCompany" className="text-xs flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            Company Name
          </Label>
          <Input
            id="deliveryCompany"
            value={loadData.deliveryCompany || ''}
            onChange={(e) => onFieldChange('deliveryCompany', e.target.value)}
            className="h-9"
            placeholder="Company at delivery"
          />
        </div>
      </div>

      {/* Address */}
      <div className="space-y-1.5">
        <Label htmlFor="deliveryAddress" className="text-xs">
          Street Address *
        </Label>
        <Input
          id="deliveryAddress"
          value={loadData.deliveryAddress || ''}
          onChange={(e) => onFieldChange('deliveryAddress', e.target.value)}
          className={`h-9 ${errors.deliveryAddress ? 'border-destructive' : ''}`}
          placeholder="456 Oak Ave"
        />
        {errors.deliveryAddress && (
          <p className="text-xs text-destructive">{errors.deliveryAddress}</p>
        )}
      </div>

      {/* City, State, ZIP */}
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="deliveryCity" className="text-xs">City *</Label>
          <Input
            id="deliveryCity"
            value={loadData.deliveryCity || ''}
            onChange={(e) => onFieldChange('deliveryCity', e.target.value)}
            className={`h-9 ${errors.deliveryCity ? 'border-destructive' : ''}`}
            placeholder="City"
          />
          {errors.deliveryCity && (
            <p className="text-xs text-destructive">{errors.deliveryCity}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="deliveryState" className="text-xs">State *</Label>
          <Input
            id="deliveryState"
            value={loadData.deliveryState || ''}
            onChange={(e) => onFieldChange('deliveryState', e.target.value.toUpperCase().slice(0, 2))}
            maxLength={2}
            className={`h-9 ${errors.deliveryState ? 'border-destructive' : ''}`}
            placeholder="CA"
          />
          {errors.deliveryState && (
            <p className="text-xs text-destructive">{errors.deliveryState}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="deliveryZip" className="text-xs">ZIP *</Label>
          <Input
            id="deliveryZip"
            value={loadData.deliveryZip || ''}
            onChange={(e) => onFieldChange('deliveryZip', e.target.value)}
            className={`h-9 ${errors.deliveryZip ? 'border-destructive' : ''}`}
            placeholder="67890"
          />
          {errors.deliveryZip && (
            <p className="text-xs text-destructive">{errors.deliveryZip}</p>
          )}
        </div>
      </div>

      {/* Date & Time Windows */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="deliveryDate" className="text-xs flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Delivery Date *
          </Label>
          <Input
            id="deliveryDate"
            type="datetime-local"
            value={formatDateTimeLocal(loadData.deliveryDate ?? undefined)}
            onChange={(e) => onFieldChange('deliveryDate', e.target.value)}
            className={`h-9 ${errors.deliveryDate ? 'border-destructive' : ''}`}
          />
          {errors.deliveryDate && (
            <p className="text-xs text-destructive">{errors.deliveryDate}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="deliveryTimeStart" className="text-xs">
            Time Window Start
          </Label>
          <Input
            id="deliveryTimeStart"
            type="datetime-local"
            value={formatDateTimeLocal(loadData.deliveryTimeStart ?? undefined)}
            onChange={(e) => onFieldChange('deliveryTimeStart', e.target.value || null)}
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="deliveryTimeEnd" className="text-xs">
            Time Window End
          </Label>
          <Input
            id="deliveryTimeEnd"
            type="datetime-local"
            value={formatDateTimeLocal(loadData.deliveryTimeEnd ?? undefined)}
            onChange={(e) => onFieldChange('deliveryTimeEnd', e.target.value || null)}
            className="h-9"
          />
        </div>
      </div>

      {/* Contact Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="deliveryContact" className="text-xs flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            Contact Name
          </Label>
          <Input
            id="deliveryContact"
            value={loadData.deliveryContact || ''}
            onChange={(e) => onFieldChange('deliveryContact', e.target.value)}
            className="h-9"
            placeholder="Jane Smith"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="deliveryPhone" className="text-xs flex items-center gap-1">
            <Phone className="h-3 w-3" />
            Contact Phone
          </Label>
          <Input
            id="deliveryPhone"
            type="tel"
            value={loadData.deliveryPhone || ''}
            onChange={(e) => onFieldChange('deliveryPhone', e.target.value)}
            className="h-9"
            placeholder="(555) 987-6543"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="deliveryNotes" className="text-xs">
          Delivery Notes
        </Label>
        <Textarea
          id="deliveryNotes"
          value={loadData.deliveryNotes || ''}
          onChange={(e) => onFieldChange('deliveryNotes', e.target.value)}
          rows={2}
          className="text-sm resize-none"
          placeholder="Appointment number, receiving hours, special instructions..."
        />
      </div>
    </Card>
  );
}


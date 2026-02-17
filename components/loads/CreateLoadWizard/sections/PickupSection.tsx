'use client';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Clock, Building2, Phone } from 'lucide-react';
import type { CreateLoadInput } from '@/lib/validations/load';

interface PickupSectionProps {
  loadData: Partial<CreateLoadInput>;
  onFieldChange: (field: keyof CreateLoadInput, value: any) => void;
  errors?: Record<string, string>;
}

export default function PickupSection({
  loadData,
  onFieldChange,
  errors = {},
}: PickupSectionProps) {
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
        <MapPin className="h-4 w-4 text-green-600" />
        <h4 className="font-semibold text-sm">Pickup Information</h4>
      </div>

      {/* Location Name & Company */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="pickupLocation" className="text-xs">
            Location Name *
          </Label>
          <Input
            id="pickupLocation"
            value={loadData.pickupLocation || ''}
            onChange={(e) => onFieldChange('pickupLocation', e.target.value)}
            className={`h-9 ${errors.pickupLocation ? 'border-destructive' : ''}`}
            placeholder="Warehouse name"
          />
          {errors.pickupLocation && (
            <p className="text-xs text-destructive">{errors.pickupLocation}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pickupCompany" className="text-xs flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            Company Name
          </Label>
          <Input
            id="pickupCompany"
            value={loadData.pickupCompany || ''}
            onChange={(e) => onFieldChange('pickupCompany', e.target.value)}
            className="h-9"
            placeholder="Company at pickup"
          />
        </div>
      </div>

      {/* Address */}
      <div className="space-y-1.5">
        <Label htmlFor="pickupAddress" className="text-xs">
          Street Address *
        </Label>
        <Input
          id="pickupAddress"
          value={loadData.pickupAddress || ''}
          onChange={(e) => onFieldChange('pickupAddress', e.target.value)}
          className={`h-9 ${errors.pickupAddress ? 'border-destructive' : ''}`}
          placeholder="123 Main St"
        />
        {errors.pickupAddress && (
          <p className="text-xs text-destructive">{errors.pickupAddress}</p>
        )}
      </div>

      {/* City, State, ZIP */}
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="pickupCity" className="text-xs">City *</Label>
          <Input
            id="pickupCity"
            value={loadData.pickupCity || ''}
            onChange={(e) => onFieldChange('pickupCity', e.target.value)}
            className={`h-9 ${errors.pickupCity ? 'border-destructive' : ''}`}
            placeholder="City"
          />
          {errors.pickupCity && (
            <p className="text-xs text-destructive">{errors.pickupCity}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pickupState" className="text-xs">State *</Label>
          <Input
            id="pickupState"
            value={loadData.pickupState || ''}
            onChange={(e) => onFieldChange('pickupState', e.target.value.toUpperCase().slice(0, 2))}
            maxLength={2}
            className={`h-9 ${errors.pickupState ? 'border-destructive' : ''}`}
            placeholder="TX"
          />
          {errors.pickupState && (
            <p className="text-xs text-destructive">{errors.pickupState}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pickupZip" className="text-xs">ZIP *</Label>
          <Input
            id="pickupZip"
            value={loadData.pickupZip || ''}
            onChange={(e) => onFieldChange('pickupZip', e.target.value)}
            className={`h-9 ${errors.pickupZip ? 'border-destructive' : ''}`}
            placeholder="12345"
          />
          {errors.pickupZip && (
            <p className="text-xs text-destructive">{errors.pickupZip}</p>
          )}
        </div>
      </div>

      {/* Date & Time Windows */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="pickupDate" className="text-xs flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pickup Date *
          </Label>
          <Input
            id="pickupDate"
            type="datetime-local"
            value={formatDateTimeLocal(loadData.pickupDate ?? undefined)}
            onChange={(e) => onFieldChange('pickupDate', e.target.value)}
            className={`h-9 ${errors.pickupDate ? 'border-destructive' : ''}`}
          />
          {errors.pickupDate && (
            <p className="text-xs text-destructive">{errors.pickupDate}</p>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="driverNotes" className="text-xs">
          Pickup Notes
        </Label>
        <Textarea
          id="driverNotes"
          value={(loadData as any).driverNotes || ''}
          onChange={(e) => onFieldChange('driverNotes', e.target.value)}
          rows={2}
          className="text-sm resize-none"
          placeholder="Gate code, dock number, special instructions..."
        />
      </div>
    </Card>
  );
}


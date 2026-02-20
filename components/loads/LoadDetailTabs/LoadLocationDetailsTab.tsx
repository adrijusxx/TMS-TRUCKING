'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { MapPin, Calendar, Clock, Building2, Phone } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import LoadStopsDisplay from '../LoadStopsDisplay';

interface LoadLocationDetailsTabProps {
  load: any;
  formData: any;
  onFormDataChange: (data: any) => void;
}

export default function LoadLocationDetailsTab({
  load,
  formData,
  onFormDataChange,
}: LoadLocationDetailsTabProps) {
  const { can } = usePermissions();
  const canEdit = can('loads.edit');

  const updateField = (field: string, value: any) => {
    onFormDataChange({ ...formData, [field]: value });
  };

  const formatDateTimeLocal = (date: Date | string | null | undefined) => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().slice(0, 16);
  };

  return (
    <div className="space-y-4">
      {/* Multi-Stop Loads */}
      {load.stops && load.stops.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Stops ({load.stops.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <LoadStopsDisplay stops={load.stops} />
          </CardContent>
        </Card>
      )}

      {/* Pickup Information */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Pickup Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="pickupLocation" className="text-sm">Location Name</Label>
              {canEdit ? (
                <Input
                  id="pickupLocation"
                  value={formData.pickupLocation || ''}
                  onChange={(e) => updateField('pickupLocation', e.target.value)}
                  placeholder="Location name"
                />
              ) : (
                <p className="font-medium text-sm mt-1">{load.pickupLocation || '—'}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="pickupCompany" className="text-sm">Company Name</Label>
              {canEdit ? (
                <Input
                  id="pickupCompany"
                  value={formData.pickupCompany || load.pickupCompany || ''}
                  onChange={(e) => updateField('pickupCompany', e.target.value)}
                  placeholder="Company name"
                />
              ) : (
                <p className="font-medium text-sm mt-1">{load.pickupCompany || '—'}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="pickupAddress" className="text-sm">Street Address</Label>
              {canEdit ? (
                <Input
                  id="pickupAddress"
                  value={formData.pickupAddress || ''}
                  onChange={(e) => updateField('pickupAddress', e.target.value)}
                  placeholder="Street address"
                />
              ) : (
                <p className="font-medium text-sm mt-1">{load.pickupAddress || '—'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickupCity" className="text-sm">City</Label>
              {canEdit ? (
                <Input
                  id="pickupCity"
                  value={formData.pickupCity || ''}
                  onChange={(e) => updateField('pickupCity', e.target.value)}
                  placeholder="City"
                />
              ) : (
                <p className="font-medium text-sm mt-1">{load.pickupCity || '—'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickupState" className="text-sm">State</Label>
              {canEdit ? (
                <Input
                  id="pickupState"
                  value={formData.pickupState || ''}
                  onChange={(e) => updateField('pickupState', e.target.value.toUpperCase().slice(0, 2))}
                  placeholder="XX"
                  maxLength={2}
                />
              ) : (
                <p className="font-medium text-sm mt-1">{load.pickupState || '—'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickupZip" className="text-sm">ZIP Code</Label>
              {canEdit ? (
                <Input
                  id="pickupZip"
                  value={formData.pickupZip || ''}
                  onChange={(e) => updateField('pickupZip', e.target.value)}
                  placeholder="ZIP code"
                />
              ) : (
                <p className="font-medium text-sm mt-1">{load.pickupZip || '—'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickupDate" className="text-sm flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                Pickup Date
              </Label>
              {canEdit ? (
                <Input
                  id="pickupDate"
                  type="datetime-local"
                  value={formatDateTimeLocal(formData.pickupDate || load.pickupDate)}
                  onChange={(e) => updateField('pickupDate', e.target.value ? new Date(e.target.value).toISOString() : null)}
                />
              ) : (
                <p className="font-medium text-sm mt-1">
                  {load.pickupDate ? formatDateTime(load.pickupDate) : '—'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickupTimeStart" className="text-sm flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                Time Window Start
              </Label>
              {canEdit ? (
                <Input
                  id="pickupTimeStart"
                  type="datetime-local"
                  value={formatDateTimeLocal(formData.pickupTimeStart || load.pickupTimeStart)}
                  onChange={(e) => updateField('pickupTimeStart', e.target.value ? new Date(e.target.value).toISOString() : null)}
                />
              ) : (
                <p className="font-medium text-sm mt-1">
                  {load.pickupTimeStart ? formatDateTime(load.pickupTimeStart) : '—'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickupTimeEnd" className="text-sm flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                Time Window End
              </Label>
              {canEdit ? (
                <Input
                  id="pickupTimeEnd"
                  type="datetime-local"
                  value={formatDateTimeLocal(formData.pickupTimeEnd || load.pickupTimeEnd)}
                  onChange={(e) => updateField('pickupTimeEnd', e.target.value ? new Date(e.target.value).toISOString() : null)}
                />
              ) : (
                <p className="font-medium text-sm mt-1">
                  {load.pickupTimeEnd ? formatDateTime(load.pickupTimeEnd) : '—'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickupContact" className="text-sm flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5" />
                Contact Name
              </Label>
              {canEdit ? (
                <Input
                  id="pickupContact"
                  value={formData.pickupContact || load.pickupContact || ''}
                  onChange={(e) => updateField('pickupContact', e.target.value)}
                  placeholder="Contact name"
                />
              ) : (
                <p className="font-medium text-sm mt-1">{load.pickupContact || '—'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickupPhone" className="text-sm flex items-center gap-2">
                <Phone className="h-3.5 w-3.5" />
                Contact Phone
              </Label>
              {canEdit ? (
                <Input
                  id="pickupPhone"
                  type="tel"
                  value={formData.pickupPhone || load.pickupPhone || ''}
                  onChange={(e) => updateField('pickupPhone', e.target.value)}
                  placeholder="Phone number"
                />
              ) : (
                <p className="font-medium text-sm mt-1">{load.pickupPhone || '—'}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="pickupNotes" className="text-sm">Pickup Notes</Label>
              {canEdit ? (
                <textarea
                  id="pickupNotes"
                  value={formData.pickupNotes || load.pickupNotes || ''}
                  onChange={(e) => updateField('pickupNotes', e.target.value)}
                  className="w-full min-h-[80px] p-2 text-sm border border-input bg-background text-foreground rounded-md resize-none"
                  placeholder="Pickup notes..."
                />
              ) : (
                <p className="text-sm mt-1 whitespace-pre-wrap">{load.pickupNotes || '—'}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Information */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Delivery Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="deliveryLocation" className="text-sm">Location Name</Label>
              {canEdit ? (
                <Input
                  id="deliveryLocation"
                  value={formData.deliveryLocation || ''}
                  onChange={(e) => updateField('deliveryLocation', e.target.value)}
                  placeholder="Location name"
                />
              ) : (
                <p className="font-medium text-sm mt-1">{load.deliveryLocation || '—'}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="deliveryCompany" className="text-sm">Company Name</Label>
              {canEdit ? (
                <Input
                  id="deliveryCompany"
                  value={formData.deliveryCompany || load.deliveryCompany || ''}
                  onChange={(e) => updateField('deliveryCompany', e.target.value)}
                  placeholder="Company name"
                />
              ) : (
                <p className="font-medium text-sm mt-1">{load.deliveryCompany || '—'}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="deliveryAddress" className="text-sm">Street Address</Label>
              {canEdit ? (
                <Input
                  id="deliveryAddress"
                  value={formData.deliveryAddress || ''}
                  onChange={(e) => updateField('deliveryAddress', e.target.value)}
                  placeholder="Street address"
                />
              ) : (
                <p className="font-medium text-sm mt-1">{load.deliveryAddress || '—'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryCity" className="text-sm">City</Label>
              {canEdit ? (
                <Input
                  id="deliveryCity"
                  value={formData.deliveryCity || ''}
                  onChange={(e) => updateField('deliveryCity', e.target.value)}
                  placeholder="City"
                />
              ) : (
                <p className="font-medium text-sm mt-1">{load.deliveryCity || '—'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryState" className="text-sm">State</Label>
              {canEdit ? (
                <Input
                  id="deliveryState"
                  value={formData.deliveryState || ''}
                  onChange={(e) => updateField('deliveryState', e.target.value.toUpperCase().slice(0, 2))}
                  placeholder="XX"
                  maxLength={2}
                />
              ) : (
                <p className="font-medium text-sm mt-1">{load.deliveryState || '—'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryZip" className="text-sm">ZIP Code</Label>
              {canEdit ? (
                <Input
                  id="deliveryZip"
                  value={formData.deliveryZip || ''}
                  onChange={(e) => updateField('deliveryZip', e.target.value)}
                  placeholder="ZIP code"
                />
              ) : (
                <p className="font-medium text-sm mt-1">{load.deliveryZip || '—'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryDate" className="text-sm flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                Delivery Date
              </Label>
              {canEdit ? (
                <Input
                  id="deliveryDate"
                  type="datetime-local"
                  value={formatDateTimeLocal(formData.deliveryDate || load.deliveryDate)}
                  onChange={(e) => updateField('deliveryDate', e.target.value ? new Date(e.target.value).toISOString() : null)}
                />
              ) : (
                <p className="font-medium text-sm mt-1">
                  {load.deliveryDate ? formatDateTime(load.deliveryDate) : '—'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryTimeStart" className="text-sm flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                Time Window Start
              </Label>
              {canEdit ? (
                <Input
                  id="deliveryTimeStart"
                  type="datetime-local"
                  value={formatDateTimeLocal(formData.deliveryTimeStart || load.deliveryTimeStart)}
                  onChange={(e) => updateField('deliveryTimeStart', e.target.value ? new Date(e.target.value).toISOString() : null)}
                />
              ) : (
                <p className="font-medium text-sm mt-1">
                  {load.deliveryTimeStart ? formatDateTime(load.deliveryTimeStart) : '—'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryTimeEnd" className="text-sm flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                Time Window End
              </Label>
              {canEdit ? (
                <Input
                  id="deliveryTimeEnd"
                  type="datetime-local"
                  value={formatDateTimeLocal(formData.deliveryTimeEnd || load.deliveryTimeEnd)}
                  onChange={(e) => updateField('deliveryTimeEnd', e.target.value ? new Date(e.target.value).toISOString() : null)}
                />
              ) : (
                <p className="font-medium text-sm mt-1">
                  {load.deliveryTimeEnd ? formatDateTime(load.deliveryTimeEnd) : '—'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryContact" className="text-sm flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5" />
                Contact Name
              </Label>
              {canEdit ? (
                <Input
                  id="deliveryContact"
                  value={formData.deliveryContact || load.deliveryContact || ''}
                  onChange={(e) => updateField('deliveryContact', e.target.value)}
                  placeholder="Contact name"
                />
              ) : (
                <p className="font-medium text-sm mt-1">{load.deliveryContact || '—'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryPhone" className="text-sm flex items-center gap-2">
                <Phone className="h-3.5 w-3.5" />
                Contact Phone
              </Label>
              {canEdit ? (
                <Input
                  id="deliveryPhone"
                  type="tel"
                  value={formData.deliveryPhone || load.deliveryPhone || ''}
                  onChange={(e) => updateField('deliveryPhone', e.target.value)}
                  placeholder="Phone number"
                />
              ) : (
                <p className="font-medium text-sm mt-1">{load.deliveryPhone || '—'}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="deliveryNotes" className="text-sm">Delivery Notes</Label>
              {canEdit ? (
                <textarea
                  id="deliveryNotes"
                  value={formData.deliveryNotes || load.deliveryNotes || ''}
                  onChange={(e) => updateField('deliveryNotes', e.target.value)}
                  className="w-full min-h-[80px] p-2 text-sm border border-input bg-background text-foreground rounded-md resize-none"
                  placeholder="Delivery notes..."
                />
              ) : (
                <p className="text-sm mt-1 whitespace-pre-wrap">{load.deliveryNotes || '—'}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


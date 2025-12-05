'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Clock, Building2, Phone, Navigation, ChevronDown, ChevronUp, MapPinOff, Truck } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import LoadStopsDisplay from '../LoadStopsDisplay';
import LoadMap from '../LoadMap';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface LoadRouteTabProps {
  load: any;
  formData: any;
  onFormDataChange: (data: any) => void;
}

export default function LoadRouteTab({
  load,
  formData,
  onFormDataChange,
}: LoadRouteTabProps) {
  const { can } = usePermissions();
  const canEdit = can('loads.edit');
  const [pickupOpen, setPickupOpen] = useState(true);
  const [deliveryOpen, setDeliveryOpen] = useState(true);

  const updateField = (field: string, value: any) => {
    onFormDataChange({ ...formData, [field]: value });
  };

  const formatDateTimeLocal = (date: Date | string | null | undefined) => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().slice(0, 16);
  };

  const hasValidRoute =
    (load.pickupCity && load.pickupState && load.deliveryCity && load.deliveryState) ||
    (load.stops && load.stops.length >= 2);

  return (
    <div className="space-y-3">
      {/* Route Summary & Map */}
      <Card className="shadow-sm">
        <CardHeader className="py-2 px-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="h-3.5 w-3.5 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Route Map</CardTitle>
            </div>
            <div className="flex gap-1 flex-wrap">
              {load.totalMiles && (
                <Badge variant="outline" className="text-[10px] h-5 bg-blue-50 text-blue-700">
                  {load.totalMiles.toFixed(0)} mi
                </Badge>
              )}
              {load.loadedMiles && (
                <Badge variant="outline" className="text-[10px] h-5 bg-green-50 text-green-700">
                  {load.loadedMiles.toFixed(0)} loaded
                </Badge>
              )}
              {load.emptyMiles && (
                <Badge variant="outline" className="text-[10px] h-5 bg-gray-50 text-gray-600">
                  {load.emptyMiles.toFixed(0)} empty
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="py-2 px-3">
          {/* Route Points Summary */}
          <div className="flex items-center gap-2 text-xs mb-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-muted-foreground">
                {load.stops?.find((s: any) => s.stopType === 'PICKUP')?.city || load.pickupCity || 'N/A'}, 
                {load.stops?.find((s: any) => s.stopType === 'PICKUP')?.state || load.pickupState || ''}
              </span>
            </div>
            <div className="flex-1 border-t border-dashed" />
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span className="text-muted-foreground">
                {(() => {
                  const deliveries = load.stops?.filter((s: any) => s.stopType === 'DELIVERY') || [];
                  const last = deliveries[deliveries.length - 1];
                  return `${last?.city || load.deliveryCity || 'N/A'}, ${last?.state || load.deliveryState || ''}`;
                })()}
              </span>
            </div>
          </div>

          {/* Map */}
          {hasValidRoute ? (
            <div className="h-[250px] w-full rounded border overflow-hidden">
              <LoadMap load={load} />
            </div>
          ) : (
            <div className="h-[150px] w-full rounded border bg-muted flex items-center justify-center">
              <div className="text-center">
                <MapPinOff className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Add locations to view route</p>
              </div>
            </div>
          )}

          {/* Multi-stop indicator */}
          {load.stops && load.stops.length > 2 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
              <MapPin className="h-3 w-3" />
              <span>
                {load.stops.length} stops ({load.stops.filter((s: any) => s.stopType === 'PICKUP').length} P / 
                {load.stops.filter((s: any) => s.stopType === 'DELIVERY').length} D)
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Multi-Stop Loads */}
      {load.stops && load.stops.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="py-2 px-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Stops ({load.stops.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="py-2 px-3">
            <LoadStopsDisplay stops={load.stops} />
          </CardContent>
        </Card>
      )}

      {/* Pickup Information - Collapsible */}
      <Collapsible open={pickupOpen} onOpenChange={setPickupOpen}>
        <Card className="shadow-sm">
          <CollapsibleTrigger asChild>
            <CardHeader className="py-2 px-3 cursor-pointer hover:bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <CardTitle className="text-sm font-medium">Pickup</CardTitle>
                  {load.pickupCity && (
                    <span className="text-xs text-muted-foreground">
                      {load.pickupCity}, {load.pickupState}
                    </span>
                  )}
                </div>
                {pickupOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="py-2 px-3 border-t">
              <div className="grid gap-2 grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs">Location</Label>
                  {canEdit ? (
                    <Input
                      value={formData.pickupLocation || ''}
                      onChange={(e) => updateField('pickupLocation', e.target.value)}
                      className="h-7 text-xs"
                      placeholder="Location name"
                    />
                  ) : (
                    <p className="text-xs font-medium">{load.pickupLocation || '—'}</p>
                  )}
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs">Address</Label>
                  {canEdit ? (
                    <Input
                      value={formData.pickupAddress || ''}
                      onChange={(e) => updateField('pickupAddress', e.target.value)}
                      className="h-7 text-xs"
                      placeholder="Street address"
                    />
                  ) : (
                    <p className="text-xs font-medium">{load.pickupAddress || '—'}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">City</Label>
                  {canEdit ? (
                    <Input
                      value={formData.pickupCity || ''}
                      onChange={(e) => updateField('pickupCity', e.target.value)}
                      className="h-7 text-xs"
                    />
                  ) : (
                    <p className="text-xs font-medium">{load.pickupCity || '—'}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">State</Label>
                  {canEdit ? (
                    <Input
                      value={formData.pickupState || ''}
                      onChange={(e) => updateField('pickupState', e.target.value.toUpperCase().slice(0, 2))}
                      className="h-7 text-xs"
                      maxLength={2}
                    />
                  ) : (
                    <p className="text-xs font-medium">{load.pickupState || '—'}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">ZIP</Label>
                  {canEdit ? (
                    <Input
                      value={formData.pickupZip || ''}
                      onChange={(e) => updateField('pickupZip', e.target.value)}
                      className="h-7 text-xs"
                    />
                  ) : (
                    <p className="text-xs font-medium">{load.pickupZip || '—'}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <Calendar className="h-3 w-3" />Date
                  </Label>
                  {canEdit ? (
                    <Input
                      type="datetime-local"
                      value={formatDateTimeLocal(formData.pickupDate || load.pickupDate)}
                      onChange={(e) => updateField('pickupDate', e.target.value ? new Date(e.target.value).toISOString() : null)}
                      className="h-7 text-xs"
                    />
                  ) : (
                    <p className="text-xs font-medium">{load.pickupDate ? formatDateTime(load.pickupDate) : '—'}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <Building2 className="h-3 w-3" />Contact
                  </Label>
                  {canEdit ? (
                    <Input
                      value={formData.pickupContact || load.pickupContact || ''}
                      onChange={(e) => updateField('pickupContact', e.target.value)}
                      className="h-7 text-xs"
                    />
                  ) : (
                    <p className="text-xs font-medium">{load.pickupContact || '—'}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <Phone className="h-3 w-3" />Phone
                  </Label>
                  {canEdit ? (
                    <Input
                      value={formData.pickupPhone || load.pickupPhone || ''}
                      onChange={(e) => updateField('pickupPhone', e.target.value)}
                      className="h-7 text-xs"
                    />
                  ) : (
                    <p className="text-xs font-medium">{load.pickupPhone || '—'}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Delivery Information - Collapsible */}
      <Collapsible open={deliveryOpen} onOpenChange={setDeliveryOpen}>
        <Card className="shadow-sm">
          <CollapsibleTrigger asChild>
            <CardHeader className="py-2 px-3 cursor-pointer hover:bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  <CardTitle className="text-sm font-medium">Delivery</CardTitle>
                  {load.deliveryCity && (
                    <span className="text-xs text-muted-foreground">
                      {load.deliveryCity}, {load.deliveryState}
                    </span>
                  )}
                </div>
                {deliveryOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="py-2 px-3 border-t">
              <div className="grid gap-2 grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs">Location</Label>
                  {canEdit ? (
                    <Input
                      value={formData.deliveryLocation || ''}
                      onChange={(e) => updateField('deliveryLocation', e.target.value)}
                      className="h-7 text-xs"
                      placeholder="Location name"
                    />
                  ) : (
                    <p className="text-xs font-medium">{load.deliveryLocation || '—'}</p>
                  )}
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs">Address</Label>
                  {canEdit ? (
                    <Input
                      value={formData.deliveryAddress || ''}
                      onChange={(e) => updateField('deliveryAddress', e.target.value)}
                      className="h-7 text-xs"
                      placeholder="Street address"
                    />
                  ) : (
                    <p className="text-xs font-medium">{load.deliveryAddress || '—'}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">City</Label>
                  {canEdit ? (
                    <Input
                      value={formData.deliveryCity || ''}
                      onChange={(e) => updateField('deliveryCity', e.target.value)}
                      className="h-7 text-xs"
                    />
                  ) : (
                    <p className="text-xs font-medium">{load.deliveryCity || '—'}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">State</Label>
                  {canEdit ? (
                    <Input
                      value={formData.deliveryState || ''}
                      onChange={(e) => updateField('deliveryState', e.target.value.toUpperCase().slice(0, 2))}
                      className="h-7 text-xs"
                      maxLength={2}
                    />
                  ) : (
                    <p className="text-xs font-medium">{load.deliveryState || '—'}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">ZIP</Label>
                  {canEdit ? (
                    <Input
                      value={formData.deliveryZip || ''}
                      onChange={(e) => updateField('deliveryZip', e.target.value)}
                      className="h-7 text-xs"
                    />
                  ) : (
                    <p className="text-xs font-medium">{load.deliveryZip || '—'}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <Calendar className="h-3 w-3" />Date
                  </Label>
                  {canEdit ? (
                    <Input
                      type="datetime-local"
                      value={formatDateTimeLocal(formData.deliveryDate || load.deliveryDate)}
                      onChange={(e) => updateField('deliveryDate', e.target.value ? new Date(e.target.value).toISOString() : null)}
                      className="h-7 text-xs"
                    />
                  ) : (
                    <p className="text-xs font-medium">{load.deliveryDate ? formatDateTime(load.deliveryDate) : '—'}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <Building2 className="h-3 w-3" />Contact
                  </Label>
                  {canEdit ? (
                    <Input
                      value={formData.deliveryContact || load.deliveryContact || ''}
                      onChange={(e) => updateField('deliveryContact', e.target.value)}
                      className="h-7 text-xs"
                    />
                  ) : (
                    <p className="text-xs font-medium">{load.deliveryContact || '—'}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <Phone className="h-3 w-3" />Phone
                  </Label>
                  {canEdit ? (
                    <Input
                      value={formData.deliveryPhone || load.deliveryPhone || ''}
                      onChange={(e) => updateField('deliveryPhone', e.target.value)}
                      className="h-7 text-xs"
                    />
                  ) : (
                    <p className="text-xs font-medium">{load.deliveryPhone || '—'}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}






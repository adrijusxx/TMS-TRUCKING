'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Package, AlertTriangle } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

interface LoadSpecificationsTabProps {
  load: any;
  formData: any;
  onFormDataChange: (data: any) => void;
}

export default function LoadSpecificationsTab({
  load,
  formData,
  onFormDataChange,
}: LoadSpecificationsTabProps) {
  const { can } = usePermissions();
  const canEdit = can('loads.edit');
  const isReefer = (formData.equipmentType || load.equipmentType) === 'REEFER';

  const updateField = (field: string, value: any) => {
    onFormDataChange({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Load Specifications</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="weight" className="text-sm">Weight (lbs)</Label>
              {canEdit ? (
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  value={formData.weight || load.weight || ''}
                  onChange={(e) => updateField('weight', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="Weight"
                />
              ) : (
                <p className="font-medium text-sm mt-1">
                  {load.weight ? `${load.weight.toLocaleString()} lbs` : '—'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pieces" className="text-sm">Pieces</Label>
              {canEdit ? (
                <Input
                  id="pieces"
                  type="number"
                  value={formData.pieces || load.pieces || ''}
                  onChange={(e) => updateField('pieces', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Pieces"
                />
              ) : (
                <p className="font-medium text-sm mt-1">{load.pieces || '—'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pallets" className="text-sm">Pallets</Label>
              {canEdit ? (
                <Input
                  id="pallets"
                  type="number"
                  value={formData.pallets || load.pallets || ''}
                  onChange={(e) => updateField('pallets', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Pallets"
                />
              ) : (
                <p className="font-medium text-sm mt-1">{load.pallets || '—'}</p>
              )}
            </div>

            {(isReefer || load.temperature || formData.temperature) && (
              <div className="space-y-2">
                <Label htmlFor="temperature" className="text-sm">Temperature (°F)</Label>
                {canEdit ? (
                  <Input
                    id="temperature"
                    type="number"
                    value={formData.temperature || load.temperature || ''}
                    onChange={(e) => updateField('temperature', e.target.value || null)}
                    placeholder="Temperature"
                  />
                ) : (
                  <p className="font-medium text-sm mt-1">
                    {load.temperature ? `${load.temperature}°F` : '—'}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="commodity" className="text-sm">Commodity</Label>
              {canEdit ? (
                <Input
                  id="commodity"
                  value={formData.commodity || load.commodity || ''}
                  onChange={(e) => updateField('commodity', e.target.value || null)}
                  placeholder="Commodity description"
                />
              ) : (
                <p className="font-medium text-sm mt-1">{load.commodity || '—'}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="hazmat" className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Hazmat
              </Label>
              {canEdit ? (
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hazmat ?? load.hazmat ?? false}
                      onChange={(e) => updateField('hazmat', e.target.checked)}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">This load contains hazmat materials</span>
                  </label>
                </div>
              ) : (
                <div className="mt-1">
                  {load.hazmat ? (
                    <Badge variant="destructive" className="text-sm">
                      HAZMAT
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">No</span>
                  )}
                </div>
              )}
            </div>

            {((formData.hazmat ?? load.hazmat) && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="hazmatClass" className="text-sm">Hazmat Class</Label>
                {canEdit ? (
                  <Input
                    id="hazmatClass"
                    value={formData.hazmatClass || load.hazmatClass || ''}
                    onChange={(e) => updateField('hazmatClass', e.target.value || null)}
                    placeholder="Hazmat class/division"
                  />
                ) : (
                  <p className="font-medium text-sm mt-1">{load.hazmatClass || '—'}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Fields */}
      {(load.shipmentId || load.stopsCount) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {load.shipmentId && (
                <div>
                  <Label className="text-sm text-muted-foreground">Shipment ID</Label>
                  <p className="font-medium text-sm mt-1">{load.shipmentId}</p>
                </div>
              )}
              {load.stopsCount !== null && load.stopsCount !== undefined && (
                <div>
                  <Label className="text-sm text-muted-foreground">Stops Count</Label>
                  <p className="font-medium text-sm mt-1">{load.stopsCount}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


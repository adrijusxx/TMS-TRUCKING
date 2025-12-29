'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Package, AlertTriangle, Thermometer } from 'lucide-react';
import type { CreateLoadInput } from '@/lib/validations/load';

interface LoadSpecsSectionProps {
  loadData: Partial<CreateLoadInput>;
  onFieldChange: (field: keyof CreateLoadInput, value: any) => void;
  errors?: Record<string, string>;
}

export default function LoadSpecsSection({
  loadData,
  onFieldChange,
  errors = {},
}: LoadSpecsSectionProps) {
  const isReefer = loadData.equipmentType === 'REEFER';
  const isHazmat = loadData.hazmat === true;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Load Specifications</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Weight, Pieces, Pallets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="weight" className="text-sm">
              Weight (lbs) *
            </Label>
            <Input
              id="weight"
              type="number"
              step="0.01"
              value={loadData.weight ?? ''}
              onChange={(e) => onFieldChange('weight', e.target.value ? Number(e.target.value) : undefined)}
              className={errors.weight ? 'border-destructive' : ''}
              placeholder="40000"
            />
            {errors.weight && (
              <p className="text-xs text-destructive">{errors.weight}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="pieces" className="text-sm">
              Pieces
            </Label>
            <Input
              id="pieces"
              type="number"
              value={loadData.pieces ?? ''}
              onChange={(e) => onFieldChange('pieces', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="24"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pallets" className="text-sm">
              Pallets
            </Label>
            <Input
              id="pallets"
              type="number"
              value={loadData.pallets ?? ''}
              onChange={(e) => onFieldChange('pallets', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="22"
            />
          </div>
        </div>

        {/* Commodity */}
        <div className="space-y-2">
          <Label htmlFor="commodity" className="text-sm">
            Commodity
          </Label>
          <Input
            id="commodity"
            value={loadData.commodity ?? ''}
            onChange={(e) => onFieldChange('commodity', e.target.value)}
            placeholder="General freight, electronics, food products..."
          />
        </div>

        {/* Temperature (conditional - only for reefer) */}
        {(isReefer || loadData.temperature) && (
          <div className="space-y-2">
            <Label htmlFor="temperature" className="text-sm flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-blue-500" />
              Temperature (°F)
              {isReefer && <span className="text-xs text-muted-foreground">(Reefer load)</span>}
            </Label>
            <Input
              id="temperature"
              value={loadData.temperature ?? ''}
              onChange={(e) => onFieldChange('temperature', e.target.value)}
              placeholder="35"
            />
            <p className="text-xs text-muted-foreground">
              Set the required temperature for reefer loads
            </p>
          </div>
        )}

        {/* Hazmat Section */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="hazmat" className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Hazardous Materials (HAZMAT)
              </Label>
              <p className="text-xs text-muted-foreground">
                Enable if this load contains hazardous materials
              </p>
            </div>
            <Switch
              id="hazmat"
              checked={isHazmat}
              onCheckedChange={(checked) => {
                onFieldChange('hazmat', checked);
                if (!checked) {
                  onFieldChange('hazmatClass', undefined);
                }
              }}
            />
          </div>

          {/* Hazmat Class (conditional - only when hazmat is enabled) */}
          {isHazmat && (
            <div className="space-y-2 pl-6 border-l-2 border-orange-200">
              <Label htmlFor="hazmatClass" className="text-sm">
                Hazmat Class/Division
              </Label>
              <Input
                id="hazmatClass"
                value={loadData.hazmatClass ?? ''}
                onChange={(e) => onFieldChange('hazmatClass', e.target.value)}
                placeholder="e.g., Class 3 - Flammable Liquids"
              />
              <p className="text-xs text-muted-foreground">
                Specify the DOT hazmat classification (e.g., Class 1.1, Class 2.2, Class 3)
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


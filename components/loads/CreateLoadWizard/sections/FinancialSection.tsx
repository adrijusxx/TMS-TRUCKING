'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, Calculator, TrendingUp } from 'lucide-react';
import type { CreateLoadInput } from '@/lib/validations/load';

interface FinancialSectionProps {
  loadData: Partial<CreateLoadInput>;
  onFieldChange: (field: keyof CreateLoadInput, value: any) => void;
  errors?: Record<string, string>;
}

export default function FinancialSection({
  loadData,
  onFieldChange,
  errors = {},
}: FinancialSectionProps) {
  // Auto-calculate totalMiles when loadedMiles and emptyMiles change
  useEffect(() => {
    const loaded = loadData.loadedMiles ?? 0;
    const empty = loadData.emptyMiles ?? 0;
    if (loaded > 0 || empty > 0) {
      const total = loaded + empty;
      if (total !== loadData.totalMiles) {
        onFieldChange('totalMiles', total);
      }
    }
  }, [loadData.loadedMiles, loadData.emptyMiles]);

  // Auto-calculate revenuePerMile when revenue and totalMiles change
  useEffect(() => {
    const revenue = loadData.revenue ?? 0;
    const totalMiles = loadData.totalMiles ?? 0;
    if (revenue > 0 && totalMiles > 0) {
      const rpm = parseFloat((revenue / totalMiles).toFixed(2));
      if (rpm !== loadData.revenuePerMile) {
        onFieldChange('revenuePerMile', rpm);
      }
    }
  }, [loadData.revenue, loadData.totalMiles]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Financial Information</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Revenue & Driver Pay */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="revenue" className="text-sm font-medium">
              Revenue ($) *
            </Label>
            <Input
              id="revenue"
              type="number"
              step="0.01"
              value={loadData.revenue ?? ''}
              onChange={(e) => onFieldChange('revenue', e.target.value ? Number(e.target.value) : 0)}
              className={`font-semibold ${errors.revenue ? 'border-destructive' : ''}`}
              placeholder="2500.00"
            />
            {errors.revenue && (
              <p className="text-xs text-destructive">{errors.revenue}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="driverPay" className="text-sm">
              Driver Pay ($)
            </Label>
            <Input
              id="driverPay"
              type="number"
              step="0.01"
              value={loadData.driverPay ?? ''}
              onChange={(e) => onFieldChange('driverPay', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Auto-calculated or manual"
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to auto-calculate based on driver's pay rate
            </p>
          </div>
        </div>

        {/* Fuel Advance & Service Fee */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fuelAdvance" className="text-sm">
              Fuel Advance ($)
            </Label>
            <Input
              id="fuelAdvance"
              type="number"
              step="0.01"
              value={loadData.fuelAdvance ?? 0}
              onChange={(e) => onFieldChange('fuelAdvance', e.target.value ? Number(e.target.value) : 0)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="serviceFee" className="text-sm">
              Service Fee ($)
            </Label>
            <Input
              id="serviceFee"
              type="number"
              step="0.01"
              value={loadData.serviceFee ?? ''}
              onChange={(e) => onFieldChange('serviceFee', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Mileage Section */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium text-sm">Mileage</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="loadedMiles" className="text-sm">
                Loaded Miles
              </Label>
              <Input
                id="loadedMiles"
                type="number"
                step="0.1"
                value={loadData.loadedMiles ?? ''}
                onChange={(e) => onFieldChange('loadedMiles', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emptyMiles" className="text-sm">
                Empty Miles (Deadhead)
              </Label>
              <Input
                id="emptyMiles"
                type="number"
                step="0.1"
                value={loadData.emptyMiles ?? ''}
                onChange={(e) => onFieldChange('emptyMiles', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalMiles" className="text-sm flex items-center gap-1">
                <Calculator className="h-3 w-3" />
                Total Miles
              </Label>
              <Input
                id="totalMiles"
                type="number"
                step="0.1"
                value={loadData.totalMiles ?? ''}
                onChange={(e) => onFieldChange('totalMiles', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="550"
              />
              <p className="text-xs text-muted-foreground">
                Auto-calculated from loaded + empty miles
              </p>
            </div>
          </div>
        </div>

        {/* Revenue Per Mile (calculated, read-only display) */}
        {(loadData.revenue ?? 0) > 0 && (loadData.totalMiles ?? 0) > 0 && (
          <div className="p-3 bg-muted rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Revenue Per Mile:</span>
              <span className="font-semibold text-green-600">
                ${loadData.revenuePerMile?.toFixed(2) || ((loadData.revenue ?? 0) / (loadData.totalMiles ?? 1)).toFixed(2)}/mi
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


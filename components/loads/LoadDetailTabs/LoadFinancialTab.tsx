'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, AlertCircle, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import { AccountingSyncStatus } from '@prisma/client';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import common from '@/lib/content/common.json';

interface LoadFinancialTabProps {
  load: any;
  formData: any;
  onFormDataChange: (data: any) => void;
  onLoadRefetch?: () => void;
}

const syncStatusVariant: Record<AccountingSyncStatus, "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "error" | "info" | "neutral"> = {
  NOT_SYNCED: 'neutral',
  PENDING_SYNC: 'warning',
  SYNCED: 'success',
  SYNC_FAILED: 'error',
  REQUIRES_REVIEW: 'warning',
};

export default function LoadFinancialTab({
  load,
  formData,
  onFormDataChange,
  onLoadRefetch,
}: LoadFinancialTabProps) {
  const { can } = usePermissions();
  const canEdit = can('loads.edit');
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isVerifyingMiles, setIsVerifyingMiles] = useState(false);

  const handleVerifyMiles = async () => {
    if (!load?.id) return;

    setIsVerifyingMiles(true);
    try {
      const response = await fetch(apiUrl(`/api/loads/${load.id}/verify-miles`), {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to verify miles');
      }

      if (result.success) {
        const miles = result.data.miles;
        const msg = miles > 0
          ? `Verified actual miles: ${miles.toFixed(1)}`
          : 'No trips found for this time period';

        toast.success(msg);
        onLoadRefetch?.();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to verify miles');
    } finally {
      setIsVerifyingMiles(false);
    }
  };

  // Data quality warnings on mount
  useEffect(() => {
    const warnings: string[] = [];
    if (load.status === 'DELIVERED' && (!load.revenue || load.revenue <= 0)) {
      warnings.push('Revenue is $0 on a DELIVERED load.');
    }
    if (load.driverId && (load.driverPay === null || load.driverPay === undefined)) {
      warnings.push('Driver is assigned but driver pay has not been set.');
    }
    if (warnings.length > 0) {
      toast.warning('Financial Data Review', {
        description: warnings.join(' '),
        duration: 6000,
      });
    }
  }, [load.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateField = (field: string, value: any) => {
    onFormDataChange({ ...formData, [field]: value });
  };

  const handleRecalculateDriverPay = async () => {
    if (!load?.id || !load?.driverId) {
      toast.error('Driver must be assigned to calculate driver pay');
      return;
    }

    setIsRecalculating(true);
    try {
      const response = await fetch(apiUrl(`/api/loads/${load.id}/recalculate-driver-pay`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to recalculate driver pay');
      }

      const result = await response.json();
      toast.success(`Driver pay recalculated: ${formatCurrency(result.data.calculatedPay)}`);
      onLoadRefetch?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to recalculate driver pay');
    } finally {
      setIsRecalculating(false);
    }
  };

  // Helper to ensure input values are never undefined
  const getInputValue = (formValue: any, loadValue: any, defaultValue: string | number = '') => {
    if (formValue !== undefined && formValue !== null) {
      return formValue;
    }
    if (loadValue !== undefined && loadValue !== null) {
      return loadValue;
    }
    return defaultValue;
  };

  return (
    <div className="space-y-4">
      {/* Financial Information */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Financial Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="revenue" className="text-sm">Revenue</Label>
              {canEdit ? (
                <Input
                  id="revenue"
                  type="number"
                  step="0.01"
                  value={getInputValue(formData.revenue, load.revenue, '')}
                  onChange={(e) => updateField('revenue', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder={common.financial.placeholder_zero}
                  className="font-semibold"
                />
              ) : (
                <p className="font-bold text-lg text-status-success mt-1">
                  {formatCurrency(load.revenue)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="driverPay" className="text-sm">Driver Pay</Label>
                {load?.driverId && canEdit && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRecalculateDriverPay}
                    disabled={isRecalculating}
                    className="h-7 text-xs"
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${isRecalculating ? 'animate-spin' : ''}`} />
                    Recalculate
                  </Button>
                )}
              </div>
              {canEdit ? (
                <Input
                  id="driverPay"
                  type="number"
                  step="0.01"
                  value={getInputValue(formData.driverPay, load.driverPay, '')}
                  onChange={(e) => updateField('driverPay', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder={common.financial.placeholder_zero}
                />
              ) : (
                <p className="font-medium text-sm mt-1">
                  {load.driverPay !== null && load.driverPay !== undefined
                    ? formatCurrency(load.driverPay)
                    : '—'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fuelAdvance" className="text-sm">Fuel Advance</Label>
              {canEdit ? (
                <Input
                  id="fuelAdvance"
                  type="number"
                  step="0.01"
                  value={getInputValue(formData.fuelAdvance, load.fuelAdvance, 0)}
                  onChange={(e) => updateField('fuelAdvance', e.target.value ? parseFloat(e.target.value) : 0)}
                  placeholder={common.financial.placeholder_zero}
                />
              ) : (
                <p className="font-medium text-sm mt-1">
                  {formatCurrency(load.fuelAdvance || 0)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceFee" className="text-sm">Service Fee</Label>
              {canEdit ? (
                <Input
                  id="serviceFee"
                  type="number"
                  step="0.01"
                  value={getInputValue(formData.serviceFee, load.serviceFee, '')}
                  onChange={(e) => updateField('serviceFee', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder={common.financial.placeholder_zero}
                />
              ) : (
                <p className="font-medium text-sm mt-1">
                  {load.serviceFee !== null && load.serviceFee !== undefined
                    ? formatCurrency(load.serviceFee)
                    : '—'}
                </p>
              )}
            </div>

            {load.totalPay !== null && load.totalPay !== undefined && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Total Pay</Label>
                <p className="font-medium text-sm mt-1">{formatCurrency(load.totalPay)}</p>
              </div>
            )}

            {load.profit !== null && load.profit !== undefined && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Net Profit
                </Label>
                <p className={`font-bold text-lg mt-1 ${load.profit >= 0 ? 'text-status-success' : 'text-status-error'}`}>
                  {formatCurrency(load.profit)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mileage Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Mileage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="loadedMiles" className="text-sm">Loaded Miles</Label>
              {canEdit ? (
                <Input
                  id="loadedMiles"
                  type="number"
                  step="0.1"
                  value={getInputValue(formData.loadedMiles, load.loadedMiles, '')}
                  onChange={(e) => updateField('loadedMiles', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="0.0"
                />
              ) : (
                <p className="font-medium text-sm mt-1">
                  {load.loadedMiles !== null && load.loadedMiles !== undefined
                    ? `${load.loadedMiles.toFixed(1)} mi`
                    : '—'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="emptyMiles" className="text-sm">Empty Miles</Label>
              {canEdit ? (
                <Input
                  id="emptyMiles"
                  type="number"
                  step="0.1"
                  value={getInputValue(formData.emptyMiles, load.emptyMiles, '')}
                  onChange={(e) => updateField('emptyMiles', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="0.0"
                />
              ) : (
                <p className="font-medium text-sm mt-1">
                  {load.emptyMiles !== null && load.emptyMiles !== undefined
                    ? `${load.emptyMiles.toFixed(1)} mi`
                    : '—'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalMiles" className="text-sm">Total Miles</Label>
              {canEdit ? (
                <Input
                  id="totalMiles"
                  type="number"
                  step="0.1"
                  value={getInputValue(formData.totalMiles, load.totalMiles, '')}
                  onChange={(e) => updateField('totalMiles', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="0.0"
                />
              ) : (
                <p className="font-semibold text-sm mt-1">
                  {load.totalMiles !== null && load.totalMiles !== undefined
                    ? `${load.totalMiles.toFixed(1)} mi`
                    : '—'}
                </p>
              )}
            </div>
          </div>

          {load.revenuePerMile !== null && load.revenuePerMile !== undefined && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <Label className="text-sm text-muted-foreground">Revenue Per Mile</Label>
                <div className="text-right">
                  <p className="font-medium text-sm">
                    {formatCurrency(load.revenuePerMile)}/mi
                  </p>
                  {/* Show dynamic calc if editing */}
                  {canEdit && formData.revenue && formData.totalMiles && (
                    <p className="text-[10px] text-muted-foreground">
                      (Est: {formatCurrency(formData.revenue / formData.totalMiles)}/mi)
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* GPS Mileage Verification */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Actual GPS Miles (Samsara)</Label>
                {load.actualMiles && load.totalMiles ? (
                  <Badge variant={load.actualMiles > load.totalMiles * 1.1 ? 'destructive' : 'secondary'} className="text-[10px] h-5">
                    {Math.round((load.actualMiles / load.totalMiles) * 100)}% of Billed
                  </Badge>
                ) : null}
              </div>
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleVerifyMiles}
                  disabled={isVerifyingMiles || !load.truckId}
                  className="h-7 text-xs"
                  title={!load.truckId ? "Assign a truck first" : "Fetch actual miles from Samsara"}
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${isVerifyingMiles ? 'animate-spin' : ''}`} />
                  {load.actualMiles ? 'Re-Verify' : 'Verify Miles'}
                </Button>
              )}
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {load.actualMiles ? `Recorded from GPS history` : 'Not verified yet'}
              </span>
              <p className="font-mono text-sm font-medium">
                {load.actualMiles ? `${load.actualMiles.toFixed(1)} mi` : '—'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounting Status (Read-only) */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Accounting Status</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-sm text-muted-foreground">Sync Status</Label>
              <div className="mt-1">
                <Badge
                  variant={syncStatusVariant[(load.accountingSyncStatus || 'NOT_SYNCED') as AccountingSyncStatus]}
                >
                  {load.accountingSyncStatus?.replace(/_/g, ' ') || 'NOT_SYNCED'}
                </Badge>
              </div>
            </div>

            {load.accountingSyncedAt && (
              <div>
                <Label className="text-sm text-muted-foreground">Last Synced</Label>
                <p className="font-medium text-sm mt-1">
                  {new Date(load.accountingSyncedAt).toLocaleString()}
                </p>
              </div>
            )}

            <div className="flex items-center gap-2">
              {load.readyForSettlement ? (
                <CheckCircle2 className="h-4 w-4 text-status-success" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground" />
              )}
              <Label className="text-sm">
                {load.readyForSettlement ? 'Ready for Settlement' : 'Not Ready for Settlement'}
              </Label>
            </div>

            {load.podUploadedAt && (
              <div>
                <Label className="text-sm text-muted-foreground">POD Uploaded</Label>
                <p className="font-medium text-sm mt-1">
                  {new Date(load.podUploadedAt).toLocaleString()}
                </p>
              </div>
            )}

            {load.totalExpenses !== null && load.totalExpenses !== undefined && (
              <div>
                <Label className="text-sm text-muted-foreground">Total Expenses</Label>
                <p className="font-medium text-sm mt-1">{formatCurrency(load.totalExpenses)}</p>
              </div>
            )}

            {load.netProfit !== null && load.netProfit !== undefined && (
              <div>
                <Label className="text-sm text-muted-foreground">Net Profit (Calculated)</Label>
                <p className={`font-medium text-sm mt-1 ${load.netProfit >= 0 ? 'text-status-success' : 'text-status-error'}`}>
                  {formatCurrency(load.netProfit)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

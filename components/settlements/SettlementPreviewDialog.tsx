'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import { FileText, Loader2, Truck, User, DollarSign } from 'lucide-react';

interface SettlementPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  driver: { firstName?: string; lastName?: string; driverNumber?: string; payType?: string; payRate?: number } | null;
  selectedLoads: Array<{ loadNumber: string; revenue: number; driverPay: number; totalMiles?: number }>;
  totalRevenue: number;
  totalDriverPay: number;
  deductions: number;
  advances: number;
  settlementNumber?: string;
}

export function SettlementPreviewDialog({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
  driver,
  selectedLoads,
  totalRevenue,
  totalDriverPay,
  deductions,
  advances,
  settlementNumber,
}: SettlementPreviewDialogProps) {
  const netPay = totalDriverPay - deductions - advances;
  const driverName = driver ? `${driver.firstName || ''} ${driver.lastName || ''}`.trim() : 'Unknown';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Settlement Preview
          </DialogTitle>
          <DialogDescription>
            Review the settlement breakdown before generating.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Driver Info */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{driverName}</p>
              <p className="text-xs text-muted-foreground">
                {driver?.driverNumber && `#${driver.driverNumber} · `}
                {driver?.payType?.replace('_', ' ')} @ {formatCurrency(driver?.payRate || 0)}
              </p>
            </div>
          </div>

          {/* Loads Summary */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Truck className="h-3.5 w-3.5" />
                {selectedLoads.length} load{selectedLoads.length !== 1 ? 's' : ''}
              </span>
              {settlementNumber && (
                <span className="text-xs text-muted-foreground">#{settlementNumber}</span>
              )}
            </div>
            <div className="max-h-32 overflow-y-auto border rounded-md">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left p-1.5 font-medium">Load</th>
                    <th className="text-right p-1.5 font-medium">Revenue</th>
                    <th className="text-right p-1.5 font-medium">Driver Pay</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedLoads.map((load) => (
                    <tr key={load.loadNumber} className="border-t">
                      <td className="p-1.5">{load.loadNumber}</td>
                      <td className="text-right p-1.5">{formatCurrency(load.revenue)}</td>
                      <td className="text-right p-1.5">{formatCurrency(load.driverPay)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Separator />

          {/* Financial Breakdown */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Revenue</span>
              <span>{formatCurrency(totalRevenue)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Gross Driver Pay</span>
              <span>{formatCurrency(totalDriverPay)}</span>
            </div>
            {deductions > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Deductions</span>
                <span className="text-destructive">-{formatCurrency(deductions)}</span>
              </div>
            )}
            {advances > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Advances</span>
                <span className="text-destructive">-{formatCurrency(advances)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-sm font-semibold">
              <span className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-primary" />
                Net Settlement
              </span>
              <span className={netPay < 0 ? 'text-destructive' : 'text-primary'}>
                {formatCurrency(netPay)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Go Back
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
            ) : (
              'Confirm & Generate'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
import { FileText, Loader2, Truck, DollarSign } from 'lucide-react';

interface InvoicePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  selectedLoads: Array<{
    loadNumber: string;
    customerName: string;
    revenue: number;
    route: string;
  }>;
  totalRevenue: number;
  invoiceNumber?: string;
}

export function InvoicePreviewDialog({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
  selectedLoads,
  totalRevenue,
  invoiceNumber,
}: InvoicePreviewDialogProps) {
  const groupedByCustomer = selectedLoads.reduce<Record<string, typeof selectedLoads>>((acc, load) => {
    if (!acc[load.customerName]) acc[load.customerName] = [];
    acc[load.customerName].push(load);
    return acc;
  }, {});

  const customerCount = Object.keys(groupedByCustomer).length;
  const willGenerateMultiple = customerCount > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Invoice Preview
          </DialogTitle>
          <DialogDescription>
            Review the invoice breakdown before generating.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Truck className="h-3.5 w-3.5" />
              {selectedLoads.length} load{selectedLoads.length !== 1 ? 's' : ''}
              {willGenerateMultiple && ` → ${customerCount} invoices`}
            </span>
            {invoiceNumber && (
              <span className="text-xs text-muted-foreground">#{invoiceNumber}</span>
            )}
          </div>

          {/* Loads Table */}
          <div className="max-h-48 overflow-y-auto border rounded-md">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="text-left p-1.5 font-medium">Load</th>
                  <th className="text-left p-1.5 font-medium">Customer</th>
                  <th className="text-left p-1.5 font-medium">Route</th>
                  <th className="text-right p-1.5 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {selectedLoads.map((load) => (
                  <tr key={load.loadNumber} className="border-t">
                    <td className="p-1.5">{load.loadNumber}</td>
                    <td className="p-1.5 truncate max-w-[120px]">{load.customerName}</td>
                    <td className="p-1.5 truncate max-w-[120px]">{load.route}</td>
                    <td className="text-right p-1.5">{formatCurrency(load.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Separator />

          {/* Total */}
          <div className="flex justify-between text-sm font-semibold">
            <span className="flex items-center gap-1.5">
              <DollarSign className="h-4 w-4 text-primary" />
              Total Revenue
            </span>
            <span className="text-primary">{formatCurrency(totalRevenue)}</span>
          </div>

          {willGenerateMultiple && (
            <p className="text-xs text-muted-foreground">
              Loads from {customerCount} different customers will generate {customerCount} separate invoices.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Go Back
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
            ) : (
              `Confirm & Generate${willGenerateMultiple ? ` (${customerCount})` : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

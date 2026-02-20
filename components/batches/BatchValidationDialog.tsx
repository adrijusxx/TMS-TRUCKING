'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, FileX } from 'lucide-react';

interface ValidationError {
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  issues: string[];
}

interface BatchValidationDialogProps {
  open: boolean;
  onClose: () => void;
  errors: ValidationError[];
}

export default function BatchValidationDialog({
  open,
  onClose,
  errors,
}: BatchValidationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Batch Cannot Be Sent
          </DialogTitle>
          <DialogDescription>
            {errors.length} invoice(s) have issues that must be resolved before sending.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {errors.map((err) => (
            <div
              key={err.invoiceId}
              className="border rounded-lg p-3 bg-muted/50"
            >
              <div className="font-medium text-sm mb-1">
                {err.invoiceNumber} — {err.customerName}
              </div>
              <ul className="space-y-1">
                {err.issues.map((issue, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <FileX className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fix Issues
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

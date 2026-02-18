'use client';

import { AlertTriangle, CheckCircle2, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import type { UseImportWizardReturn } from '@/lib/hooks/useImportWizard';

interface ImportResultsStepProps {
  wizard: UseImportWizardReturn;
}

export function ImportResultsStep({ wizard }: ImportResultsStepProps) {
  if (!wizard.importDetails) return null;

  const { importDetails } = wizard;

  const handleCopyErrors = () => {
    if (importDetails.errors.length > 0) {
      const errorText = importDetails.errors.map(e => `Row ${e.row} [${e.field}]: ${e.error}`).join('\n');
      navigator.clipboard.writeText(errorText);
      toast.success('Error log copied to clipboard');
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">
            {(importDetails.createdCount ?? 0) + (importDetails.updatedCount ?? 0)}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 font-medium">Synced</p>
        </div>
        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-2xl font-bold text-red-700 dark:text-red-300">
            {importDetails.errorsCount ?? importDetails.errors.length}
          </p>
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">Failed</p>
        </div>
        <div
          className="p-3 bg-muted border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/80"
          onClick={handleCopyErrors}
        >
          <Copy className="w-5 h-5 mb-1 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Copy Log</p>
        </div>
      </div>

      {/* Error Log */}
      {importDetails.errors.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertTriangle className="w-4 h-4" />
            Error Log
          </h4>
          <ScrollArea className="h-[250px] border rounded-md bg-white dark:bg-gray-950">
            <div className="divide-y">
              {importDetails.errors.map((error, idx) => (
                <div key={idx} className="p-3 text-sm hover:bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px] h-4 px-1">Row {error.row}</Badge>
                    <span className="font-semibold text-xs text-muted-foreground">{error.field}</span>
                  </div>
                  <p className="text-red-600 dark:text-red-400 text-xs">{error.error}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Success Message */}
      {importDetails.errors.length === 0 && (
        <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
          <p className="text-sm text-green-700 dark:text-green-300">
            Success! All records were imported without errors.
          </p>
        </div>
      )}
    </div>
  );
}

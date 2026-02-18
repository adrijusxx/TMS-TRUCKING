'use client';

import { AlertCircle, AlertTriangle, CheckCircle2, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { UseImportWizardReturn } from '@/lib/hooks/useImportWizard';

interface ImportPreviewStepProps {
  wizard: UseImportWizardReturn;
}

export function ImportPreviewStep({ wizard }: ImportPreviewStepProps) {
  if (!wizard.previewData) return null;

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">{wizard.previewData.validCount}</p>
          <p className="text-xs text-green-600 dark:text-green-400 font-medium">Valid</p>
        </div>
        <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{wizard.previewData.warningCount}</p>
          <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Warnings</p>
        </div>
        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-2xl font-bold text-red-700 dark:text-red-300">{wizard.previewData.invalidCount}</p>
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">Will Skip</p>
        </div>
      </div>

      {/* Warnings */}
      {wizard.previewData.warnings.length > 0 && (
        <Accordion type="single" collapsible>
          <AccordionItem value="warnings">
            <AccordionTrigger className="text-sm py-2">
              <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                <AlertTriangle className="w-4 h-4" />
                {wizard.previewData.warnings.length} Rows with Warnings
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ScrollArea className="h-[150px] border rounded-md bg-yellow-50/50 dark:bg-yellow-950/10">
                <div className="divide-y">
                  {wizard.previewData.warnings.slice(0, 20).map((w: any, idx: number) => (
                    <div key={idx} className="p-2 text-xs">
                      <Badge variant="outline" className="text-[10px] mr-2">Row {w.row}</Badge>
                      <span className="text-yellow-700 dark:text-yellow-400">{w.error}</span>
                    </div>
                  ))}
                  {wizard.previewData.warnings.length > 20 && (
                    <p className="p-2 text-xs text-muted-foreground">...and {wizard.previewData.warnings.length - 20} more</p>
                  )}
                </div>
              </ScrollArea>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Invalid rows */}
      {wizard.previewData.invalid.length > 0 && (
        <Accordion type="single" collapsible>
          <AccordionItem value="invalid">
            <AccordionTrigger className="text-sm py-2">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertCircle className="w-4 h-4" />
                {wizard.previewData.invalid.length} Rows Will Be Skipped
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ScrollArea className="h-[150px] border rounded-md bg-red-50/50 dark:bg-red-950/10">
                <div className="divide-y">
                  {wizard.previewData.invalid.slice(0, 20).map((e: any, idx: number) => (
                    <div key={idx} className="p-2 text-xs">
                      <Badge variant="outline" className="text-[10px] mr-2">Row {e.row}</Badge>
                      <span className="font-medium">{e.field}:</span>{' '}
                      <span className="text-red-600 dark:text-red-400">{e.error}</span>
                    </div>
                  ))}
                  {wizard.previewData.invalid.length > 20 && (
                    <p className="p-2 text-xs text-muted-foreground">...and {wizard.previewData.invalid.length - 20} more</p>
                  )}
                </div>
              </ScrollArea>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => {
            wizard.setPreviewData(null);
            wizard.setActiveStep(2);
          }}
        >
          <X className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          className="flex-1"
          onClick={() => wizard.importMutation.mutate()}
          disabled={wizard.importMutation.isPending || wizard.previewData.validCount === 0}
        >
          {wizard.importMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Approve & Import ({wizard.previewData.validCount})
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

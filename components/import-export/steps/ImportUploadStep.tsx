'use client';

import { useRef, useCallback } from 'react';
import { Upload, FileText, Trash2, ArrowRight, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import McNumberSelector from '@/components/mc-numbers/McNumberSelector';
import { apiUrl } from '@/lib/utils';
import type { UseImportWizardReturn } from '@/lib/hooks/useImportWizard';

interface ImportUploadStepProps {
  wizard: UseImportWizardReturn;
}

export function ImportUploadStep({ wizard }: ImportUploadStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) wizard.handleFileSelect(file);
  }, [wizard.handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) wizard.handleFileSelect(file);
  };

  const supportsUpdateExisting = ['drivers', 'loads', 'trucks', 'trailers'].includes(wizard.entityType);

  return (
    <div className="space-y-4">
      {/* MC Number Selector */}
      <div className="space-y-1">
        <Label className="text-xs">Assign to MC Number (Applies to all rows if not in file)</Label>
        <McNumberSelector
          value={wizard.selectedMcNumberId}
          onValueChange={wizard.setSelectedMcNumberId}
          className="w-full"
        />
      </div>

      {/* Download example */}
      <div className="flex justify-end">
        <a
          href={apiUrl(`/api/import/template?entityType=${wizard.entityType}`)}
          download
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          <Download className="w-3 h-3" /> Download Example Spreadsheet
        </a>
      </div>

      {/* File drop zone */}
      {!wizard.selectedFile ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 cursor-pointer transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium">Click to upload CSV or Excel</p>
          <p className="text-xs text-muted-foreground mt-1">or drag and drop (.csv, .xlsx, .xls)</p>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileInputChange}
          />
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium">{wizard.selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">{(wizard.selectedFile.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={wizard.handleReset} className="h-8 w-8 text-muted-foreground hover:text-destructive">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}

      {wizard.isProcessing && (
        <div>
          <Progress value={50} className="mb-2" />
          <p className="text-sm text-muted-foreground text-center">Processing file...</p>
        </div>
      )}

      {/* Update existing checkbox */}
      {supportsUpdateExisting && wizard.selectedFile && (
        <div className="flex items-start space-x-2 pt-2">
          <Checkbox
            id="update-existing"
            checked={wizard.updateExisting}
            onCheckedChange={(checked) => wizard.setUpdateExisting(checked === true)}
          />
          <div className="grid gap-1.5 leading-none">
            <label htmlFor="update-existing" className="text-sm font-medium leading-none">
              Update existing records
            </label>
            <p className="text-xs text-muted-foreground">
              If checked, records with matching IDs/emails will be updated instead of skipped.
            </p>
          </div>
        </div>
      )}

      {/* Treat as historical (loads only) */}
      {wizard.entityType === 'loads' && wizard.selectedFile && (
        <div className="flex items-start space-x-2 pt-2">
          <Checkbox
            id="treat-historical"
            checked={wizard.treatAsHistorical}
            onCheckedChange={(checked) => wizard.setTreatAsHistorical(checked === true)}
          />
          <div className="grid gap-1.5 leading-none">
            <label htmlFor="treat-historical" className="text-sm font-medium leading-none">
              Treat as historical data (recommended)
            </label>
            <p className="text-xs text-muted-foreground">
              All loads will be set to PAID status — use this for past/completed loads.
              Uncheck if you are importing active loads that still need to be dispatched or delivered.
            </p>
          </div>
        </div>
      )}

      {/* Auto-create entity toggles (loads only) */}
      {wizard.entityType === 'loads' && wizard.selectedFile && (
        <div className="space-y-2 pt-2">
          <Label className="text-xs font-medium">Auto-create missing entities</Label>
          <p className="text-xs text-muted-foreground">
            When checked, if a driver/customer/truck/trailer in your file doesn&apos;t exist in the system, it will be created automatically with placeholder data. If you plan to import drivers, customers, trucks, or trailers separately with full details, uncheck these first — otherwise you&apos;ll end up with duplicates and will need to manually clean up every affected load.
          </p>
          {([
            { key: 'customers' as const, label: 'Auto-create customers' },
            { key: 'drivers' as const, label: 'Auto-create drivers' },
            { key: 'trucks' as const, label: 'Auto-create trucks' },
            { key: 'trailers' as const, label: 'Auto-create trailers' },
          ]).map(({ key, label }) => (
            <div key={key} className="flex items-center space-x-2">
              <Checkbox
                id={`auto-create-${key}`}
                checked={wizard.autoCreate[key]}
                onCheckedChange={(checked) =>
                  wizard.setAutoCreate((prev: typeof wizard.autoCreate) => ({ ...prev, [key]: checked === true }))
                }
              />
              <label htmlFor={`auto-create-${key}`} className="text-sm leading-none">
                {label}
              </label>
            </div>
          ))}
        </div>
      )}

      {/* Next button */}
      {wizard.selectedFile && (
        <div className="flex justify-end pt-2">
          <Button onClick={() => wizard.setActiveStep(2)} className="gap-2" disabled={!wizard.importResult || wizard.isProcessing}>
            {wizard.isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Next Step'}
            {!wizard.isProcessing && <ArrowRight className="w-4 h-4" />}
          </Button>
        </div>
      )}
    </div>
  );
}

'use client';

import { useRef, useCallback } from 'react';
import { Upload, FileText, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import McNumberSelector from '@/components/mc-numbers/McNumberSelector';
import { AIImportAdvisor } from '../AIImportAdvisor';
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
              All loads will be marked as fully completed (PAID). Uncheck only if importing in-progress loads.
            </p>
          </div>
        </div>
      )}

      {/* AI Advisor */}
      {wizard.selectedFile && (wizard.isAnalyzing || wizard.aiAnalysis) && (
        <AIImportAdvisor analysis={wizard.aiAnalysis} isAnalyzing={wizard.isAnalyzing} isMapping={wizard.isAiMapping} />
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

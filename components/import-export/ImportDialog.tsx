'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, AlertCircle, CheckCircle2, X, Loader2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { csvFileToJSON, parseCSV, CSVImportResult } from '@/lib/import-export/csv-import';
import { excelFileToJSON, ExcelImportResult } from '@/lib/import-export/excel-import';
import { apiUrl } from '@/lib/utils';

interface ImportDialogProps {
  entityType: string;
  onImportComplete?: (data: any[]) => void;
  onFileUpload?: (file: File) => Promise<any>;
  validateRow?: (row: any, index: number) => { valid: boolean; errors?: string[] };
  children?: React.ReactNode;
}

export default function ImportDialog({
  entityType,
  onImportComplete,
  onFileUpload,
  validateRow,
  children,
}: ImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<CSVImportResult | ExcelImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState<{
    status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
    message: string;
    progress: number;
    created?: number;
    errors?: number;
  }>({
    status: 'idle',
    message: '',
    progress: 0,
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Please select a CSV or Excel file');
      return;
    }

    setSelectedFile(file);
    setImportResult(null);

    // Parse file
    try {
      setIsProcessing(true);
      let result: CSVImportResult | ExcelImportResult;
      
      if (file.name.endsWith('.csv')) {
        result = await csvFileToJSON(file);
      } else {
        // Excel file
        result = await excelFileToJSON(file, { validateRow });
      }
      
      setImportResult(result);
      
      if (!result.success) {
        toast.error(`Found ${result.errors.length} validation errors`);
      }
    } catch (error: any) {
      toast.error('Failed to parse file: ' + error.message);
      setImportResult(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || !importResult) {
        throw new Error('No file or import data available');
      }

      // Reset progress
      setImportProgress({
        status: 'uploading',
        message: 'Uploading file to server...',
        progress: 10,
      });

      if (onFileUpload) {
        // Use custom upload handler
        const formData = new FormData();
        formData.append('file', selectedFile);
        return await onFileUpload(selectedFile);
      }

      // Default: send to API
      setImportProgress({
        status: 'uploading',
        message: 'Uploading file...',
        progress: 20,
      });

      const formData = new FormData();
      formData.append('file', selectedFile);
      
      setImportProgress({
        status: 'processing',
        message: 'Processing import... This may take a few moments.',
        progress: 40,
      });

      const response = await fetch(apiUrl(`/api/import-export/${entityType}`), {
        method: 'POST',
        body: formData,
      });

      setImportProgress({
        status: 'processing',
        message: 'Finalizing import...',
        progress: 80,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Import failed');
      }

      const result = await response.json();
      
      setImportProgress({
        status: 'complete',
        message: 'Import completed successfully!',
        progress: 100,
        created: result.data?.created || result.data?.details?.created?.length || 0,
        errors: result.data?.errors || result.data?.details?.errors?.length || 0,
      });

      return result;
    },
    onSuccess: (data) => {
      // API response structure: 
      // { success: true, data: { created: number, errors: number, details: { created: [...], errors: [...] } } }
      const createdCount = data.data?.created ?? data.data?.details?.created?.length ?? 0;
      const errorsCount = data.data?.errors ?? data.data?.details?.errors?.length ?? 0;
      const createdItems = data.data?.details?.created ?? (Array.isArray(data.data?.created) ? data.data.created : []);
      
      // Log for debugging
      console.log('[ImportDialog] Import result:', { 
        createdCount, 
        errorsCount, 
        createdItemsLength: createdItems.length,
        responseData: data.data 
      });
      
      if (errorsCount > 0) {
        toast.warning(`Import completed with ${createdCount} item(s) created and ${errorsCount} error(s)`, {
          duration: 5000, // Show for 5 seconds
        });
      } else if (createdCount > 0) {
        toast.success(`Successfully imported ${createdCount} item(s)`, {
          duration: 5000, // Show for 5 seconds
        });
      } else {
        toast.warning('Import completed but no items were created. Check for errors.', {
          duration: 5000,
        });
      }
      
      // Call onImportComplete callback to trigger refetch
      if (onImportComplete) {
        console.log('[ImportDialog] Calling onImportComplete callback with', createdItems.length, 'items');
        onImportComplete(createdItems);
      }
      
      // Keep dialog open for 3 seconds to show completion status, then close
      setTimeout(() => {
        setOpen(false);
        setSelectedFile(null);
        setImportResult(null);
        setImportProgress({
          status: 'idle',
          message: '',
          progress: 0,
        });
      }, 3000);
    },
    onError: (error: Error) => {
      setImportProgress({
        status: 'error',
        message: error.message || 'Import failed',
        progress: 0,
      });
      toast.error(error.message || 'Import failed');
    },
  });

  const handleImport = () => {
    if (!importResult || importResult.errors.length > 0) {
      toast.error('Please fix validation errors before importing');
      return;
    }
    importMutation.mutate();
  };

  // Prevent dialog from closing during import
  const handleOpenChange = (newOpen: boolean) => {
    // Prevent closing during import
    const isImporting = importMutation.isPending || 
                        importProgress.status === 'uploading' || 
                        importProgress.status === 'processing';
    
    if (!newOpen && isImporting) {
      toast.warning('Please wait for the import to complete before closing');
      // Force dialog to stay open by setting open to true
      setOpen(true);
      return;
    }
    
    setOpen(newOpen);
    if (!newOpen && !isImporting) {
      // Reset state when dialog closes (and import is not in progress)
      setImportProgress({
        status: 'idle',
        message: '',
        progress: 0,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import {entityType.charAt(0).toUpperCase() + entityType.slice(1)}</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to import {entityType}. The first row should contain column headers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="import-file">Select File</Label>
            <div className="flex items-center gap-4">
              <input
                id="import-file"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isProcessing}
              />
              <label htmlFor="import-file">
                <Button variant="outline" asChild disabled={isProcessing}>
                  <span>
                    <FileText className="h-4 w-4 mr-2" />
                    {selectedFile ? selectedFile.name : 'Choose File'}
                  </span>
                </Button>
              </label>
              {selectedFile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    setImportResult(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Supported formats: CSV, Excel (.xlsx, .xls)
            </p>
          </div>

          {/* Import Summary */}
          {importResult && (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Import Summary</h4>
                {importResult.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                )}
              </div>
              
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Rows:</span>
                  <p className="font-medium">{importResult.summary.totalRows}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Valid:</span>
                  <p className="font-medium text-green-600">{importResult.summary.validRows}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Invalid:</span>
                  <p className="font-medium text-red-600">{importResult.summary.invalidRows}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Skipped:</span>
                  <p className="font-medium text-gray-600">{importResult.summary.skippedRows}</p>
                </div>
              </div>

              {/* Errors */}
              {importResult.errors.length > 0 && (
                <div className="border-t pt-3">
                  <h5 className="font-medium text-sm mb-2">Validation Errors ({importResult.errors.length})</h5>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {importResult.errors.slice(0, 10).map((error, index) => (
                      <div key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                        <strong>Row {error.row}:</strong> {error.errors.join(', ')}
                      </div>
                    ))}
                    {importResult.errors.length > 10 && (
                      <p className="text-xs text-muted-foreground">
                        ... and {importResult.errors.length - 10} more errors
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Preview */}
              {importResult.data.length > 0 && (
                <div className="border-t pt-3">
                  <h5 className="font-medium text-sm mb-2">Preview (first 5 rows)</h5>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b">
                          {Object.keys(importResult.data[0]).slice(0, 6).map((key) => (
                            <th key={key} className="text-left p-2 font-medium">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importResult.data.slice(0, 5).map((row, index) => (
                          <tr key={index} className="border-b">
                            {Object.keys(row).slice(0, 6).map((key) => (
                              <td key={key} className="p-2">
                                {String(row[key] || '').substring(0, 30)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Import Progress */}
          {(importMutation.isPending || importProgress.status !== 'idle') && (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {importProgress.status === 'uploading' || importProgress.status === 'processing' ? (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  ) : importProgress.status === 'complete' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : importProgress.status === 'error' ? (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-gray-600" />
                  )}
                  <h4 className="font-medium">
                    {importProgress.status === 'uploading' && 'Uploading...'}
                    {importProgress.status === 'processing' && 'Processing Import...'}
                    {importProgress.status === 'complete' && 'Import Complete!'}
                    {importProgress.status === 'error' && 'Import Failed'}
                    {importProgress.status === 'idle' && 'Ready to Import'}
                  </h4>
                </div>
                {importProgress.status === 'complete' && importProgress.created !== undefined && (
                  <div className="text-sm text-muted-foreground">
                    {importProgress.created} created
                    {importProgress.errors !== undefined && importProgress.errors > 0 && (
                      <span className="text-red-600 ml-2">{importProgress.errors} errors</span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Progress value={importProgress.progress} className="h-2" />
                <p className="text-sm text-muted-foreground">{importProgress.message}</p>
              </div>

              {importProgress.status === 'processing' && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Please wait, this may take a few moments for large files...</span>
                </div>
              )}

              {importProgress.status === 'complete' && importProgress.created !== undefined && (
                <div className="text-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-green-600 font-medium">✓ {importProgress.created} item(s) created successfully</span>
                  </div>
                  {importProgress.errors !== undefined && importProgress.errors > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-red-600 font-medium">✗ {importProgress.errors} error(s) occurred</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)} 
              disabled={isProcessing || importMutation.isPending || importProgress.status === 'uploading' || importProgress.status === 'processing'}
            >
              {importProgress.status === 'complete' ? 'Close' : 'Cancel'}
            </Button>
            <Button
              onClick={handleImport}
              disabled={!importResult || importResult.errors.length > 0 || isProcessing || importMutation.isPending || importProgress.status === 'uploading' || importProgress.status === 'processing'}
            >
              {importMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : importProgress.status === 'complete' ? (
                'Import Complete'
              ) : (
                `Import ${importResult?.summary.validRows || 0} Item(s)`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


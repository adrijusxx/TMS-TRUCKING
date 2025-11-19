'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, AlertCircle, CheckCircle2, X, Loader2, Clock, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { csvFileToJSON, parseCSV, CSVImportResult } from '@/lib/import-export/csv-import';
import { excelFileToJSON, ExcelImportResult } from '@/lib/import-export/excel-import';
import { apiUrl } from '@/lib/utils';
import ColumnMappingDialog from './ColumnMappingDialog';

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
  const [showColumnMapping, setShowColumnMapping] = useState(false);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [importErrors, setImportErrors] = useState<Array<{ row?: number; field?: string; error: string }>>([]);
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
        message: 'Uploading file to server...',
        progress: 10,
      });

      const formData = new FormData();
      formData.append('file', selectedFile);
      
      // Send column mapping if it exists
      if (Object.keys(columnMapping).length > 0) {
        formData.append('columnMapping', JSON.stringify(columnMapping));
      }
      
      setImportProgress({
        status: 'processing',
        message: 'Parsing file and validating data...',
        progress: 25,
      });

      const response = await fetch(apiUrl(`/api/import-export/${entityType}`), {
        method: 'POST',
        body: formData,
      });

      // Note: The actual processing happens on the server, so we update progress optimistically
      // The server will process in batches, but we show progress based on time
      let progressInterval: NodeJS.Timeout | null = null;
      
      if (response.ok) {
        // Start progress updates while waiting for response
        progressInterval = setInterval(() => {
          setImportProgress((prev) => {
            if (prev.status === 'processing' && prev.progress < 90) {
              const newProgress = Math.min(prev.progress + 3, 90);
              return {
                ...prev,
                progress: newProgress,
                message: newProgress < 40 
                  ? 'Parsing file and validating data...'
                  : newProgress < 60 
                  ? 'Matching customers, drivers, and trucks...'
                  : newProgress < 80
                  ? 'Calculating distances and deadhead miles...'
                  : 'Creating load records...',
              };
            }
            return prev;
          });
        }, 1500); // Update every 1.5 seconds
      }

      if (!response.ok) {
        if (progressInterval) clearInterval(progressInterval);
        const error = await response.json();
        throw new Error(error.error?.message || 'Import failed');
      }

      const result = await response.json();
      if (progressInterval) clearInterval(progressInterval);
      
      // Extract detailed errors from response
      const detailedErrors: Array<{ row?: number; field?: string; error: string }> = [];
      if (result.data?.details?.errors) {
        detailedErrors.push(...result.data.details.errors);
      } else if (result.data?.errors && Array.isArray(result.data.errors)) {
        detailedErrors.push(...result.data.errors);
      }
      
      setImportErrors(detailedErrors);
      
      const createdCount = result.data?.created || result.data?.details?.created?.length || 0;
      const errorsCount = result.data?.errors || result.data?.details?.errors?.length || detailedErrors.length || 0;
      
      setImportProgress({
        status: errorsCount > 0 && createdCount === 0 ? 'error' : 'complete',
        message: errorsCount > 0 
          ? `Import completed with ${createdCount} created and ${errorsCount} error(s)` 
          : 'Import completed successfully!',
        progress: 100,
        created: createdCount,
        errors: errorsCount,
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
      
      // Only auto-close if there are no errors, otherwise keep dialog open for user to review
      if (errorsCount === 0) {
        // Keep dialog open for 3 seconds to show completion status, then close
        setTimeout(() => {
          setOpen(false);
          setSelectedFile(null);
          setImportResult(null);
          setImportErrors([]);
          setImportProgress({
            status: 'idle',
            message: '',
            progress: 0,
          });
        }, 3000);
      }
      // If there are errors, keep dialog open - user can close manually
    },
    onError: (error: Error) => {
      setImportProgress({
        status: 'error',
        message: error.message || 'Import failed',
        progress: 0,
      });
      // Add error to error list
      setImportErrors([{ error: error.message || 'Import failed' }]);
      toast.error(error.message || 'Import failed');
      // Keep dialog open on error so user can see the error
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
      <DialogContent className="max-w-none w-[calc(100vw-0.5rem)] h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] m-1 overflow-y-auto !translate-x-[-50%] !translate-y-[-50%] !top-[50%] !left-[50%]">
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

          {/* Column Mapping Button */}
          {importResult && importResult.data.length > 0 && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowColumnMapping(true)}
                className="gap-2"
              >
                <Settings2 className="h-4 w-4" />
                Map Columns
              </Button>
            </div>
          )}

          {/* Import Summary */}
          {importResult && (
            <div className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Import Summary</h4>
                {importResult.success ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                )}
              </div>
              
              <div className="grid grid-cols-4 gap-3 text-xs">
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
                <div className="border-t pt-2">
                  <h5 className="font-medium text-xs mb-1.5">Validation Errors ({importResult.errors.length})</h5>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {importResult.errors.slice(0, 10).map((error, index) => (
                      <div key={index} className="text-[10px] text-red-600 bg-red-50 p-1.5 rounded">
                        <strong>Row {error.row}:</strong> {error.errors.join(', ')}
                      </div>
                    ))}
                    {importResult.errors.length > 10 && (
                      <p className="text-[10px] text-muted-foreground">
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
                  <div className="max-h-[50vh] overflow-auto">
                    <table className="w-full text-[10px] border-collapse" style={{ tableLayout: 'fixed', width: '100%' }}>
                      <thead className="sticky top-0 bg-background z-10 border-b">
                        <tr>
                          {Object.keys(importResult.data[0]).map((key) => {
                            // Calculate column width based on total columns
                            const totalCols = Object.keys(importResult.data[0]).length;
                            const colWidth = `${100 / totalCols}%`;
                            return (
                              <th 
                                key={key} 
                                className="text-left p-1.5 font-medium border-r last:border-r-0 bg-muted/50"
                                style={{ width: colWidth, minWidth: '80px' }}
                              >
                                <div className="truncate text-[10px]" title={key}>{key}</div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {importResult.data.slice(0, 5).map((row, index) => (
                          <tr key={index} className="border-b hover:bg-muted/30">
                            {Object.keys(row).map((key) => {
                              const totalCols = Object.keys(row).length;
                              const colWidth = `${100 / totalCols}%`;
                              return (
                                <td 
                                  key={key} 
                                  className="p-1.5 border-r last:border-r-0 align-top"
                                  style={{ width: colWidth, minWidth: '80px' }}
                                >
                                  <div 
                                    className="text-[10px] break-words leading-tight" 
                                    title={String(row[key] || '')}
                                    style={{ 
                                      wordBreak: 'break-word',
                                      overflowWrap: 'break-word',
                                      maxHeight: '60px',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      display: '-webkit-box',
                                      WebkitLineClamp: 3,
                                      WebkitBoxOrient: 'vertical'
                                    }}
                                  >
                                    {String(row[key] || '')}
                                  </div>
                                </td>
                              );
                            })}
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
              
              {/* Detailed Error List */}
              {importErrors.length > 0 && (
                <div className="border-t pt-3 mt-3">
                  <h5 className="font-medium text-sm mb-2 text-red-600">
                    Import Errors ({importErrors.length})
                  </h5>
                  <div className="max-h-60 overflow-y-auto space-y-1.5">
                    {importErrors.map((error, index) => (
                      <div 
                        key={index} 
                        className="text-xs bg-red-50 border border-red-200 rounded p-2"
                      >
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-3 w-3 text-red-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            {error.row && (
                              <span className="font-semibold text-red-800">Row {error.row}: </span>
                            )}
                            {error.field && (
                              <span className="font-medium text-red-700">[{error.field}] </span>
                            )}
                            <span className="text-red-700">{error.error}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Please fix these errors and try importing again. The dialog will remain open so you can review the errors.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setOpen(false);
                setSelectedFile(null);
                setImportResult(null);
                setImportErrors([]);
                setColumnMapping({});
                setImportProgress({
                  status: 'idle',
                  message: '',
                  progress: 0,
                });
              }} 
              disabled={isProcessing || importMutation.isPending || importProgress.status === 'uploading' || importProgress.status === 'processing'}
            >
              {importProgress.status === 'complete' || importProgress.status === 'error' ? 'Close' : 'Cancel'}
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

        {/* Column Mapping Dialog */}
        {importResult && importResult.data.length > 0 && (
          <ColumnMappingDialog
            open={showColumnMapping}
            onOpenChange={setShowColumnMapping}
            excelColumns={Object.keys(importResult.data[0] || {})}
            systemFields={getSystemFieldsForEntity(entityType)}
            initialMapping={columnMapping}
            onMappingComplete={(mapping) => {
              setColumnMapping(mapping);
              toast.success('Column mapping saved. It will be applied during import.');
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// Helper function to get system fields for each entity type
function getSystemFieldsForEntity(entityType: string): Array<{ key: string; label: string; required?: boolean }> {
  if (entityType === 'loads') {
    return [
      // Identification
      { key: 'Shipment ID', label: 'Shipment ID' },
      { key: 'Load ID', label: 'Load ID', required: true },
      { key: 'Trip ID', label: 'Trip ID' },
      
      // Creation Info
      { key: 'Created By', label: 'Created By' },
      { key: 'Created date', label: 'Created Date' },
      
      // Customer & Personnel
      { key: 'Customer', label: 'Customer', required: true },
      { key: 'Driver', label: 'Driver' },
      { key: 'Driver/Carrier', label: 'Driver/Carrier' },
      { key: 'Carrier', label: 'Carrier' },
      { key: 'Company/Carrier', label: 'Company/Carrier' },
      { key: 'Driver MC', label: 'Driver MC' },
      { key: 'Co-Driver', label: 'Co-Driver' },
      { key: 'Co Driver', label: 'Co Driver' },
      { key: 'Dispatcher', label: 'Dispatcher' },
      
      // Equipment
      { key: 'Truck', label: 'Truck' },
      { key: 'Trailer', label: 'Trailer' },
      { key: 'MC Number', label: 'MC Number' },
      { key: 'Equipment type', label: 'Equipment Type' },
      
      // Pickup Information
      { key: 'Pickup location', label: 'Pickup Location', required: true },
      { key: 'Pickup state', label: 'Pickup State' },
      { key: 'Pickup Address', label: 'Pickup Address' },
      { key: 'Pickup City', label: 'Pickup City' },
      { key: 'Pickup Zip', label: 'Pickup Zip' },
      { key: 'Pickup Appointment', label: 'Pickup Appointment' },
      { key: 'Pickup Time', label: 'Pickup Time' },
      { key: 'PU date', label: 'Pickup Date', required: true },
      { key: 'Pickup date', label: 'Pickup Date', required: true },
      { key: 'Pickup company', label: 'Pickup Company' },
      { key: 'Pickup company ID', label: 'Pickup Company ID' },
      { key: 'Pickup Contact', label: 'Pickup Contact' },
      { key: 'Pickup Phone', label: 'Pickup Phone' },
      { key: 'Pickup Notes', label: 'Pickup Notes' },
      
      // Delivery Information
      { key: 'Delivery location', label: 'Delivery Location', required: true },
      { key: 'Delivery state', label: 'Delivery State' },
      { key: 'Delivery Address', label: 'Delivery Address' },
      { key: 'Delivery City', label: 'Delivery City' },
      { key: 'Delivery Zip', label: 'Delivery Zip' },
      { key: 'Delivery Appointment', label: 'Delivery Appointment' },
      { key: 'Delivery Time', label: 'Delivery Time' },
      { key: 'DEL date', label: 'Delivery Date', required: true },
      { key: 'Delivery date', label: 'Delivery Date', required: true },
      { key: 'Delivery company', label: 'Delivery Company' },
      { key: 'Delivery company ID', label: 'Delivery Company ID' },
      { key: 'Delivery Contact', label: 'Delivery Contact' },
      { key: 'Delivery Phone', label: 'Delivery Phone' },
      { key: 'Delivery Notes', label: 'Delivery Notes' },
      
      // Load Details
      { key: 'Status', label: 'Load Status' },
      { key: 'Load status', label: 'Load Status' },
      { key: 'Weight', label: 'Weight' },
      { key: 'Pieces', label: 'Pieces' },
      { key: 'Commodity', label: 'Commodity' },
      { key: 'Pallets', label: 'Pallets' },
      { key: 'Temperature', label: 'Temperature' },
      { key: 'Hazmat', label: 'Hazmat' },
      { key: 'Hazmat Class', label: 'Hazmat Class' },
      
      // Financial
      { key: 'Revenue', label: 'Revenue', required: true },
      { key: 'Driver Pay', label: 'Driver Pay' },
      { key: 'Load pay', label: 'Load Pay' },
      { key: 'Total pay', label: 'Total Pay' },
      { key: 'Fuel Advance', label: 'Fuel Advance' },
      { key: 'Service Fee', label: 'Service Fee' },
      { key: 'Expenses', label: 'Expenses' },
      { key: 'Profit', label: 'Profit' },
      
      // Miles & Distance
      { key: 'Miles', label: 'Loaded Miles' },
      { key: 'Loaded Miles', label: 'Loaded Miles' },
      { key: 'Empty miles', label: 'Empty Miles' },
      { key: 'Empty Miles', label: 'Empty Miles' },
      { key: 'Deadhead', label: 'Deadhead Miles' },
      { key: 'Total miles', label: 'Total Miles' },
      { key: 'Total Miles', label: 'Total Miles' },
      { key: 'Revenue per mile', label: 'Revenue Per Mile' },
      { key: 'Revenue Per Mile', label: 'Revenue Per Mile' },
      
      // Additional
      { key: 'Stops count', label: 'Stops Count' },
      { key: 'Stops Count', label: 'Stops Count' },
      { key: 'Documents', label: 'Documents' },
      { key: 'Last update', label: 'Last Update' },
      { key: 'Last Update', label: 'Last Update' },
      { key: 'On Time Delivery', label: 'On Time Delivery' },
      { key: 'Last note', label: 'Last Note' },
      { key: 'Last Note', label: 'Last Note' },
      { key: 'Dispatch Notes', label: 'Dispatch Notes' },
      { key: 'Driver Notes', label: 'Driver Notes' },
    ];
  }
  
  // Add more entity types as needed
  return [];
}


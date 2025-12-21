'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, AlertCircle, CheckCircle2, X, Loader2, Clock, Settings2, Maximize2, Minimize2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { csvFileToJSON, parseCSV, CSVImportResult } from '@/lib/import-export/csv-import';
import { excelFileToJSON, ExcelImportResult } from '@/lib/import-export/excel-import';
import { apiUrl } from '@/lib/utils';
import ColumnMappingDialog from './ColumnMappingDialog';
import ImportFieldWarnings from './ImportFieldWarnings';
import ValueResolutionDialog from './ValueResolutionDialog';
import { validateImportData, getModelNameFromEntityType } from '@/lib/validations/import-field-validator';
import McNumberSelector from '@/components/mc-numbers/McNumberSelector';
import { useSession } from 'next-auth/react';
import { deduplicateSystemFields } from '@/lib/import-export/field-utils';

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
  const [unresolvedValues, setUnresolvedValues] = useState<Array<{ row: number; field: string; value: string; error: string }>>([]);
  const [showValueResolution, setShowValueResolution] = useState(false);
  const [valueResolutions, setValueResolutions] = useState<Record<string, Record<string, string>>>({});
  const [isMaximized, setIsMaximized] = useState(false);
  const [fieldValidation, setFieldValidation] = useState<{
    missingRequiredFields: any[];
    missingOptionalFields: any[];
  } | null>(null);
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
  const [selectedMcNumberId, setSelectedMcNumberId] = useState<string>('');
  const [updateExisting, setUpdateExisting] = useState<boolean>(false);
  const { data: session } = useSession();

  // Memoize system fields to avoid recalculating on every render (especially important for drivers with 110+ fields)
  const systemFields = useMemo(() => {
    const rawFields = getSystemFieldsForEntity(entityType);
    return deduplicateSystemFields(rawFields);
  }, [entityType]);

  // Re-validate when column mapping changes
  useEffect(() => {
    if (importResult && importResult.success && importResult.data && importResult.data.length > 0) {
      const csvHeaders = Object.keys(importResult.data[0] || {});
      const modelName = getModelNameFromEntityType(entityType);
      const validation = validateImportData(modelName, csvHeaders, importResult.data[0], columnMapping);
      setFieldValidation({
        missingRequiredFields: validation.missingRequiredFields,
        missingOptionalFields: validation.missingOptionalFields,
      });
    }
  }, [columnMapping, importResult, entityType]);

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
      
      // Validate fields against schema
      if (result.success && result.data && result.data.length > 0) {
        const csvHeaders = Object.keys(result.data[0] || {});
        
        // Auto-map columns when file is parsed (use memoized systemFields)
        const autoMapping: Record<string, string> = {};
        
        csvHeaders.forEach((excelCol) => {
          const normalizedExcel = excelCol.toLowerCase().trim().replace(/[_\s-]/g, '');
          
          // Try to find matching system field with better matching logic
          let bestMatch: { field: typeof systemFields[0]; score: number } | null = null;
          
          for (const field of systemFields) {
            const normalizedField = field.key.toLowerCase().replace(/[_\s-]/g, '');
            let score = 0;
            
            // Exact match gets highest priority
            if (normalizedExcel === normalizedField) {
              score = 100;
            }
            // Field contains Excel column (e.g., "customer_name" contains "customer")
            else if (normalizedField.includes(normalizedExcel) && normalizedExcel.length >= 3) {
              score = 80;
            }
            // Excel column contains field (e.g., "customer_name" contains "customer")
            else if (normalizedExcel.includes(normalizedField) && normalizedField.length >= 3) {
              score = 70;
            }
            // Check if they start with the same characters (for partial matches)
            else if (normalizedExcel.length >= 4 && normalizedField.length >= 4) {
              const minLen = Math.min(normalizedExcel.length, normalizedField.length);
              let matchingChars = 0;
              for (let i = 0; i < minLen; i++) {
                if (normalizedExcel[i] === normalizedField[i]) matchingChars++;
              }
              // If at least 4 characters match, give it a score
              if (matchingChars >= 4) {
                score = 50 + (matchingChars / minLen) * 20;
              }
            }
            
            // Update best match if this score is better
            if (score > 0 && (!bestMatch || score > bestMatch.score)) {
              bestMatch = { field, score };
            }
          }
          
          // Only auto-map if we have a reasonable match (score >= 50)
          if (bestMatch && bestMatch.score >= 50) {
            autoMapping[excelCol] = bestMatch.field.key;
          }
        });
        
        setColumnMapping(autoMapping);
        
        const modelName = getModelNameFromEntityType(entityType);
        const validation = validateImportData(modelName, csvHeaders, result.data[0], autoMapping);
        setFieldValidation({
          missingRequiredFields: validation.missingRequiredFields,
          missingOptionalFields: validation.missingOptionalFields,
        });
        
        // Show warning if critical fields are missing
        if (validation.missingRequiredFields.filter(f => f.severity === 'error').length > 0) {
          toast.warning(
            `Missing ${validation.missingRequiredFields.filter(f => f.severity === 'error').length} required field(s). Import may fail.`,
            { duration: 6000 }
          );
        }
        
        // Show success message for auto-mapping
        const mappedCount = Object.keys(autoMapping).length;
        if (mappedCount > 0) {
          toast.success(`${mappedCount} column(s) automatically mapped. Review and adjust if needed.`, { duration: 4000 });
        }
      } else {
        setFieldValidation(null);
      }
      
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
      
      // Send value resolutions if they exist
      if (Object.keys(valueResolutions).length > 0) {
        formData.append('valueResolutions', JSON.stringify(valueResolutions));
      }
      
      // Send MC number ID if selected
      if (selectedMcNumberId) {
        formData.append('mcNumberId', selectedMcNumberId);
      }
      
      // Send import mode (update existing drivers)
      if (entityType === 'drivers' && updateExisting) {
        formData.append('importMode', 'upsert');
        formData.append('updateExisting', 'true'); // Also send legacy parameter for compatibility
        console.log('[ImportDialog] Sending importMode=upsert and updateExisting=true for drivers');
      } else if (entityType === 'drivers') {
        console.log('[ImportDialog] updateExisting is false, not sending upsert mode');
      }
      
      setImportProgress({
        status: 'processing',
        message: 'Parsing file and validating data...',
        progress: 25,
      });

      // Use dedicated invoice import route if available
      const importEndpoint = entityType === 'invoices' 
        ? `/api/invoices/import`
        : `/api/import-export/${entityType}`;
      
      const response = await fetch(apiUrl(importEndpoint), {
        method: 'POST',
        body: formData,
      });

      // Enhanced progress tracking with more frequent updates and better messages
      let progressInterval: NodeJS.Timeout | null = null;
      let progressStep = 25; // Start at 25% after upload
      let messageIndex = 0;
      const progressMessages = [
        'Validating file structure...',
        'Parsing data rows...',
        'Matching customers and vendors...',
        'Matching drivers and dispatchers...',
        'Matching trucks and trailers...',
        'Validating load data...',
        'Calculating distances...',
        'Creating database records...',
        'Finalizing import...',
      ];
      
      if (response.ok) {
        // Start progress updates while waiting for response - faster updates for better UX
        progressInterval = setInterval(() => {
          setImportProgress((prev) => {
            if (prev.status === 'processing' && prev.progress < 95) {
              // Increment progress more gradually but smoothly
              const increment = prev.progress < 50 ? 2 : 1.5; // Faster at start, slower near end
              const newProgress = Math.min(prev.progress + increment, 95);
              
              // Update message based on progress
              const messageStep = Math.floor((newProgress - 25) / 8); // 25-95 range divided into steps
              const message = messageStep < progressMessages.length 
                ? progressMessages[messageStep] 
                : progressMessages[progressMessages.length - 1];
              
              return {
                ...prev,
                progress: newProgress,
                message,
              };
            }
            return prev;
          });
        }, 800); // Update every 800ms for smoother progress
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
      
      // Extract unresolved values for value resolution dialog
      if (result.data?.unresolvedValues && Array.isArray(result.data.unresolvedValues) && result.data.unresolvedValues.length > 0) {
        setUnresolvedValues(result.data.unresolvedValues);
        // Don't auto-open, let user see the prominent section first
      } else {
        // Also check errors for unresolved value patterns
        const unresolvedFromErrors: Array<{ row: number; field: string; value: string; error: string }> = [];
        detailedErrors.forEach((error: any) => {
          if (error.error?.includes('could not be resolved') || error.error?.includes('not found')) {
            // Try to extract field and value from error message
            const mcMatch = error.error?.match(/MC number "([^"]+)" could not be resolved/);
            if (mcMatch) {
              unresolvedFromErrors.push({
                row: error.row || 0,
                field: 'MC Number',
                value: mcMatch[1],
                error: error.error,
              });
            }
          }
        });
        if (unresolvedFromErrors.length > 0) {
          setUnresolvedValues(unresolvedFromErrors);
        } else {
          setUnresolvedValues([]);
        }
      }
      
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
      
      // Check for specific message from API
      const apiMessage = data.data?.message;
      
      if (errorsCount > 0 && createdCount === 0) {
        // All imports failed - show error toast with helpful message
        toast.error(apiMessage || `Import failed: ${errorsCount} error(s) prevented import. Check error details below.`, {
          duration: 8000, // Show longer for errors
        });
      } else if (errorsCount > 0) {
        // Some succeeded, some failed
        toast.warning(`Import completed with ${createdCount} item(s) created and ${errorsCount} error(s)`, {
          duration: 5000,
        });
      } else if (createdCount > 0) {
        toast.success(`Successfully imported ${createdCount} item(s)`, {
          duration: 5000,
        });
      } else {
        // No items created and no errors (shouldn't happen, but handle it)
        toast.warning(apiMessage || 'Import completed but no items were created. Check for errors.', {
          duration: 8000,
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
    
    // Warn if critical fields are missing
    if (fieldValidation) {
      const criticalMissing = fieldValidation.missingRequiredFields.filter(f => f.severity === 'error');
      if (criticalMissing.length > 0) {
        const proceed = confirm(
          `Warning: ${criticalMissing.length} required field(s) are missing. Import will likely fail.\n\n` +
          `Missing fields: ${criticalMissing.map(f => f.fieldName).join(', ')}\n\n` +
          `Do you want to proceed anyway?`
        );
        if (!proceed) {
          return;
        }
      }
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
      <DialogContent 
        className={`${isMaximized ? '!max-w-[100vw] !w-[100vw] !max-h-[100vh] !h-[100vh] !m-0 sm:!max-w-[100vw]' : '!max-w-[95vw] !w-[95vw] !max-h-[95vh] !h-[95vh] !m-4 sm:!max-w-[95vw]'} overflow-hidden flex flex-col !translate-x-[-50%] !translate-y-[-50%] !top-[50%] !left-[50%] transition-all duration-200`}
        style={isMaximized ? {
          maxWidth: '100vw',
          width: '100vw',
          maxHeight: '100vh',
          height: '100vh',
          margin: 0,
        } : {
          maxWidth: '95vw',
          width: '95vw',
          maxHeight: '95vh',
          height: '95vh',
          margin: '1rem',
        }}
      >
        <DialogHeader className="flex-shrink-0 flex flex-row items-start justify-between gap-4 pb-2">
          <div className="flex-1">
            <DialogTitle>Import {entityType.charAt(0).toUpperCase() + entityType.slice(1)}</DialogTitle>
            <DialogDescription>
              Upload a CSV or Excel file to import {entityType}. The first row should contain column headers.
            </DialogDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMaximized(!isMaximized)}
            className="h-8 w-8 flex-shrink-0"
            title={isMaximized ? 'Minimize' : 'Maximize'}
          >
            {isMaximized ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Step 1: File Upload */}
          <div className="border rounded-lg p-4 space-y-3 bg-card">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                1
              </div>
              <Label htmlFor="import-file" className="text-base font-semibold">Select File</Label>
            </div>
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
                <Button variant="outline" asChild disabled={isProcessing} className="h-10">
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
                    setUnresolvedValues([]);
                    setValueResolutions({});
                    setUpdateExisting(false);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Supported formats: CSV, Excel (.xlsx, .xls)
            </p>
            
            {/* MC Number Selection */}
            <div className="pt-2 border-t space-y-3">
              <McNumberSelector
                value={selectedMcNumberId}
                onValueChange={setSelectedMcNumberId}
                label="Assign to MC Number"
                required={false}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Select an MC number to assign all imported records to. Leave empty to use your current MC selection.
              </p>
              
              {/* Update Existing Option (for drivers only) */}
              {entityType === 'drivers' && (
                <div className="pt-2 border-t space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="update-existing"
                      checked={updateExisting}
                      onCheckedChange={(checked) => setUpdateExisting(checked === true)}
                    />
                    <label htmlFor="update-existing" className="text-sm font-medium cursor-pointer">
                      Update existing drivers
                    </label>
                  </div>
                  {updateExisting && (
                    <p className="text-xs text-muted-foreground ml-6">
                      If a driver with the same driver number or email already exists, update their information instead of skipping.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Column Mapping */}
          {importResult && importResult.data.length > 0 && (
            <div id="column-mapping-section" className="border rounded-lg p-4 space-y-3 bg-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-semibold text-sm">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-base">Column Mapping</h4>
                    <p className="text-xs text-muted-foreground">
                      Map your Excel/CSV columns to system fields for accurate import
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowColumnMapping(true)}
                  className="gap-2"
                >
                  <Settings2 className="h-4 w-4" />
                  {Object.keys(columnMapping).length > 0 ? `${Object.keys(columnMapping).length} Mapped` : 'Map Columns'}
                </Button>
              </div>
              {Object.keys(columnMapping).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(columnMapping).slice(0, 5).map(([excelCol, systemField]) => (
                    <div key={excelCol} className="text-xs bg-muted px-2 py-1 rounded flex items-center gap-1">
                      <span className="font-medium">{excelCol}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium">{systemField}</span>
                    </div>
                  ))}
                  {Object.keys(columnMapping).length > 5 && (
                    <span className="text-xs text-muted-foreground">
                      +{Object.keys(columnMapping).length - 5} more
                    </span>
                  )}
                </div>
              )}
              {fieldValidation && (
                <ImportFieldWarnings
                  missingRequiredFields={fieldValidation.missingRequiredFields}
                  missingOptionalFields={fieldValidation.missingOptionalFields}
                  csvHeaders={Object.keys(importResult.data[0] || {})}
                  onFieldMapping={(fieldName, csvHeader) => {
                    setColumnMapping(prev => ({
                      ...prev,
                      [csvHeader]: fieldName,
                    }));
                    toast.success(`Mapped "${csvHeader}" to "${fieldName}"`);
                  }}
                />
              )}
            </div>
          )}

          {/* Step 3: Value Resolution - Prominent */}
          {unresolvedValues.length > 0 && (
            <div className="border-2 border-yellow-500 rounded-lg p-4 space-y-3 bg-yellow-50 dark:bg-yellow-950/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500 text-white font-semibold text-sm">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-base text-yellow-900 dark:text-yellow-100">
                      Resolve Unmapped Values
                    </h4>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      {unresolvedValues.length} value(s) need manual resolution (e.g., MC numbers)
                    </p>
                  </div>
                </div>
                <Button
                  variant="default"
                  onClick={() => setShowValueResolution(true)}
                  className="gap-2 bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  <Settings2 className="h-4 w-4" />
                  Resolve Values
                </Button>
              </div>
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="mb-2">The following values could not be automatically resolved:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  {Array.from(new Set(unresolvedValues.map(uv => `${uv.field}: "${uv.value}"`))).slice(0, 5).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                  {unresolvedValues.length > 5 && (
                    <li className="text-muted-foreground">... and {unresolvedValues.length - 5} more</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Step 4: Import Summary */}
          {importResult && (
            <div className="border rounded-lg p-4 space-y-3 bg-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted font-semibold text-sm">
                    4
                  </div>
                  <h4 className="font-semibold text-base">Import Summary</h4>
                </div>
                {importResult.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                )}
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <span className="text-xs text-muted-foreground block mb-1">Total Rows</span>
                  <p className="text-lg font-semibold">{importResult.summary.totalRows}</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <span className="text-xs text-muted-foreground block mb-1">Valid</span>
                  <p className="text-lg font-semibold text-green-600">{importResult.summary.validRows}</p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <span className="text-xs text-muted-foreground block mb-1">Invalid</span>
                  <p className="text-lg font-semibold text-red-600">{importResult.summary.invalidRows}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-950/20 rounded-lg">
                  <span className="text-xs text-muted-foreground block mb-1">Skipped</span>
                  <p className="text-lg font-semibold text-gray-600">{importResult.summary.skippedRows}</p>
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

        </div>

        {/* Actions - Fixed at bottom */}
        <div className="flex-shrink-0 border-t pt-4 mt-4 flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setOpen(false);
                setSelectedFile(null);
                setImportResult(null);
                setImportErrors([]);
                setColumnMapping({});
                setSelectedMcNumberId('');
                setUpdateExisting(false);
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
              variant={fieldValidation && fieldValidation.missingRequiredFields.filter(f => f.severity === 'error').length > 0 ? 'destructive' : 'default'}
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

        {/* Column Mapping Dialog */}
        {importResult && importResult.data.length > 0 && (
          <ColumnMappingDialog
            open={showColumnMapping}
            onOpenChange={setShowColumnMapping}
            excelColumns={Object.keys(importResult.data[0] || {})}
            systemFields={systemFields}
            initialMapping={columnMapping}
            onMappingComplete={(mapping) => {
              setColumnMapping(mapping);
              toast.success('Column mapping saved. Validation updated.');
            }}
          />
        )}

        {/* Value Resolution Dialog */}
        {unresolvedValues.length > 0 && (
          <ValueResolutionDialog
            open={showValueResolution}
            onOpenChange={setShowValueResolution}
            unresolvedValues={unresolvedValues}
            entityType={entityType}
            onResolutionsComplete={(resolutions) => {
              setValueResolutions(resolutions);
              toast.success('Value resolutions saved. Retry the import to apply them.');
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
  
  if (entityType === 'drivers') {
    return [
      // Required Fields - with variations
      { key: 'email', label: 'Email *', required: true },
      { key: 'first_name', label: 'First Name *', required: true },
      { key: 'FirstName', label: 'First Name *', required: true },
      { key: 'first name', label: 'First Name *', required: true },
      { key: 'last_name', label: 'Last Name *', required: true },
      { key: 'LastName', label: 'Last Name *', required: true },
      { key: 'last name', label: 'Last Name *', required: true },
      
      // Driver Identification
      { key: 'driver_number', label: 'Driver Number' },
      { key: 'driverNumber', label: 'Driver Number' },
      { key: 'Driver Number', label: 'Driver Number' },
      { key: 'driver_id', label: 'Driver ID' },
      { key: 'license_number', label: 'License Number' },
      { key: 'licenseNumber', label: 'License Number' },
      { key: 'License Number', label: 'License Number' },
      { key: 'license_state', label: 'License State' },
      { key: 'licenseState', label: 'License State' },
      { key: 'License State', label: 'License State' },
      { key: 'license_expiry', label: 'License Expiry' },
      
      // Contact Information
      { key: 'phone', label: 'Phone' },
      { key: 'Phone', label: 'Phone' },
      { key: 'contact_number', label: 'Contact Number' },
      { key: 'contactNumber', label: 'Contact Number' },
      { key: 'Contact Number', label: 'Contact Number' },
      { key: 'mobile', label: 'Mobile' },
      
      // Status Fields - with variations
      { key: 'assign_status', label: 'Assign Status' },
      { key: 'assignment_status', label: 'Assignment Status' },
      { key: 'assignmentStatus', label: 'Assignment Status' },
      { key: 'Assignment Status', label: 'Assignment Status' },
      { key: 'employee_status', label: 'Employee Status' },
      { key: 'employeeStatus', label: 'Employee Status' },
      { key: 'Employee Status', label: 'Employee Status' },
      { key: 'driver_status', label: 'Driver Status' },
      { key: 'driverStatus', label: 'Driver Status' },
      { key: 'Driver Status', label: 'Driver Status' },
      { key: 'status', label: 'Status' },
      { key: 'Status', label: 'Status' },
      { key: 'dispatch_status', label: 'Dispatch Status' },
      { key: 'dispatchStatus', label: 'Dispatch Status' },
      { key: 'Dispatch Status', label: 'Dispatch Status' },
      
      // Driver Details
      { key: 'driver_type', label: 'Driver Type' },
      { key: 'driverType', label: 'Driver Type' },
      { key: 'Driver Type', label: 'Driver Type' },
      { key: 'team_driver', label: 'Team Driver' },
      { key: 'teamDriver', label: 'Team Driver' },
      { key: 'Team Driver', label: 'Team Driver' },
      { key: 'mc_number', label: 'MC Number' },
      { key: 'mcNumber', label: 'MC Number' },
      { key: 'MC Number', label: 'MC Number' },
      
      // Equipment Assignment
      { key: 'truck', label: 'Truck' },
      { key: 'Truck', label: 'Truck' },
      { key: 'trailer', label: 'Trailer' },
      { key: 'Trailer', label: 'Trailer' },
      
      // Payment Information
      { key: 'pay_to', label: 'Pay To' },
      { key: 'payTo', label: 'Pay To' },
      { key: 'Pay To', label: 'Pay To' },
      { key: 'driver_tariff', label: 'Driver Tariff' },
      { key: 'driverTariff', label: 'Driver Tariff' },
      { key: 'Driver Tariff', label: 'Driver Tariff' },
      { key: 'pay_type', label: 'Pay Type' },
      { key: 'payType', label: 'Pay Type' },
      { key: 'Pay Type', label: 'Pay Type' },
      { key: 'pay_rate', label: 'Pay Rate' },
      { key: 'payRate', label: 'Pay Rate' },
      { key: 'Pay Rate', label: 'Pay Rate' },
      
      // Additional Fields
      { key: 'note', label: 'Note' },
      { key: 'Note', label: 'Note' },
      { key: 'notes', label: 'Notes' },
      { key: 'Notes', label: 'Notes' },
      { key: 'warnings', label: 'Warnings' },
      { key: 'Warnings', label: 'Warnings' },
      { key: 'home_terminal', label: 'Home Terminal' },
      { key: 'homeTerminal', label: 'Home Terminal' },
      { key: 'Home Terminal', label: 'Home Terminal' },
      { key: 'emergency_contact', label: 'Emergency Contact' },
      { key: 'emergencyContact', label: 'Emergency Contact' },
      { key: 'Emergency Contact', label: 'Emergency Contact' },
      { key: 'emergency_phone', label: 'Emergency Phone' },
      { key: 'emergencyPhone', label: 'Emergency Phone' },
      { key: 'Emergency Phone', label: 'Emergency Phone' },
      { key: 'hire_date', label: 'Hire Date' },
      { key: 'hireDate', label: 'Hire Date' },
      { key: 'Hire Date', label: 'Hire Date' },
      { key: 'termination_date', label: 'Termination Date' },
      { key: 'terminationDate', label: 'Termination Date' },
      { key: 'Termination Date', label: 'Termination Date' },
      { key: 'drug_test_date', label: 'Drug Test Date' },
      { key: 'drugTestDate', label: 'Drug Test Date' },
      { key: 'Drug Test Date', label: 'Drug Test Date' },
      { key: 'background_check', label: 'Background Check' },
      { key: 'backgroundCheck', label: 'Background Check' },
      { key: 'Background Check', label: 'Background Check' },
      { key: 'medical_card_expiry', label: 'Medical Card Expiry' },
      { key: 'medicalCardExpiry', label: 'Medical Card Expiry' },
      { key: 'Medical Card Expiry', label: 'Medical Card Expiry' },
    ];
  }
  
  if (entityType === 'trailers') {
    return [
      // Required Fields
      { key: 'unit_number', label: 'Unit Number *', required: true },
      { key: 'make', label: 'Make *', required: true },
      { key: 'model', label: 'Model *', required: true },
      
      // Vehicle Details
      { key: 'vin', label: 'VIN' },
      { key: 'year', label: 'Year' },
      { key: 'type', label: 'Type' },
      
      // License & Registration
      { key: 'plate_number', label: 'Plate Number' },
      { key: 'state', label: 'State' },
      { key: 'registration_expiry_date', label: 'Registration Expiry Date' },
      
      // MC Number & Ownership
      { key: 'mc_number', label: 'MC Number' },
      { key: 'ownership', label: 'Ownership' },
      { key: 'owner_name', label: 'Owner Name' },
      
      // Assignments
      { key: 'assigned_truck', label: 'Assigned Truck' },
      { key: 'operator_(driver)', label: 'Operator (Driver)' },
      
      // Status
      { key: 'status', label: 'Status' },
      { key: 'fleet_status', label: 'Fleet Status' },
      
      // Inspection & Insurance
      { key: 'annual_inspection_expiry_date', label: 'Annual Inspection Expiry Date' },
      { key: 'insurance_expiry_date', label: 'Insurance Expiry Date' },
      
      // Additional
      { key: 'tags', label: 'Tags' },
    ];
  }
  
  if (entityType === 'invoices') {
    return [
      // Required Fields
      { key: 'invoiceNumber', label: 'Invoice Number', required: true },
      { key: 'invoice_id', label: 'Invoice ID', required: true },
      { key: 'invoiceNumber', label: 'Invoice Number', required: true },
      { key: 'Invoice ID', label: 'Invoice ID', required: true },
      
      // Customer
      { key: 'customerId', label: 'Customer ID', required: true },
      { key: 'customer_name', label: 'Customer Name', required: true },
      { key: 'customerName', label: 'Customer Name', required: true },
      { key: 'Customer Name', label: 'Customer Name', required: true },
      { key: 'customer', label: 'Customer', required: true },
      
      // Load
      { key: 'loadId', label: 'Load ID' },
      { key: 'load_id', label: 'Load ID' },
      { key: 'Load ID', label: 'Load ID' },
      { key: 'load', label: 'Load' },
      
      // MC Number
      { key: 'mcNumber', label: 'MC Number' },
      { key: 'mc_number', label: 'MC Number' },
      { key: 'MC Number', label: 'MC Number' },
      { key: 'mc', label: 'MC Number' },
      
      // Dates
      { key: 'invoiceDate', label: 'Invoice Date', required: true },
      { key: 'date', label: 'Date', required: true },
      { key: 'Date', label: 'Date', required: true },
      { key: 'invoice_date', label: 'Invoice Date', required: true },
      { key: 'Invoice Date', label: 'Invoice Date', required: true },
      { key: 'dueDate', label: 'Due Date' },
      { key: 'due_date', label: 'Due Date' },
      { key: 'Due Date', label: 'Due Date' },
      
      // Status
      { key: 'status', label: 'Status' },
      { key: 'Status', label: 'Status' },
      { key: 'invoice_status', label: 'Invoice Status' },
      { key: 'Invoice Status', label: 'Invoice Status' },
      { key: 'subStatus', label: 'Sub Status' },
      { key: 'sub_status', label: 'Sub Status' },
      { key: 'Sub Status', label: 'Sub Status' },
      
      // Aging
      { key: 'agingDays', label: 'Aging Days' },
      { key: 'aging_days', label: 'Aging Days' },
      { key: 'Aging Days', label: 'Aging Days' },
      { key: 'agingStatus', label: 'Aging Status' },
      { key: 'aging_status', label: 'Aging Status' },
      { key: 'Aging Status', label: 'Aging Status' },
      
      // Financial
      { key: 'total', label: 'Total', required: true },
      { key: 'Total', label: 'Total', required: true },
      { key: 'accrual', label: 'Accrual' },
      { key: 'Accrual', label: 'Accrual' },
      { key: 'amountPaid', label: 'Paid' },
      { key: 'paid', label: 'Paid' },
      { key: 'Paid', label: 'Paid' },
      { key: 'amount_paid', label: 'Amount Paid' },
      { key: 'Amount Paid', label: 'Amount Paid' },
      { key: 'balance', label: 'Balance Due' },
      { key: 'balance_due', label: 'Balance Due' },
      { key: 'Balance Due', label: 'Balance Due' },
      { key: 'Balance', label: 'Balance' },
      { key: 'subtotal', label: 'Subtotal' },
      { key: 'Subtotal', label: 'Subtotal' },
      { key: 'tax', label: 'Tax' },
      { key: 'Tax', label: 'Tax' },
      
      // Reconciliation
      { key: 'reconciliationStatus', label: 'Reconciliation Status' },
      { key: 'reconciliation_status', label: 'Reconciliation Status' },
      { key: 'Reconciliation Status', label: 'Reconciliation Status' },
      { key: 'reconciliation', label: 'Reconciliation' },
      { key: 'Reconciliation', label: 'Reconciliation' },
      
      // Notes
      { key: 'invoiceNote', label: 'Invoice Note' },
      { key: 'invoice_note', label: 'Invoice Note' },
      { key: 'Invoice Note', label: 'Invoice Note' },
      { key: 'paymentNote', label: 'Payment Note' },
      { key: 'payment_note', label: 'Payment Note' },
      { key: 'Payment Note', label: 'Payment Note' },
      { key: 'notes', label: 'Notes' },
      { key: 'Notes', label: 'Notes' },
      
      // Payment Method
      { key: 'paymentMethod', label: 'Payment Method' },
      { key: 'payment_method', label: 'Payment Method' },
      { key: 'Payment Method', label: 'Payment Method' },
      
      // Factoring
      { key: 'factoringStatus', label: 'Factoring Status' },
      { key: 'factoring_status', label: 'Factoring Status' },
      { key: 'Factoring Status', label: 'Factoring Status' },
    ];
  }
  
  // Add more entity types as needed
  return [];
}


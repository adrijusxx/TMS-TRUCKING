'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Upload, FileText, Download, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery } from '@tanstack/react-query';
import { excelFileToJSON, ExcelImportResult } from '@/lib/import-export/excel-import';
import { csvFileToJSON, CSVImportResult } from '@/lib/import-export/csv-import';
import { apiUrl } from '@/lib/utils';
import ColumnMappingDialog from './ColumnMappingDialog';
import { useSession } from 'next-auth/react';
import { deduplicateSystemFields } from '@/lib/import-export/field-utils';

interface ImportPageProps {
  entityType: string;
  entityLabel: string;
  systemFields: Array<{ key: string; label: string; required?: boolean }>;
  backUrl?: string; // Optional if onBack provided
  exampleFileUrl?: string;
  onComplete?: () => void;
  onBack?: () => void;
  hideHeader?: boolean;
}

type ImportStep = 'upload' | 'matching' | 'preview';

export default function ImportPage({
  entityType,
  entityLabel,
  systemFields,
  backUrl,
  exampleFileUrl,
  onComplete,
  onBack,
  hideHeader = false,
}: ImportPageProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');

  // Deduplicate system fields to prevent duplicate options
  const deduplicatedFields = deduplicateSystemFields(systemFields);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<CSVImportResult | ExcelImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [selectedMcNumberId, setSelectedMcNumberId] = useState<string>('');
  const [updateExisting, setUpdateExisting] = useState<boolean>(false);
  const [showColumnMapping, setShowColumnMapping] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [importProgress, setImportProgress] = useState<number>(0);
  const [importStatus, setImportStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [errorLog, setErrorLog] = useState<Array<{ row: number; field?: string; error: string }>>([]);
  const [successCount, setSuccessCount] = useState(0);

  // Fetch MC numbers for selection
  const { data: mcNumbersData } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const response = await fetch(apiUrl('/api/companies'));
      if (!response.ok) throw new Error('Failed to fetch MC numbers');
      return response.json();
    },
    enabled: !!session,
  });

  const mcNumbers = mcNumbersData?.data?.companies?.filter((c: any) => c.isMcNumber) || [];

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Please select a CSV or Excel file');
      return;
    }

    setSelectedFile(file);
    setImportResult(null);
    setPreviewData([]);

    try {
      setIsProcessing(true);
      let result: CSVImportResult | ExcelImportResult;

      if (file.name.endsWith('.csv')) {
        result = await csvFileToJSON(file);
      } else {
        result = await excelFileToJSON(file);
      }

      setImportResult(result);

      if (result.success && result.data && result.data.length > 0) {
        // Auto-map columns
        const autoMapping: Record<string, string> = {};
        const excelColumns = Object.keys(result.data[0] || {});

        excelColumns.forEach((excelCol) => {
          const normalizedExcel = excelCol.toLowerCase().trim().replace(/[_\s-]/g, '');
          for (const field of deduplicatedFields) {
            const normalizedField = field.key.toLowerCase().replace(/[_\s-]/g, '');
            if (
              normalizedExcel === normalizedField ||
              normalizedExcel.includes(normalizedField) ||
              normalizedField.includes(normalizedExcel)
            ) {
              autoMapping[excelCol] = field.key;
              break;
            }
          }
        });

        setColumnMapping(autoMapping);
        setCurrentStep('matching');
      } else {
        toast.error(`Found ${result.errors?.length || 0} validation errors`);
      }
    } catch (error: any) {
      toast.error('Failed to parse file: ' + error.message);
      setImportResult(null);
    } finally {
      setIsProcessing(false);
    }
  }, [deduplicatedFields]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleColumnMappingComplete = (mapping: Record<string, string>) => {
    setColumnMapping(mapping);
    setShowColumnMapping(false);
  };

  const handleNextToPreview = () => {
    if (!importResult || !selectedFile) return;

    // Validate MC number is selected
    if (!selectedMcNumberId) {
      toast.error('Please select an MC number');
      return;
    }

    // Map the data using column mapping
    const mappedData = importResult.data.map((row: any) => {
      const mapped: any = {};
      Object.entries(columnMapping).forEach(([excelCol, systemField]) => {
        if (systemField && row[excelCol] !== undefined) {
          mapped[systemField] = row[excelCol];
        }
      });
      return mapped;
    });

    setPreviewData(mappedData.slice(0, 10)); // Show first 10 rows for preview
    setCurrentStep('preview');
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || !importResult) {
        throw new Error('No file or import data available');
      }

      // Get MC number value from selected ID
      const selectedMc = mcNumbers.find((mc: any) => mc.mcNumberId === selectedMcNumberId);
      if (!selectedMc) {
        throw new Error('Selected MC number not found');
      }

      // Normalize MC number: trim whitespace
      // IMPORTANT: We need the MC NUMBER value (e.g., "160847"), not the company name
      // The companies API should return mcNumber field with the numeric value
      // But check both mcNumber and number fields to be safe
      let mcNumberValue = '';
      if (selectedMc.mcNumber) {
        mcNumberValue = selectedMc.mcNumber.toString().trim();
      } else if (selectedMc.number) {
        mcNumberValue = selectedMc.number.toString().trim();
      }

      // Validate that we got a numeric MC number, not a company name
      if (!mcNumberValue || mcNumberValue.length > 10 || isNaN(Number(mcNumberValue))) {
        console.error('[ImportPage] Invalid MC number value:', {
          selectedMcNumberId,
          selectedMc,
          mcNumberValue,
          availableFields: Object.keys(selectedMc),
        });
        throw new Error(`Invalid MC number value: ${mcNumberValue}. Expected a numeric MC number, not a company name.`);
      }

      // Debug: Log what we're sending
      console.log('[ImportPage] MC selection:', {
        selectedMcNumberId,
        selectedMc,
        mcNumberValue,
        availableFields: Object.keys(selectedMc),
      });

      // Reset progress
      setImportProgress(0);
      setImportStatus('Preparing import...');
      setErrorLog([]);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('columnMapping', JSON.stringify(columnMapping));
      formData.append('mcNumber', mcNumberValue);
      formData.append('updateExisting', updateExisting.toString());
      if (entityType === 'drivers' && updateExisting) {
        formData.append('importMode', 'upsert');
      }

      const totalRows = importResult.data?.length || 0;
      let processedRows = 0;

      // Simulate progress updates (since we can't stream from API)
      const progressInterval = setInterval(() => {
        // Estimate progress based on time elapsed (rough estimate)
        // This is a simple approximation - actual progress will be shown on completion
        processedRows = Math.min(processedRows + Math.max(1, Math.floor(totalRows / 50)), totalRows);
        const estimatedProgress = Math.min(95, Math.round((processedRows / totalRows) * 100));
        setImportProgress(estimatedProgress);

        if (estimatedProgress < 30) {
          setImportStatus('Reading file data...');
        } else if (estimatedProgress < 60) {
          setImportStatus('Processing rows...');
        } else if (estimatedProgress < 90) {
          setImportStatus('Creating records...');
        } else {
          setImportStatus('Finalizing import...');
        }
      }, 200);

      try {
        const response = await fetch(apiUrl(`/api/import-export/${entityType}`), {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);
        setImportProgress(100);
        setImportStatus('Import completed!');

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || 'Import failed');
        }

        return response.json();
      } catch (error) {
        clearInterval(progressInterval);
        setImportProgress(0);
        setImportStatus('');
        throw error;
      }
    },
    onSuccess: (data: any) => {
      // The API returns the result in data.data
      const importResult = data?.data || data;

      // Get counts from summary
      const createdCount = importResult?.created ?? 0;

      // Get detailed arrays from the 'details' object if it exists
      const detailedErrors = importResult?.details?.errors || [];
      const detailedCreated = importResult?.details?.created || [];

      setSuccessCount(createdCount || detailedCreated.length);

      if (detailedErrors.length > 0) {
        setErrorLog(detailedErrors);
        toast.warning(`${detailedErrors.length} rows were skipped due to errors.`);
        setImportStatus('Completed with errors');
        return;
      }

      const finalSuccessCount = createdCount || detailedCreated.length;
      toast.success(`Successfully imported ${finalSuccessCount} ${entityLabel.toLowerCase()}`);

      // Only redirect if NO errors
      setTimeout(() => {
        if (onComplete) {
          onComplete();
        } else if (backUrl) {
          router.push(backUrl);
        }
      }, 2000);
    },
    onError: (error: Error) => {
      setImportProgress(0);
      setImportStatus('');
      toast.error(error.message || 'Import failed');
    },
  });

  const handleImport = () => {
    if (!selectedMcNumberId) {
      toast.error('Please select an MC number');
      return;
    }
    importMutation.mutate();
  };

  const handleReset = () => {
    setSelectedFile(null);
    setImportResult(null);
    setColumnMapping({});
    setPreviewData([]);
    setCurrentStep('upload');
    setSelectedMcNumberId('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const excelColumns = importResult?.data && importResult.data.length > 0
    ? Object.keys(importResult.data[0])
    : [];

  const mappedFields = new Set(Object.values(columnMapping));
  const requiredFields = deduplicatedFields.filter((f) => f.required);
  const unmappedRequired = requiredFields.filter((f) => !mappedFields.has(f.key));

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      {!hideHeader && (
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => {
              if (onBack) onBack();
              else if (backUrl) router.push(backUrl);
            }}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      )}

      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            {/* Step 1: Upload */}
            <div className="flex items-center gap-3 flex-1">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${currentStep === 'upload'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : currentStep === 'matching' || currentStep === 'preview'
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-muted border-muted-foreground/20'
                  }`}
              >
                {currentStep === 'upload' ? (
                  '1'
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1">
                <div className={`font-semibold ${currentStep === 'upload' ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Upload file
                </div>
                <div className="text-sm text-muted-foreground">Upload your csv file</div>
              </div>
            </div>

            {/* Connector */}
            <div className={`h-0.5 flex-1 ${currentStep === 'matching' || currentStep === 'preview' ? 'bg-green-500' : 'bg-muted'}`} />

            {/* Step 2: Matching */}
            <div className="flex items-center gap-3 flex-1">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${currentStep === 'matching'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : currentStep === 'preview'
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-muted border-muted-foreground/20'
                  }`}
              >
                {currentStep === 'preview' ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  '2'
                )}
              </div>
              <div className="flex-1">
                <div className={`font-semibold ${currentStep === 'matching' ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Matching columns
                </div>
                <div className="text-sm text-muted-foreground">Select MC number and matching columns</div>
              </div>
            </div>

            {/* Connector */}
            <div className={`h-0.5 flex-1 ${currentStep === 'preview' ? 'bg-green-500' : 'bg-muted'}`} />

            {/* Step 3: Preview */}
            <div className="flex items-center gap-3 flex-1">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${currentStep === 'preview'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted border-muted-foreground/20'
                  }`}
              >
                3
              </div>
              <div className="flex-1">
                <div className={`font-semibold ${currentStep === 'preview' ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Preview
                </div>
                <div className="text-sm text-muted-foreground">Preview data</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-card border rounded-lg p-6">
        {/* Step 1: Upload File */}
        {currentStep === 'upload' && (
          <div>
            <div
              ref={dropZoneRef}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-primary rounded-lg p-12 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">Upload your file</p>
              <p className="text-sm text-muted-foreground mb-4">
                Select your sheet in .xlsx, .xls or .csv format or drag & drop
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileInputChange}
                className="hidden"
              />
              {exampleFileUrl && (
                <a
                  href={exampleFileUrl}
                  download
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Download className="h-4 w-4" />
                  Download example file
                </a>
              )}
            </div>

            {isProcessing && (
              <div className="mt-4">
                <Progress value={50} className="mb-2" />
                <p className="text-sm text-muted-foreground text-center">Processing file...</p>
              </div>
            )}

            {selectedFile && !isProcessing && (
              <div className="mt-4 p-4 bg-muted rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <span className="font-medium">{selectedFile.name}</span>
                  <span className="text-sm text-muted-foreground">
                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Matching Columns */}
        {currentStep === 'matching' && importResult && (
          <div className="space-y-6">
            <div>
              <Label htmlFor="mc-number" className="text-base font-semibold mb-2 block">
                Select MC Number *
              </Label>
              <Select value={selectedMcNumberId} onValueChange={setSelectedMcNumberId}>
                <SelectTrigger id="mc-number" className="w-full">
                  <SelectValue placeholder="Select an MC number" />
                </SelectTrigger>
                <SelectContent>
                  {mcNumbers.map((mc: any) => (
                    <SelectItem key={mc.mcNumberId} value={mc.mcNumberId}>
                      {mc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-start space-x-2 pt-2">
              <Checkbox
                id="update-existing"
                checked={updateExisting}
                onCheckedChange={(checked) => setUpdateExisting(checked === true)}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="update-existing"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Update existing records
                </label>
                <p className="text-xs text-muted-foreground">
                  If checked, existing records with matching IDs/emails will be updated instead of skipped.
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <Label className="text-base font-semibold">Column Mapping</Label>
                <Button
                  variant="outline"
                  onClick={() => setShowColumnMapping(true)}
                >
                  {Object.keys(columnMapping).length > 0
                    ? `${Object.keys(columnMapping).length} Mapped`
                    : 'Map Columns'}
                </Button>
              </div>

              {unmappedRequired.length > 0 && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mb-4">
                  <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {unmappedRequired.length} required field(s) need mapping: {unmappedRequired.map(f => f.label).join(', ')}
                    </span>
                  </div>
                </div>
              )}

              {Object.keys(columnMapping).length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground mb-2">Mapped columns:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(columnMapping).slice(0, 10).map(([excelCol, systemField]) => {
                      const field = deduplicatedFields.find(f => f.key === systemField);
                      return (
                        <div
                          key={excelCol}
                          className="text-xs bg-primary/10 text-primary px-2 py-1 rounded flex items-center gap-1"
                        >
                          <span className="font-medium">{excelCol}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-medium">{field?.label || systemField}</span>
                        </div>
                      );
                    })}
                    {Object.keys(columnMapping).length > 10 && (
                      <span className="text-xs text-muted-foreground">
                        +{Object.keys(columnMapping).length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCurrentStep('upload')}>
                Back
              </Button>
              <Button
                onClick={handleNextToPreview}
                disabled={!selectedMcNumberId || unmappedRequired.length > 0}
              >
                Next step
              </Button>
            </div>

            <ColumnMappingDialog
              open={showColumnMapping}
              onOpenChange={setShowColumnMapping}
              excelColumns={excelColumns}
              systemFields={deduplicatedFields}
              initialMapping={columnMapping}
              onMappingComplete={handleColumnMappingComplete}
            />
          </div>
        )}

        {/* Step 3: Preview */}
        {currentStep === 'preview' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Preview Data</h2>
              <div className="space-x-2">
                {errorLog.length > 0 ? (
                  <Button onClick={() => {
                    if (onComplete) onComplete();
                    else if (backUrl) router.push(backUrl);
                  }}>
                    Continue Anyway
                  </Button>
                ) : (
                  <Button onClick={handleImport} disabled={importMutation.isPending || importMutation.isSuccess}>
                    {importMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      'Run Import'
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* IMPORT STATUS / PROGRESS */}
            {(importMutation.isPending || importStatus) && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{importStatus}</span>
                  <span>{importProgress}%</span>
                </div>
                <Progress value={importProgress} className="h-2" />
              </div>
            )}

            {/* ERROR LOG / RESULTS SUMMARY */}
            {errorLog.length > 0 ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-green-50 border-green-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-green-700 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        Success
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-800">{successCount}</div>
                      <p className="text-xs text-green-600">Records created successfully</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-red-50 border-red-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-red-700 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Failed
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-800">{errorLog.length}</div>
                      <p className="text-xs text-red-600">Rows skipped due to errors</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="text-red-800 text-lg">Error Log</CardTitle>
                    <CardDescription>The following rows could not be imported. Please fix the file and re-import these rows.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-[300px] overflow-y-auto border rounded-md">
                      <table className="w-full text-sm">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            <th className="p-2 text-left w-[80px]">Row #</th>
                            <th className="p-2 text-left">Error Message</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {errorLog.map((err, idx) => (
                            <tr key={idx} className="hover:bg-muted/50">
                              <td className="p-2 font-mono text-xs text-muted-foreground">{err.row}</td>
                              <td className="p-2 text-red-600 font-medium">{err.error}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              !importStatus.includes('Completed') && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    <span>Mapped Columns: {Object.keys(columnMapping).length}</span>
                    <span>Total Rows: {importResult?.data?.length || 0}</span>
                  </div>

                  <div className="border rounded-lg overflow-hidden overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-muted">
                        <tr>
                          {Object.entries(columnMapping).filter(([_, target]) => target).map(([src, target]) => (
                            <th key={src} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              {systemFields.find(f => f.key === target)?.label || target}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                        {previewData.map((row, i) => (
                          <tr key={i}>
                            {Object.entries(columnMapping).filter(([_, target]) => target).map(([src, target]) => (
                              <td key={`${i}-${src}`} className="px-4 py-3 text-sm whitespace-nowrap">
                                {String(row[src] || row[String(src).trim().toLowerCase().replace(/\s+/g, '_')] || '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

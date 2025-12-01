'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, X, ArrowRight, ArrowLeft, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { csvFileToJSON } from '@/lib/import-export/csv-import';
import { excelFileToJSON } from '@/lib/import-export/excel-import';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ImportModalProps {
  /**
   * Whether the modal is open
   */
  open: boolean;
  /**
   * Handler for open state changes
   */
  onOpenChange: (open: boolean) => void;
  /**
   * Available database fields to map to
   */
  databaseFields: Array<{
    key: string;
    label: string;
    required?: boolean;
  }>;
  /**
   * Callback when import is confirmed
   * Receives mapped data ready for backend processing
   */
  onImport: (mappedData: Array<Record<string, any>>, columnMapping: Record<string, string>) => void;
  /**
   * Entity type (for display purposes)
   */
  entityType?: string;
}

type ImportStep = 'upload' | 'mapping' | 'review';

interface ParsedData {
  headers: string[];
  rows: Array<Record<string, any>>;
}

/**
 * Reusable Import Modal Component
 * Provides a 3-step wizard: File Upload → Column Mapping → Review & Import
 */
export function ImportModal({
  open,
  onOpenChange,
  databaseFields,
  onImport,
  entityType = 'data',
}: ImportModalProps) {
  const [currentStep, setCurrentStep] = React.useState<ImportStep>('upload');
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [parsedData, setParsedData] = React.useState<ParsedData | null>(null);
  const [columnMapping, setColumnMapping] = React.useState<Record<string, string>>({});
  const [mappedData, setMappedData] = React.useState<Array<Record<string, any>>>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Reset state when modal closes
  React.useEffect(() => {
    if (!open) {
      setCurrentStep('upload');
      setSelectedFile(null);
      setIsProcessing(false);
      setParsedData(null);
      setColumnMapping({});
      setMappedData([]);
      setIsDragging(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [open]);

  // Auto-map columns when parsed data is available
  React.useEffect(() => {
    if (parsedData && parsedData.headers.length > 0) {
      const autoMapping: Record<string, string> = {};
      
      parsedData.headers.forEach((header) => {
        // Try to find matching database field by key or label
        const normalizedHeader = header.toLowerCase().trim().replace(/\s+/g, '_');
        const match = databaseFields.find(
          (field) =>
            field.key.toLowerCase() === normalizedHeader ||
            field.label.toLowerCase() === header.toLowerCase() ||
            field.key.toLowerCase().includes(normalizedHeader) ||
            normalizedHeader.includes(field.key.toLowerCase())
        );
        
        if (match) {
          autoMapping[header] = match.key;
        }
      });
      
      setColumnMapping(autoMapping);
    }
  }, [parsedData, databaseFields]);

  // Generate mapped data when column mapping changes
  React.useEffect(() => {
    if (parsedData && Object.keys(columnMapping).length > 0) {
      const mapped: Array<Record<string, any>> = parsedData.rows.map((row) => {
        const mappedRow: Record<string, any> = {};
        Object.entries(columnMapping).forEach(([excelHeader, dbField]) => {
          if (dbField && excelHeader in row) {
            mappedRow[dbField] = row[excelHeader];
          }
        });
        return mappedRow;
      });
      setMappedData(mapped);
    }
  }, [parsedData, columnMapping]);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));

    if (!validExtensions.includes(fileExtension)) {
      toast.error('Please select a CSV or Excel file (.csv, .xlsx, .xls)');
      return;
    }

    setSelectedFile(file);
    setIsProcessing(true);

    try {
      let result;
      if (fileExtension === '.csv') {
        result = await csvFileToJSON(file);
      } else {
        result = await excelFileToJSON(file);
      }

      if (result.success && result.data && result.data.length > 0) {
        const headers = Object.keys(result.data[0]);
        const rows = result.data;

        setParsedData({ headers, rows });
        setCurrentStep('mapping');
        toast.success(`File parsed successfully. Found ${rows.length} row(s).`);
      } else {
        throw new Error(result.errors?.[0]?.errors?.[0] || 'Failed to parse file');
      }
    } catch (error: any) {
      console.error('File parsing error:', error);
      toast.error(error.message || 'Failed to parse file. Please check the file format.');
      setSelectedFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleMappingChange = (excelHeader: string, dbField: string) => {
    setColumnMapping((prev) => ({
      ...prev,
      [excelHeader]: dbField,
    }));
  };

  const handleNext = () => {
    if (currentStep === 'upload' && parsedData) {
      setCurrentStep('mapping');
    } else if (currentStep === 'mapping') {
      // Validate that required fields are mapped
      const requiredFields = databaseFields.filter((f) => f.required);
      const unmappedRequired = requiredFields.filter(
        (field) => !Object.values(columnMapping).includes(field.key)
      );

      if (unmappedRequired.length > 0) {
        toast.error(
          `Please map all required fields: ${unmappedRequired.map((f) => f.label).join(', ')}`
        );
        return;
      }

      setCurrentStep('review');
    }
  };

  const handleBack = () => {
    if (currentStep === 'review') {
      setCurrentStep('mapping');
    } else if (currentStep === 'mapping') {
      setCurrentStep('upload');
    }
  };

  const handleImport = () => {
    if (mappedData.length === 0) {
      toast.error('No data to import');
      return;
    }

    onImport(mappedData, columnMapping);
    onOpenChange(false);
  };

  const unmappedHeaders = parsedData
    ? parsedData.headers.filter((h) => !columnMapping[h] || columnMapping[h] === '')
    : [];

  const requiredFields = databaseFields.filter((f) => f.required);
  const unmappedRequired = requiredFields.filter(
    (field) => !Object.values(columnMapping).includes(field.key)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Import {entityType.charAt(0).toUpperCase() + entityType.slice(1)}</DialogTitle>
          <DialogDescription>
            Follow the steps to import your data from a CSV or Excel file.
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {(['upload', 'mapping', 'review'] as ImportStep[]).map((step, index) => {
            const stepNumber = index + 1;
            const stepLabels = {
              upload: 'Upload File',
              mapping: 'Map Columns',
              review: 'Review & Import',
            };

            const isActive = currentStep === step;
            const isCompleted = 
              (step === 'upload' && parsedData !== null) ||
              (step === 'mapping' && currentStep === 'review') ||
              (step === 'review' && false);

            return (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : stepNumber}
                  </div>
                  <span className={`text-sm mt-2 ${isActive ? 'font-medium' : 'text-muted-foreground'}`}>
                    {stepLabels[step]}
                  </span>
                </div>
                {index < 2 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 mt-[-20px] ${
                      isCompleted ? 'bg-green-500' : 'bg-muted'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto pr-2">
          {/* Step 1: File Upload */}
          {currentStep === 'upload' && (
            <div className="space-y-4">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:bg-muted/50'
                }`}
              >
                <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                <p className="text-lg font-medium mb-2">
                  {selectedFile ? selectedFile.name : 'Upload your file'}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Select your file in .xlsx, .xls or .csv format or drag & drop it here
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileInputChange}
                  className="hidden"
                  disabled={isProcessing}
                />
                {selectedFile && (
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{selectedFile.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {isProcessing && (
                <div className="space-y-2">
                  <Progress value={50} className="w-full" />
                  <p className="text-sm text-muted-foreground text-center">Processing file...</p>
                </div>
              )}

              {parsedData && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900">File processed successfully!</p>
                    <p className="text-sm text-green-700 mt-1">
                      Found {parsedData.rows.length} row(s) with {parsedData.headers.length} column(s)
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Column Mapping */}
          {currentStep === 'mapping' && parsedData && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">Map your Excel columns to database fields</p>
                  <p>Match each column from your file (left) to the corresponding database field (right).</p>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-2 divide-x">
                  <div className="bg-muted/50 p-3 font-medium text-sm">Excel Headers</div>
                  <div className="bg-muted/50 p-3 font-medium text-sm">Database Fields</div>
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                  {parsedData.headers.map((header, index) => (
                    <div key={header} className="grid grid-cols-2 divide-x border-t">
                      <div className="p-3 flex items-center">
                        <span className="text-sm">{header}</span>
                      </div>
                      <div className="p-3">
                        <Select
                          value={columnMapping[header] || ''}
                          onValueChange={(value) => handleMappingChange(header, value)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select field..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">-- Skip Column --</SelectItem>
                            {databaseFields.map((field) => (
                              <SelectItem key={field.key} value={field.key}>
                                {field.label}
                                {field.required && <span className="text-destructive ml-1">*</span>}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {unmappedRequired.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-900">Required fields not mapped:</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      {unmappedRequired.map((f) => f.label).join(', ')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Review & Import */}
          {currentStep === 'review' && mappedData.length > 0 && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="font-medium text-green-900">
                  Ready to import {mappedData.length} row(s)
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Review a preview of your data below before importing.
                </p>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-[400px]">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        {Object.keys(mappedData[0]).map((key) => {
                          const field = databaseFields.find((f) => f.key === key);
                          return (
                            <th key={key} className="px-3 py-2 text-left font-medium">
                              {field?.label || key}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {mappedData.slice(0, 10).map((row, index) => (
                        <tr key={index} className="border-t">
                          {Object.entries(row).map(([key, value]) => (
                            <td key={key} className="px-3 py-2">
                              {value !== null && value !== undefined ? String(value) : ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {mappedData.length > 10 && (
                  <div className="bg-muted/50 px-3 py-2 text-sm text-muted-foreground border-t">
                    Showing first 10 of {mappedData.length} rows...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between pt-4 border-t">
          <div>
            {currentStep !== 'upload' && (
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {currentStep === 'upload' && parsedData && (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            {currentStep === 'mapping' && (
              <Button
                onClick={handleNext}
                disabled={unmappedRequired.length > 0}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            {currentStep === 'review' && (
              <Button onClick={handleImport}>
                Import {mappedData.length} Row(s)
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


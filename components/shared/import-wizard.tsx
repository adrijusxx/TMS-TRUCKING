'use client';

import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, ArrowRight, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { importBulkData } from '@/lib/actions/import-data';

type ImportStage = 'upload' | 'headers' | 'mapping' | 'review' | 'submit';

interface ImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: string;
  requiredFields: string[];
  onComplete?: () => void;
}

interface FileHeaders {
  [key: string]: string; // file header -> mapped field
}

export function ImportWizard({
  open,
  onOpenChange,
  entityType,
  requiredFields,
  onComplete,
}: ImportWizardProps) {
  const [stage, setStage] = useState<ImportStage>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<FileHeaders>({});
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [fullData, setFullData] = useState<any[]>([]); // Store full parsed data
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Stage 1: Upload - Parse file and extract headers
  const handleFileUpload = useCallback(async (uploadedFile: File) => {
    try {
      setFile(uploadedFile);
      setUploadProgress(10);

      let headers: string[] = [];
      let data: any[] = [];

      if (uploadedFile.name.endsWith('.csv')) {
        // Parse CSV
        Papa.parse(uploadedFile, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.data && results.data.length > 0) {
              headers = Object.keys(results.data[0] as any);
              data = results.data as any[];
              setFileHeaders(headers);
              setFullData(data); // Store full data
              setPreviewData(data.slice(0, 10)); // Preview first 10 rows
              setUploadProgress(100);
              setStage('headers');
            }
          },
          error: (error) => {
            toast.error(`CSV parsing error: ${error.message}`);
            setFile(null);
          },
        });
      } else if (uploadedFile.name.endsWith('.xlsx') || uploadedFile.name.endsWith('.xls')) {
        // Parse Excel
        const arrayBuffer = await uploadedFile.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length > 0) {
          headers = (jsonData[0] as string[]).filter((h) => h);
          const rows = jsonData.slice(1) as any[][];
          
          // Convert rows to objects
          data = rows
            .filter((row) => row.some((cell) => cell !== null && cell !== undefined && cell !== ''))
            .map((row) => {
              const obj: any = {};
              headers.forEach((header, index) => {
                obj[header] = row[index] ?? '';
              });
              return obj;
            });

          setFileHeaders(headers);
          setFullData(data); // Store full data
          setPreviewData(data.slice(0, 10));
          setUploadProgress(100);
          setStage('headers');
        }
      } else {
        toast.error('Unsupported file format. Please upload CSV or Excel files.');
        setFile(null);
        return;
      }
    } catch (error: any) {
      toast.error(`Failed to parse file: ${error.message}`);
      setFile(null);
    }
  }, []);

  // Stage 2: Headers detected - Auto-advance to mapping
  const handleHeadersDetected = useCallback(() => {
    setStage('mapping');
  }, []);

  // Stage 3: Mapping - User maps file headers to DB fields
  const handleMappingChange = useCallback((fileHeader: string, dbField: string) => {
    setMapping((prev) => ({
      ...prev,
      [fileHeader]: dbField,
    }));
  }, []);

  const handleNextFromMapping = useCallback(() => {
    // Check if all required fields are mapped
    const mappedFields = Object.values(mapping);
    const missingRequired = requiredFields.filter((field) => !mappedFields.includes(field));

    if (missingRequired.length > 0) {
      toast.error(`Please map all required fields: ${missingRequired.join(', ')}`);
      return;
    }

    setStage('review');
  }, [mapping, requiredFields]);

  // Stage 4: Review - Show preview of mapped data
  const handleNextFromReview = useCallback(() => {
    setStage('submit');
  }, []);

  // Stage 5: Submit - Send to server
  const handleSubmit = useCallback(async () => {
    if (!fullData.length) {
      toast.error('No data to import');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      // Apply mapping to full data
      const mappedData = fullData
        .filter((row) => Object.values(row).some((val) => val !== null && val !== undefined && val !== ''))
        .map((row) => {
          const mapped: any = {};
          Object.entries(mapping).forEach(([fileHeader, dbField]) => {
            mapped[dbField] = row[fileHeader] ?? null;
          });
          return mapped;
        });

      setUploadProgress(50);

      // Call server action
      const result = await importBulkData(entityType, mappedData);
      setUploadProgress(100);

      if (result.success) {
        toast.success(`Successfully imported ${result.created || mappedData.length} record(s)`);
        if (onComplete) {
          onComplete();
        }
        // Reset state
        setStage('upload');
        setFile(null);
        setFileHeaders([]);
        setMapping({});
        setPreviewData([]);
        setFullData([]);
        setUploadProgress(0);
        onOpenChange(false);
      } else {
        toast.error(result.error || 'Import failed');
      }
    } catch (error: any) {
      toast.error(`Import error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  }, [fullData, mapping, entityType, onComplete, onOpenChange]);

  const handleReset = useCallback(() => {
    setStage('upload');
    setFile(null);
    setFileHeaders([]);
    setMapping({});
    setPreviewData([]);
    setFullData([]);
    setUploadProgress(0);
  }, []);

  const handleClose = useCallback(() => {
    if (isSubmitting) {
      toast.warning('Please wait for import to complete');
      return;
    }
    handleReset();
    onOpenChange(false);
  }, [isSubmitting, handleReset, onOpenChange]);

  // Generate preview data with mapping applied
  const mappedPreviewData = previewData.map((row) => {
    const mapped: any = {};
    Object.entries(mapping).forEach(([fileHeader, dbField]) => {
      mapped[dbField] = row[fileHeader] ?? '';
    });
    return mapped;
  });

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import {entityType}</DialogTitle>
          <DialogDescription>
            Import data from CSV or Excel file. Map your columns to database fields.
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className={stage === 'upload' ? 'font-semibold' : ''}>1. Upload</span>
            <ArrowRight className="h-4 w-4" />
            <span className={stage === 'headers' ? 'font-semibold' : ''}>2. Headers</span>
            <ArrowRight className="h-4 w-4" />
            <span className={stage === 'mapping' ? 'font-semibold' : ''}>3. Mapping</span>
            <ArrowRight className="h-4 w-4" />
            <span className={stage === 'review' ? 'font-semibold' : ''}>4. Review</span>
            <ArrowRight className="h-4 w-4" />
            <span className={stage === 'submit' ? 'font-semibold' : ''}>5. Submit</span>
          </div>
          <Progress value={(['upload', 'headers', 'mapping', 'review', 'submit'].indexOf(stage) + 1) * 20} />
        </div>

        {/* Stage 1: Upload */}
        {stage === 'upload' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-lg font-semibold">Drag & drop your file here</span>
                <br />
                <span className="text-sm text-muted-foreground">or click to browse</span>
              </Label>
              <input
                id="file-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const uploadedFile = e.target.files?.[0];
                  if (uploadedFile) {
                    handleFileUpload(uploadedFile);
                  }
                }}
              />
            </div>
            {file && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <FileText className="h-5 w-5" />
                <span className="flex-1">{file.name}</span>
                <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Stage 2: Headers Detected */}
        {stage === 'headers' && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Headers Detected</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Found {fileHeaders.length} column(s) in your file. Ready to map to database fields.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleHeadersDetected}>Continue to Mapping</Button>
              <Button variant="outline" onClick={() => setStage('upload')}>
                Back
              </Button>
            </div>
          </div>
        )}

        {/* Stage 3: Mapping */}
        {stage === 'mapping' && (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-4">Map File Columns to Database Fields</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {requiredFields.map((dbField) => {
                  const currentMapping = Object.entries(mapping).find(([, field]) => field === dbField);
                  const fileHeader = currentMapping ? currentMapping[0] : '';

                  return (
                    <div key={dbField} className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label className="text-sm font-medium">
                          {dbField} <span className="text-red-500">*</span>
                        </Label>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <Select
                          value={fileHeader}
                          onValueChange={(value) => handleMappingChange(value, dbField)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select file column" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">-- None --</SelectItem>
                            {fileHeaders.map((header) => (
                              <SelectItem key={header} value={header}>
                                {header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleNextFromMapping} disabled={Object.keys(mapping).length === 0}>
                Continue to Review
              </Button>
              <Button variant="outline" onClick={() => setStage('headers')}>
                Back
              </Button>
            </div>
          </div>
        )}

        {/* Stage 4: Review */}
        {stage === 'review' && (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-4">Preview Mapped Data</h3>
              <div className="max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {requiredFields.map((field) => (
                        <TableHead key={field} className="text-xs">
                          {field}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mappedPreviewData.slice(0, 5).map((row, index) => (
                      <TableRow key={index}>
                        {requiredFields.map((field) => (
                          <TableCell key={field} className="text-xs">
                            {String(row[field] ?? '')}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Showing first 5 rows of {previewData.length} total rows
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleNextFromReview}>Continue to Submit</Button>
              <Button variant="outline" onClick={() => setStage('mapping')}>
                Back
              </Button>
            </div>
          </div>
        )}

        {/* Stage 5: Submit */}
        {stage === 'submit' && (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-4">Ready to Import</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>File:</strong> {file?.name}
                </p>
                <p>
                  <strong>Records:</strong> {fullData.length}
                </p>
                <p>
                  <strong>Mapped Fields:</strong> {Object.keys(mapping).length}
                </p>
              </div>
            </div>
            {isSubmitting && (
              <div className="space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-sm text-muted-foreground text-center">
                  Importing data... Please wait.
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  'Import Data'
                )}
              </Button>
              <Button variant="outline" onClick={() => setStage('review')} disabled={isSubmitting}>
                Back
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


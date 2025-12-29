'use client';

import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { CreateLoadInput } from '@/lib/validations/load';
import { apiUrl } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface AILoadImporterProps {
  onDataExtracted: (data: Partial<CreateLoadInput>, pdfFile?: File) => void;
  onClose?: () => void;
}

interface ExtractedData {
  [key: string]: any;
  customerId?: string;
  customerMatched?: boolean;
  customerCreated?: boolean;
  extractedFields?: number;
}

async function importPDF(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(apiUrl('/api/loads/import-pdf'), {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to import PDF');
  }

  return response.json();
}

export default function AILoadImporter({ onDataExtracted, onClose }: AILoadImporterProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [importStatus, setImportStatus] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      setProgress(0);
      setImportStatus('Uploading PDF...');
      
      let progressInterval: NodeJS.Timeout | null = null;
      
      try {
        // Phase 1: Upload preparation (0-10%)
        setProgress(5);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        setProgress(10);
        setImportStatus('Processing PDF with AI...');
        
        // Phase 2: Simulate slow, realistic progress during API call
        // Reserve 10-75% for the actual API processing (which can take 30+ seconds)
        let simulatedProgress = 10;
        progressInterval = setInterval(() => {
          setProgress((prev) => {
            // Only increment if we're below 75% (reserve last 25% for completion)
            if (prev >= 75) return prev;
            // Slow, gradual increment: 0.5-2% per second
            return Math.min(prev + Math.random() * 1.5 + 0.5, 75);
          });
        }, 1000); // Update every second instead of every 300ms
        
        setProgress(15);
        setImportStatus('Extracting text from PDF...');
        
        // Phase 3: Actual API call (this is where most time is spent)
        const result = await importPDF(file);
        
        // Clear the interval once API call completes
        if (progressInterval) {
          clearInterval(progressInterval);
          progressInterval = null;
        }
        
        // Phase 4: Final processing and completion (75-100%)
        setProgress(80);
        setImportStatus('Processing extracted data...');
        await new Promise(resolve => setTimeout(resolve, 200));
        
        setProgress(90);
        setImportStatus('Finalizing...');
        await new Promise(resolve => setTimeout(resolve, 200));
        
        setProgress(100);
        setImportStatus('Complete!');
        
        return result;
      } catch (error) {
        if (progressInterval) {
          clearInterval(progressInterval);
        }
        setProgress(0);
        throw error;
      }
    },
    onSuccess: (response) => {
      // Merge meta into data for easier access
      const dataWithMeta = {
        ...response.data,
        customerMatched: response.meta?.customerMatched,
        customerCreated: response.meta?.customerCreated,
        extractedFields: response.meta?.extractedFields,
      };
      setExtractedData(dataWithMeta);
      
      const customerMessage = response.meta?.customerMatched 
        ? ' and matched existing customer' 
        : response.meta?.customerCreated
          ? ' and created new customer' 
          : ' (customer not matched)';
      toast.success(
        `Successfully extracted ${response.meta?.extractedFields || 0} fields from PDF${customerMessage}`
      );
      setTimeout(() => {
        setImportStatus('');
        setProgress(0);
      }, 2000);
    },
    onError: (error: Error) => {
      setImportStatus('');
      setProgress(0);
      toast.error(error.message || 'Failed to import PDF');
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please select a PDF file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      setExtractedData(null);
    }
  };

  const handleImport = () => {
    if (!selectedFile) {
      toast.error('Please select a PDF file');
      return;
    }
    importMutation.mutate(selectedFile);
  };

  const handleUseData = () => {
    if (!extractedData) return;

    // Remove metadata fields before passing to form
    const { customerMatched, customerCreated, extractedFields, ...loadDataRaw } = extractedData;
    
    // Pass the selected PDF file to be attached after load creation

    // Convert extracted data to CreateLoadInput format
    const loadData: Partial<CreateLoadInput> = {
      ...loadDataRaw,
      // Ensure numeric fields are numbers
      weight: extractedData.weight ? Number(extractedData.weight) : undefined,
      pieces: extractedData.pieces ? Number(extractedData.pieces) : undefined,
      pallets: extractedData.pallets ? Number(extractedData.pallets) : undefined,
      revenue: extractedData.revenue ? Number(extractedData.revenue) : undefined,
      driverPay: extractedData.driverPay ? Number(extractedData.driverPay) : undefined,
      fuelAdvance: extractedData.fuelAdvance ? Number(extractedData.fuelAdvance) : 0,
      totalMiles: extractedData.totalMiles ? Number(extractedData.totalMiles) : undefined,
      hazmat: extractedData.hazmat === true || extractedData.hazmat === 'true',
      // Ensure dates are properly formatted (for single-stop loads)
      pickupDate: extractedData.pickupDate || undefined,
      deliveryDate: extractedData.deliveryDate || undefined,
      // Multi-stop support - stops array is already in the correct format
      stops: extractedData.stops && Array.isArray(extractedData.stops) 
        ? extractedData.stops.map((stop: any) => {
            // Process items - ensure they're objects, not strings
            let processedItems: any[] | undefined = undefined;
            if (stop.items) {
              if (Array.isArray(stop.items)) {
                processedItems = stop.items.map((item: any) => {
                  // If item is a string, convert to object
                  if (typeof item === 'string') {
                    return {
                      description: item,
                      item: item,
                    };
                  }
                  // If item is already an object, ensure it has required structure
                  return {
                    orderId: item.orderId,
                    item: item.item || item.product || item.description,
                    product: item.product,
                    pieces: item.pieces ? Number(item.pieces) : undefined,
                    weight: item.weight ? Number(item.weight) : undefined,
                    description: item.description || item.item || item.product,
                  };
                });
              } else if (typeof stop.items === 'string') {
                // If items is a string, try to parse it
                try {
                  const parsed = JSON.parse(stop.items);
                  if (Array.isArray(parsed)) {
                    processedItems = parsed.map((item: any) => 
                      typeof item === 'string' 
                        ? { description: item, item: item }
                        : item
                    );
                  }
                } catch {
                  // If parsing fails, treat as single item description
                  processedItems = [{ description: stop.items, item: stop.items }];
                }
              }
            }

            return {
              stopType: stop.stopType as 'PICKUP' | 'DELIVERY',
              sequence: Number(stop.sequence) || 1,
              company: stop.company,
              address: stop.address,
              city: stop.city,
              state: stop.state?.toUpperCase().slice(0, 2),
              zip: stop.zip,
              phone: stop.phone,
              earliestArrival: stop.earliestArrival,
              latestArrival: stop.latestArrival,
              contactName: stop.contactName,
              contactPhone: stop.contactPhone,
              items: processedItems,
              totalPieces: stop.totalPieces ? Number(stop.totalPieces) : undefined,
              totalWeight: stop.totalWeight ? Number(stop.totalWeight) : undefined,
              notes: stop.notes,
              specialInstructions: stop.specialInstructions,
            };
          })
        : undefined,
    };

    // Pass both the load data and the PDF file for attachment after load creation
    onDataExtracted(loadData, selectedFile || undefined);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setExtractedData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          AI Load Confirmation Import
        </CardTitle>
        <CardDescription>
          Upload a rate confirmation PDF and AI will automatically extract load information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pdf-file">Rate Confirmation PDF</Label>
          <div className="flex items-center gap-4">
            <Input
              id="pdf-file"
              type="file"
              accept="application/pdf"
              onChange={handleFileSelect}
              ref={fileInputRef}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={handleImport}
              disabled={!selectedFile || importMutation.isPending}
            >
              {importMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </>
              )}
            </Button>
          </div>
          {selectedFile && (
            <p className="text-sm text-muted-foreground">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        {/* Progress Bar */}
        {importMutation.isPending && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{importStatus || 'Processing...'}</span>
              <span className="text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {importMutation.isError && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-4 w-4" />
              <p className="text-sm font-medium">Import Failed</p>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {importMutation.error instanceof Error
                ? importMutation.error.message
                : 'An unknown error occurred'}
            </p>
          </div>
        )}

        {extractedData && (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-4 w-4" />
                <p className="text-sm font-medium">Data Extracted Successfully</p>
              </div>
              <p className="text-sm text-green-600 mt-1">
                Extracted {extractedData.extractedFields || 0} fields
                {extractedData.customerMatched 
                  ? ' • Customer matched' 
                  : extractedData.customerCreated 
                    ? ' • New customer created' 
                    : ' • Customer not matched'}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Extracted Data Preview</h4>
              <div className="p-3 bg-muted rounded-md max-h-60 overflow-y-auto">
                <div className="space-y-2">
                  {extractedData.stops && Array.isArray(extractedData.stops) && extractedData.stops.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">
                        Multi-Stop Load: {extractedData.stops.length} stops
                      </p>
                      <div className="space-y-1">
                        {extractedData.stops.map((stop: any, index: number) => (
                          <div key={index} className="text-xs p-2 bg-background rounded border">
                            <div className="font-semibold">
                              Stop {stop.sequence}: {stop.stopType} - {stop.company || stop.address}
                            </div>
                            <div className="text-muted-foreground">
                              {stop.city}, {stop.state} {stop.zip}
                            </div>
                            {stop.totalPieces && (
                              <div className="text-muted-foreground">
                                {stop.totalPieces} pieces, {stop.totalWeight} lbs
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      Single-stop load
                    </div>
                  )}
                  <details className="text-xs">
                    <summary className="cursor-pointer font-medium">View Full JSON</summary>
                    <pre className="mt-2 whitespace-pre-wrap text-xs">
                      {JSON.stringify(extractedData, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleUseData} className="flex-1">
                Use This Data
              </Button>
              <Button onClick={handleReset} variant="outline">
                Reset
              </Button>
              {onClose && (
                <Button onClick={onClose} variant="outline">
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


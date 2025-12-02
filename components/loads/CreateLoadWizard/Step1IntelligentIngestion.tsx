'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import type { CreateLoadInput } from '@/lib/validations/load';
import { apiUrl, cn } from '@/lib/utils';
import { useMutation } from '@tanstack/react-query';

interface Step1IntelligentIngestionProps {
  onDataExtracted: (data: Partial<CreateLoadInput>, pdfFile?: File) => void;
  onSkipToManual: () => void;
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

export default function Step1IntelligentIngestion({
  onDataExtracted,
  onSkipToManual,
}: Step1IntelligentIngestionProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [importStatus, setImportStatus] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      setProgress(0);
      setImportStatus('Uploading PDF...');
      
      let progressInterval: NodeJS.Timeout | null = null;
      
      try {
        setProgress(5);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        setProgress(10);
        setImportStatus('Processing PDF with AI...');
        
        let simulatedProgress = 10;
        progressInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 75) return prev;
            return Math.min(prev + Math.random() * 1.5 + 0.5, 75);
          });
        }, 1000);
        
        setProgress(15);
        setImportStatus('Extracting text from PDF...');
        
        const result = await importPDF(file);
        
        if (progressInterval) {
          clearInterval(progressInterval);
          progressInterval = null;
        }
        
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

  const handleFileSelect = (file: File) => {
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
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
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

    const { customerMatched, customerCreated, extractedFields, ...loadDataRaw } = extractedData;
    
    const loadData: Partial<CreateLoadInput> = {
      ...loadDataRaw,
      weight: extractedData.weight ? Number(extractedData.weight) : undefined,
      pieces: extractedData.pieces ? Number(extractedData.pieces) : undefined,
      pallets: extractedData.pallets ? Number(extractedData.pallets) : undefined,
      revenue: extractedData.revenue ? Number(extractedData.revenue) : undefined,
      driverPay: extractedData.driverPay ? Number(extractedData.driverPay) : undefined,
      fuelAdvance: extractedData.fuelAdvance ? Number(extractedData.fuelAdvance) : 0,
      totalMiles: extractedData.totalMiles ? Number(extractedData.totalMiles) : undefined,
      hazmat: extractedData.hazmat === true || extractedData.hazmat === 'true',
      pickupDate: extractedData.pickupDate || undefined,
      deliveryDate: extractedData.deliveryDate || undefined,
      stops: extractedData.stops && Array.isArray(extractedData.stops) 
        ? extractedData.stops.map((stop: any) => ({
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
            items: stop.items,
            totalPieces: stop.totalPieces ? Number(stop.totalPieces) : undefined,
            totalWeight: stop.totalWeight ? Number(stop.totalWeight) : undefined,
            notes: stop.notes,
            specialInstructions: stop.specialInstructions,
          }))
        : undefined,
    };

    onDataExtracted(loadData, selectedFile || undefined);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Intelligent Ingestion
          </CardTitle>
          <CardDescription>
            Upload a Rate Confirmation PDF to automatically extract load details using AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Drag and Drop Zone */}
          <div
            ref={dropZoneRef}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              'border-2 border-dashed rounded-lg p-12 text-center transition-colors',
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            )}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-muted">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  Drag and drop your Rate Confirmation PDF here
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  or click to browse
                </p>
              </div>
              <Input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileInputChange}
                className="hidden"
                id="pdf-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={importMutation.isPending}
              >
                <FileText className="h-4 w-4 mr-2" />
                Select PDF File
              </Button>
            </div>
          </div>

          {/* Selected File Display */}
          {selectedFile && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedFile(null);
                  setExtractedData(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
              >
                Remove
              </Button>
            </div>
          )}

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

          {/* Import Button */}
          {selectedFile && !extractedData && !importMutation.isPending && (
            <Button
              type="button"
              onClick={handleImport}
              className="w-full"
              size="lg"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Extract Load Data with AI
            </Button>
          )}

          {/* Extracted Data Preview */}
          {extractedData && (
            <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center gap-2 text-green-700">
                <Sparkles className="h-4 w-4" />
                <p className="text-sm font-medium">
                  Data Extracted Successfully
                </p>
              </div>
              <p className="text-sm text-green-600">
                Extracted {extractedData.extractedFields || 0} fields
                {extractedData.customerMatched 
                  ? ' • Customer matched' 
                  : extractedData.customerCreated 
                    ? ' • New customer created' 
                    : ' • Customer not matched'}
              </p>
              <Button
                type="button"
                onClick={handleUseData}
                className="w-full"
                size="lg"
              >
                Use Extracted Data
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Error Display */}
          {importMutation.isError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <div className="flex items-center gap-2 text-destructive">
                <FileText className="h-4 w-4" />
                <p className="text-sm font-medium">Import Failed</p>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {importMutation.error instanceof Error
                  ? importMutation.error.message
                  : 'An unknown error occurred'}
              </p>
            </div>
          )}

          {/* Manual Entry Option */}
          <div className="pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={onSkipToManual}
              className="w-full"
            >
              I don't have a Rate Confirmation right now
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Skip to manual entry
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


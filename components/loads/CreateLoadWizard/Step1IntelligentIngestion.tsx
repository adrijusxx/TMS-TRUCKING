'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileText, Loader2, Sparkles, ArrowRight, CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import type { CreateLoadInput } from '@/lib/validations/load';
import { apiUrl, cn } from '@/lib/utils';
import { useMutation } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Step1IntelligentIngestionProps {
  onDataExtracted: (data: Partial<CreateLoadInput>, pdfFile?: File) => void;
  onSkipToManual: () => void;
}

interface ExtractionMeta {
  customerMatched?: boolean;
  customerCreated?: boolean;
  extractedFields?: number;
  missingCritical?: string[];
  missingImportant?: string[];
  confidence?: 'high' | 'medium' | 'low';
  accountingWarnings?: string[];
}

interface ExtractedData {
  [key: string]: any;
  customerId?: string;
}

// Field categories for display
const CRITICAL_FIELDS = ['loadNumber', 'customerName', 'revenue', 'weight'];
const IMPORTANT_FIELDS = ['pickupAddress', 'pickupCity', 'pickupState', 'pickupDate', 'deliveryAddress', 'deliveryCity', 'deliveryState', 'deliveryDate'];
const DETAIL_FIELDS = ['pieces', 'commodity', 'pallets', 'temperature', 'totalMiles', 'equipmentType', 'loadType', 'pickupContact', 'pickupPhone', 'deliveryContact', 'deliveryPhone', 'dispatchNotes'];

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

function FieldStatusBadge({ status }: { status: 'extracted' | 'missing-critical' | 'missing-important' | 'missing' }) {
  switch (status) {
    case 'extracted':
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Extracted
        </Badge>
      );
    case 'missing-critical':
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Required
        </Badge>
      );
    case 'missing-important':
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Recommended
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
          Missing
        </Badge>
      );
  }
}

function getFieldDisplayName(field: string): string {
  const displayNames: Record<string, string> = {
    loadNumber: 'Load Number',
    customerName: 'Customer/Broker',
    revenue: 'Revenue',
    weight: 'Weight',
    pickupAddress: 'Pickup Address',
    pickupCity: 'Pickup City',
    pickupState: 'Pickup State',
    pickupDate: 'Pickup Date',
    deliveryAddress: 'Delivery Address',
    deliveryCity: 'Delivery City',
    deliveryState: 'Delivery State',
    deliveryDate: 'Delivery Date',
    pieces: 'Pieces',
    commodity: 'Commodity',
    pallets: 'Pallets',
    temperature: 'Temperature',
    totalMiles: 'Total Miles',
    equipmentType: 'Equipment Type',
    loadType: 'Load Type',
    pickupContact: 'Pickup Contact',
    pickupPhone: 'Pickup Phone',
    deliveryContact: 'Delivery Contact',
    deliveryPhone: 'Delivery Phone',
    dispatchNotes: 'Notes',
  };
  return displayNames[field] || field;
}

export default function Step1IntelligentIngestion({
  onDataExtracted,
  onSkipToManual,
}: Step1IntelligentIngestionProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [extractionMeta, setExtractionMeta] = useState<ExtractionMeta | null>(null);
  const [importStatus, setImportStatus] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [showDetails, setShowDetails] = useState(false);
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
      setExtractedData(response.data);
      setExtractionMeta({
        customerMatched: response.meta?.customerMatched,
        customerCreated: response.meta?.customerCreated,
        extractedFields: response.meta?.extractedFields,
        missingCritical: response.meta?.missingCritical || [],
        missingImportant: response.meta?.missingImportant || [],
        confidence: response.meta?.confidence || 'medium',
        accountingWarnings: response.meta?.accountingWarnings || [],
      });
      
      const confidence = response.meta?.confidence || 'medium';
      const message = confidence === 'high'
        ? `Extracted ${response.meta?.extractedFields || 0} fields with high confidence`
        : confidence === 'medium'
          ? `Extracted ${response.meta?.extractedFields || 0} fields - some fields may need review`
          : `Extracted ${response.meta?.extractedFields || 0} fields - missing critical fields`;
      
      if (confidence === 'low') {
        toast.warning(message);
      } else {
        toast.success(message);
      }
      
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
    setExtractionMeta(null);
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

  const handleReExtract = () => {
    if (!selectedFile) return;
    setExtractedData(null);
    setExtractionMeta(null);
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
      loadedMiles: extractedData.loadedMiles ? Number(extractedData.loadedMiles) : undefined,
      emptyMiles: extractedData.emptyMiles ? Number(extractedData.emptyMiles) : undefined,
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

  const getFieldStatus = (field: string): 'extracted' | 'missing-critical' | 'missing-important' | 'missing' => {
    const value = extractedData?.[field];
    const hasValue = value !== undefined && value !== null && value !== '';
    
    if (hasValue) return 'extracted';
    if (CRITICAL_FIELDS.includes(field)) return 'missing-critical';
    if (IMPORTANT_FIELDS.includes(field)) return 'missing-important';
    return 'missing';
  };

  const getConfidenceBadge = () => {
    const confidence = extractionMeta?.confidence || 'medium';
    switch (confidence) {
      case 'high':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            High Confidence
          </Badge>
        );
      case 'medium':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Medium Confidence
          </Badge>
        );
      case 'low':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Low Confidence
          </Badge>
        );
    }
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
                  setExtractionMeta(null);
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

          {/* Enhanced Extracted Data Preview */}
          {extractedData && extractionMeta && (
            <div className="space-y-4">
              {/* Confidence Header */}
              <div className={cn(
                'p-4 rounded-lg border',
                extractionMeta.confidence === 'high' ? 'bg-green-50 border-green-200' :
                extractionMeta.confidence === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                'bg-red-50 border-red-200'
              )}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className={cn(
                      'h-4 w-4',
                      extractionMeta.confidence === 'high' ? 'text-green-700' :
                      extractionMeta.confidence === 'medium' ? 'text-yellow-700' :
                      'text-red-700'
                    )} />
                    <span className={cn(
                      'text-sm font-medium',
                      extractionMeta.confidence === 'high' ? 'text-green-700' :
                      extractionMeta.confidence === 'medium' ? 'text-yellow-700' :
                      'text-red-700'
                    )}>
                      Data Extraction Complete
                    </span>
                  </div>
                  {getConfidenceBadge()}
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="outline" className="bg-white">
                    {extractionMeta.extractedFields || 0} fields extracted
                  </Badge>
                  {extractionMeta.customerMatched && (
                    <Badge variant="outline" className="bg-white text-green-700">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Customer matched
                    </Badge>
                  )}
                  {extractionMeta.customerCreated && (
                    <Badge variant="outline" className="bg-white text-blue-700">
                      New customer created
                    </Badge>
                  )}
                </div>

                {/* Accounting Warnings */}
                {extractionMeta.accountingWarnings && extractionMeta.accountingWarnings.length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-md mb-3">
                    <p className="text-sm font-medium text-amber-800 mb-2">
                      Accounting Warnings:
                    </p>
                    <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
                      {extractionMeta.accountingWarnings.map((warning, idx) => (
                        <li key={idx}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Field Status Preview */}
                <Collapsible open={showDetails} onOpenChange={setShowDetails}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-between">
                      <span>View Extraction Details</span>
                      <span className="text-xs text-muted-foreground">
                        {showDetails ? '▲' : '▼'}
                      </span>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 mt-4">
                    {/* Critical Fields */}
                    <div>
                      <p className="text-sm font-medium mb-2">Critical Fields (Required for Invoicing):</p>
                      <div className="grid grid-cols-2 gap-2">
                        {CRITICAL_FIELDS.map(field => (
                          <div key={field} className="flex items-center justify-between p-2 bg-white rounded border">
                            <span className="text-sm">{getFieldDisplayName(field)}</span>
                            <FieldStatusBadge status={getFieldStatus(field)} />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Important Fields */}
                    <div>
                      <p className="text-sm font-medium mb-2">Location Fields:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {IMPORTANT_FIELDS.map(field => (
                          <div key={field} className="flex items-center justify-between p-2 bg-white rounded border">
                            <span className="text-sm">{getFieldDisplayName(field)}</span>
                            <FieldStatusBadge status={getFieldStatus(field)} />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Detail Fields */}
                    <div>
                      <p className="text-sm font-medium mb-2">Additional Details:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {DETAIL_FIELDS.map(field => (
                          <div key={field} className="flex items-center justify-between p-2 bg-white rounded border">
                            <span className="text-sm">{getFieldDisplayName(field)}</span>
                            <FieldStatusBadge status={getFieldStatus(field)} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReExtract}
                  disabled={importMutation.isPending}
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Re-Extract
                </Button>
                <Button
                  type="button"
                  onClick={handleUseData}
                  className="flex-1"
                  size="lg"
                >
                  Use Extracted Data
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleImport}
                className="mt-3"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
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

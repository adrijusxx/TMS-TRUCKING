'use client';

import { useState, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { CreateLoadInput } from '@/lib/validations/load';
import { apiUrl } from '@/lib/utils';
import { useMutation } from '@tanstack/react-query';
import RateConProcessingSkeleton from '@/components/loads/RateConProcessingSkeleton';
import { showErrorFeedback } from '@/components/ui/error-feedback-toast';
import {
  PdfDropZone,
  SelectedFileDisplay,
  ExtractionResultsPreview,
  ImportErrorDisplay,
  type ExtractionMeta,
  type ExtractedData,
} from './ingestion';

interface Step1IntelligentIngestionProps {
  onDataExtracted: (data: Partial<CreateLoadInput>, pdfFile?: File) => void;
  onSkipToManual: () => void;
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
  const [extractionMeta, setExtractionMeta] = useState<ExtractionMeta | null>(
    null
  );
  const [importStatus, setImportStatus] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      setProgress(0);
      setImportStatus('Uploading PDF...');

      let progressInterval: NodeJS.Timeout | null = null;

      try {
        // Phase 1: Upload (instant)
        setProgress(10);

        // Phase 2: Show extracting while waiting for API
        setImportStatus('Extracting text from PDF...');
        setProgress(20);

        // Slow, realistic progress animation (reaches ~80% over 5 seconds)
        let currentProgress = 20;
        progressInterval = setInterval(() => {
          currentProgress = Math.min(currentProgress + 3, 80);
          setProgress(currentProgress);

          // Update status based on progress
          if (currentProgress >= 40 && currentProgress < 60) {
            setImportStatus('AI analyzing document...');
          } else if (currentProgress >= 60) {
            setImportStatus('Extracting details...');
          }
        }, 500);

        // Actual API call
        const result = await importPDF(file);

        // Clear interval and complete
        if (progressInterval) {
          clearInterval(progressInterval);
        }

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
        confidence: response.meta?.confidence || 'medium',
        accountingWarnings: response.meta?.accountingWarnings || [],
      });

      const confidence = response.meta?.confidence || 'medium';
      const fields = response.meta?.extractedFields || 0;
      const timeMs = response.meta?.processingTimeMs || 0;
      const message = `Extracted ${fields} fields in ${(timeMs / 1000).toFixed(1)}s`;

      if (confidence === 'low') {
        toast.warning(message + ' - some fields need review');
      } else {
        toast.success(message);
      }

      setTimeout(() => {
        setImportStatus('');
        setProgress(0);
      }, 1000);
    },
    onError: (error: Error) => {
      setImportStatus('');
      setProgress(0);
      // Show error with copy capability for reporting
      showErrorFeedback(
        'PDF Import Failed',
        error.message || 'Failed to import PDF',
        {
          details: `File: ${selectedFile?.name || 'unknown'}\nSize: ${selectedFile ? (selectedFile.size / 1024).toFixed(2) + ' KB' : 'unknown'}`,
        }
      );
    },
  });

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setExtractedData(null);
    setExtractionMeta(null);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setExtractedData(null);
    setExtractionMeta(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

    const { customerMatched, customerCreated, extractedFields, ...loadDataRaw } =
      extractedData;

    const loadData: Partial<CreateLoadInput> = {
      ...loadDataRaw,
      weight: extractedData.weight ? Number(extractedData.weight) : undefined,
      pieces: extractedData.pieces ? Number(extractedData.pieces) : undefined,
      pallets: extractedData.pallets ? Number(extractedData.pallets) : undefined,
      revenue: extractedData.revenue ? Number(extractedData.revenue) : undefined,
      driverPay: extractedData.driverPay
        ? Number(extractedData.driverPay)
        : undefined,
      fuelAdvance: extractedData.fuelAdvance
        ? Number(extractedData.fuelAdvance)
        : 0,
      totalMiles: extractedData.totalMiles
        ? Number(extractedData.totalMiles)
        : undefined,
      loadedMiles: extractedData.loadedMiles
        ? Number(extractedData.loadedMiles)
        : undefined,
      emptyMiles: extractedData.emptyMiles
        ? Number(extractedData.emptyMiles)
        : undefined,
      hazmat: extractedData.hazmat === true || extractedData.hazmat === 'true',
      pickupDate: (typeof extractedData.pickupDate === 'string' || extractedData.pickupDate instanceof Date) ? extractedData.pickupDate : undefined,
      deliveryDate: (typeof extractedData.deliveryDate === 'string' || extractedData.deliveryDate instanceof Date) ? extractedData.deliveryDate : undefined,
      stops:
        extractedData.stops && Array.isArray(extractedData.stops)
          ? extractedData.stops.map((stop: Record<string, unknown>) => ({
            stopType: stop.stopType as 'PICKUP' | 'DELIVERY',
            sequence: Number(stop.sequence) || 1,
            company: stop.company as string,
            address: stop.address as string,
            city: stop.city as string,
            state: (stop.state as string)?.toUpperCase().slice(0, 2),
            zip: stop.zip as string,
            phone: stop.phone as string,
            earliestArrival: stop.earliestArrival as string,
            latestArrival: stop.latestArrival as string,
            contactName: stop.contactName as string,
            contactPhone: stop.contactPhone as string,
            items: Array.isArray(stop.items) ? stop.items : [],
            totalPieces: stop.totalPieces
              ? Number(stop.totalPieces)
              : undefined,
            totalWeight: stop.totalWeight
              ? Number(stop.totalWeight)
              : undefined,
            notes: stop.notes as string,
            specialInstructions: stop.specialInstructions as string,
          }))
          : undefined,
    };

    onDataExtracted(loadData, selectedFile || undefined);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2 mb-8">
        <h3 className="text-lg font-medium flex items-center justify-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Intelligent Ingestion
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Upload a Rate Confirmation PDF to automatically extract load details using AI.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Drag and Drop Zone */}
        <PdfDropZone
          onFileSelect={handleFileSelect}
          disabled={importMutation.isPending}
        />

        {/* Selected File Display */}
        {selectedFile && (
          <div className="mt-4">
            <SelectedFileDisplay file={selectedFile} onRemove={handleRemoveFile} />
          </div>
        )}

        {/* Processing Skeleton */}
        {importMutation.isPending && (
          <div className="mt-4">
            <RateConProcessingSkeleton
              progress={progress}
              statusMessage={importStatus}
              fileName={selectedFile?.name}
            />
          </div>
        )}

        {/* Import Button */}
        {selectedFile && !extractedData && !importMutation.isPending && (
          <Button
            type="button"
            onClick={handleImport}
            className="w-full mt-4"
            size="lg"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Extract Load Data with AI
          </Button>
        )}

        {/* Extraction Results Preview */}
        {extractedData && extractionMeta && (
          <div className="mt-6">
            <ExtractionResultsPreview
              extractedData={extractedData}
              extractionMeta={extractionMeta}
              onReExtract={handleReExtract}
              onUseData={handleUseData}
              isReExtracting={importMutation.isPending}
            />
          </div>
        )}

        {/* Error Display */}
        {importMutation.isError && (
          <div className="mt-4">
            <ImportErrorDisplay
              error={importMutation.error}
              onRetry={handleImport}
            />
          </div>
        )}

        {/* Manual Skip - Redundant with Tabs, but keeping as a shortcut */}
        <div className="pt-6 mt-6 border-t text-center">
          <Button
            type="button"
            variant="link"
            onClick={onSkipToManual}
            className="text-muted-foreground hover:text-primary"
          >
            Skip to manual entry &rarr;
          </Button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

import { excelFileToJSON, ExcelImportResult } from '@/lib/import-export/excel-import';
import { csvFileToJSON, CSVImportResult } from '@/lib/import-export/csv-import';
import { apiUrl } from '@/lib/utils';
import { deduplicateSystemFields } from '@/lib/import-export/field-utils';
import { autoMapColumns } from '@/lib/import-export/auto-map-columns';

import { ImportUploadStep } from './ImportUploadStep';
import { ImportMatchingStep } from './ImportMatchingStep';
import { ImportPreviewStep } from './ImportPreviewStep';
import { AIImportAdvisor, type AIAnalysisResult } from './AIImportAdvisor';

interface ImportPageProps {
  entityType: string;
  entityLabel: string;
  systemFields: Array<{ key: string; label: string; required?: boolean }>;
  backUrl?: string;
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
  onComplete,
  onBack,
  hideHeader = false,
}: ImportPageProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');

  const deduplicatedFields = deduplicateSystemFields(systemFields);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<CSVImportResult | ExcelImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [selectedMcNumberId, setSelectedMcNumberId] = useState<string>('');
  const [updateExisting, setUpdateExisting] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [importProgress, setImportProgress] = useState<number>(0);
  const [importStatus, setImportStatus] = useState<string>('');
  const [errorLog, setErrorLog] = useState<Array<{ row: number; field?: string; error: string }>>([]);
  const [successCount, setSuccessCount] = useState(0);

  // AI Analysis State
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAiMapping, setIsAiMapping] = useState(false);

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
    setSelectedFile(file);
    setImportResult(null);
    setPreviewData([]);
    setErrorLog([]);
    setAiAnalysis(null);

    try {
      setIsProcessing(true);
      const result = file.name.endsWith('.csv') ? await csvFileToJSON(file) : await excelFileToJSON(file);
      setImportResult(result);

      if (result.success && result.data && result.data.length > 0) {
        const excelColumns = Object.keys(result.data[0] || {});
        const autoMapping = autoMapColumns(excelColumns, deduplicatedFields);
        setColumnMapping(autoMapping);
        setCurrentStep('matching');

        // Trigger AI Analysis
        setIsAnalyzing(true);
        const analyzePromise = fetch(apiUrl('/api/import-export/analyze-file'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            headers: excelColumns,
            sampleData: result.data.slice(0, 3),
            entityType
          }),
        })
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data) setAiAnalysis(data);
          })
          .finally(() => setIsAnalyzing(false));

        // ALSO Trigger AI Mapping Automatically
        const aiMapPromise = (async () => {
          setIsAiMapping(true);
          try {
            const res = await fetch(apiUrl('/api/import-export/ai-mapping'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ headers: excelColumns, entityType })
            });
            const data = await res.json();
            if (data.mapping) {
              setColumnMapping(prev => ({ ...prev, ...data.mapping }));
              // We don't toast here to keep it quiet, the UI will update
            }
          } catch (err) {
            console.error('AI Mapping failed', err);
          } finally {
            setIsAiMapping(false);
          }
        })();

        await Promise.all([analyzePromise, aiMapPromise]);
      } else {
        toast.error(`Found ${result.errors?.length || 0} validation errors`);
      }
    } catch (error: any) {
      toast.error('Failed to parse file: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  }, [deduplicatedFields, entityType]);


  const handleNextToPreview = () => {
    if (!importResult || !selectedMcNumberId) {
      toast.error('Please select an MC number');
      return;
    }

    const mappedData = importResult.data.map((row: any) => {
      const mapped: any = {};
      Object.entries(columnMapping).forEach(([excelCol, systemField]) => {
        if (systemField && row[excelCol] !== undefined) mapped[systemField] = row[excelCol];
      });
      return mapped;
    });

    setPreviewData(mappedData.slice(0, 10));
    setCurrentStep('preview');
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      const selectedMc = mcNumbers.find((mc: any) => mc.mcNumberId === selectedMcNumberId);
      const mcNumberValue = (selectedMc?.mcNumber || selectedMc?.number)?.toString().trim();

      if (!mcNumberValue) throw new Error('Invalid MC selection');

      setImportProgress(0);
      setImportStatus('Starting import...');

      const response = await fetch(apiUrl(`/api/import-export/${entityType}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: importResult!.data,
          columnMapping,
          currentMcNumber: mcNumberValue,
          updateExisting,
        }),
      });

      if (!response.ok) throw new Error((await response.json()).error?.message || 'Import failed');
      return response.json();
    },
    onSuccess: (data) => {
      const result = data.data || data;
      setSuccessCount(result.created || result.details?.created?.length || 0);
      if (result.details?.errors?.length > 0) {
        setErrorLog(result.details.errors);
        setImportStatus('Completed with errors');
      } else {
        toast.success(`Successfully imported ${entityLabel.toLowerCase()}`);
        setTimeout(() => onComplete ? onComplete() : (backUrl && router.push(backUrl)), 2000);
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {!hideHeader && (
        <Button variant="ghost" onClick={() => onBack ? onBack() : (backUrl && router.push(backUrl))} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
      )}

      {/* Step Indicator (Simplified) */}
      <div className="mb-8 flex items-center justify-between gap-4">
        {['upload', 'matching', 'preview'].map((step, idx) => (
          <div key={step} className="flex items-center gap-3 flex-1">
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full border-2",
              currentStep === step ? "bg-primary text-primary-foreground border-primary" :
                (idx < ['upload', 'matching', 'preview'].indexOf(currentStep) ? "bg-green-500 text-white border-green-500" : "bg-muted")
            )}>
              {idx < ['upload', 'matching', 'preview'].indexOf(currentStep) ? <CheckCircle2 className="h-5 w-5" /> : idx + 1}
            </div>
            <div>
              <div className="font-semibold capitalize">{step}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card border rounded-lg p-6">
        {currentStep === 'upload' && (
          <>
            <ImportUploadStep
              onFileSelect={handleFileSelect}
              isProcessing={isProcessing}
              selectedFile={selectedFile}
              onReset={() => { setSelectedFile(null); setImportResult(null); }}
            />
            <AIImportAdvisor analysis={aiAnalysis} isAnalyzing={isAnalyzing} isMapping={isAiMapping} />
          </>
        )}

        {currentStep === 'matching' && (
          <ImportMatchingStep
            selectedMcNumberId={selectedMcNumberId}
            setSelectedMcNumberId={setSelectedMcNumberId}
            mcNumbers={mcNumbers}
            updateExisting={updateExisting}
            setUpdateExisting={setUpdateExisting}
            columnMapping={columnMapping}
            setColumnMapping={setColumnMapping}
            excelColumns={Object.keys(importResult!.data[0])}
            deduplicatedFields={deduplicatedFields}
            onBack={() => setCurrentStep('upload')}
            onNext={handleNextToPreview}
            isAiMapping={isAiMapping}
          />
        )}

        {currentStep === 'preview' && (
          <ImportPreviewStep
            previewData={previewData}
            importResult={importResult}
            importMutation={importMutation}
            importStatus={importStatus}
            importProgress={importProgress}
            errorLog={errorLog}
            successCount={successCount}
            onImport={() => importMutation.mutate()}
            onComplete={onComplete}
            backUrl={backUrl}
            router={router}
            entityLabel={entityLabel}
            deduplicatedFields={deduplicatedFields}
            columnMapping={columnMapping}
          />
        )}
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

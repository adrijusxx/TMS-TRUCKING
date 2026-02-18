'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { csvFileToJSON, CSVImportResult } from '@/lib/import-export/csv-import';
import { excelFileToJSON, ExcelImportResult } from '@/lib/import-export/excel-import';
import { apiUrl } from '@/lib/utils';
import { deduplicateSystemFields, getSystemFieldsForEntity } from '@/lib/import-export/field-utils';
import { validateImportData, getModelNameFromEntityType } from '@/lib/validations/import-field-validator';
import { autoMapColumns } from '@/lib/import-export/auto-map-columns';
import type { MissingFieldWarning } from '@/lib/validations/import-field-validator';

export interface ImportProgress {
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  message: string;
  progress: number;
  created?: number;
  updated?: number;
  errors?: number;
}

export interface ImportDetails {
  created: any[];
  errors: Array<{ row: number; field: string; error: string }>;
  createdCount?: number;
  updatedCount?: number;
  errorsCount?: number;
}

export interface PreviewData {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  warningCount: number;
  valid: any[];
  invalid: any[];
  warnings: any[];
}

interface UseImportWizardOptions {
  entityType: string;
  onImportComplete?: (data: any[]) => void;
}

export function useImportWizard({ entityType, onImportComplete }: UseImportWizardOptions) {
  const queryClient = useQueryClient();

  // Step management
  const [activeStep, setActiveStep] = useState(1);

  // File handling
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<CSVImportResult | ExcelImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mapping
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [fixedValues, setFixedValues] = useState<Record<string, string>>({});
  const [isAiMapping, setIsAiMapping] = useState(false);

  // Options
  const [selectedMcNumberId, setSelectedMcNumberId] = useState('');
  const [updateExisting, setUpdateExisting] = useState(false);
  const [treatAsHistorical, setTreatAsHistorical] = useState(true);

  // Preview
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);

  // Import progress
  const [importProgress, setImportProgress] = useState<ImportProgress>({ status: 'idle', message: '', progress: 0 });
  const [importDetails, setImportDetails] = useState<ImportDetails | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Saved mapping profiles
  const [mappingName, setMappingName] = useState('');
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

  // Derived
  const systemFields = useMemo(() => {
    const raw = getSystemFieldsForEntity(entityType);
    return deduplicateSystemFields(raw);
  }, [entityType]);

  const modelName = useMemo(() => getModelNameFromEntityType(entityType), [entityType]);

  // Validation
  const validation = useMemo(() => {
    if (!importResult?.data?.[0]) return null;
    const csvHeaders = Object.keys(importResult.data[0]);
    const provided = [...Object.keys(fixedValues)];
    if (selectedMcNumberId) provided.push('mcNumberId');
    return validateImportData(modelName, csvHeaders, importResult.data[0], columnMapping, provided);
  }, [importResult, columnMapping, modelName, fixedValues, selectedMcNumberId]);

  const unmappedRequired = useMemo(() => {
    return validation?.missingRequiredFields.filter(f => f.severity === 'error') || [];
  }, [validation]);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Saved mappings query
  const { data: savedMappings } = useQuery({
    queryKey: ['import-mappings', entityType],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/api/import/mappings?entityType=${entityType}`));
      if (!res.ok) throw new Error('Failed to fetch mappings');
      return await res.json() as { id: string; name: string; mapping: Record<string, string> }[];
    },
    enabled: activeStep === 2,
  });

  // Save mapping mutation
  const saveMappingMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch(apiUrl('/api/import/mappings'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, entityType, mapping: columnMapping }),
      });
      if (!res.ok) throw new Error('Failed to save mapping');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Mapping saved successfully');
      queryClient.invalidateQueries({ queryKey: ['import-mappings', entityType] });
      setIsSaveDialogOpen(false);
      setMappingName('');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleLoadMapping = useCallback((mappingId: string) => {
    const mapping = savedMappings?.find(m => m.id === mappingId);
    if (mapping) {
      setColumnMapping(mapping.mapping);
      toast.success(`Applied mapping profile: ${mapping.name}`);
    }
  }, [savedMappings]);

  // AI mapping mutation
  const aiMappingMutation = useMutation({
    mutationFn: async (headers: string[]) => {
      const res = await fetch(apiUrl('/api/import-export/ai-mapping'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headers, entityType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI Mapping failed');
      return data.mapping;
    },
    onSuccess: (newMapping) => {
      if (newMapping && Object.keys(newMapping).length > 0) {
        setColumnMapping(prev => ({ ...prev, ...newMapping }));
      }
    },
    onError: (err: any) => console.error('AI Mapping failed', err),
    onSettled: () => setIsAiMapping(false),
  });

  // File handling
  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Please select a CSV or Excel file');
      return;
    }

    setSelectedFile(file);
    setImportResult(null);
    setColumnMapping({});
    setFixedValues({});
    setImportDetails(null);
    setPreviewData(null);
    setImportProgress({ status: 'idle', message: '', progress: 0 });
    setIsProcessing(true);

    try {
      const result = file.name.endsWith('.csv') ? await csvFileToJSON(file) : await excelFileToJSON(file);
      setImportResult(result);

      if (result.success && result.data?.length > 0) {
        const headers = Object.keys(result.data[0]);

        // 1. Instant local auto-mapping
        const autoMap = autoMapColumns(headers, systemFields);
        setColumnMapping(autoMap);

        // 2. AI mapping (silent, merges with local)
        setIsAiMapping(true);
        aiMappingMutation.mutate(headers);

        // Stay on upload step so user can review MC number, options, and AI advisor
      }
    } catch (err: any) {
      toast.error(err.message);
      setSelectedFile(null);
    } finally {
      setIsProcessing(false);
    }
  }, [systemFields, entityType]);

  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setImportResult(null);
    setColumnMapping({});
    setFixedValues({});
    setActiveStep(1);
    setUpdateExisting(false);
    setImportDetails(null);
    setPreviewData(null);
    setImportProgress({ status: 'idle', message: '', progress: 0 });
    setSelectedMcNumberId('');
    setLogs([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // Preview mutation
  const previewMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || !importResult) throw new Error('No file');
      setImportProgress({ status: 'processing', message: 'Analyzing data...', progress: 20 });

      // Strip unmapped columns and empty values to reduce payload size
      const mappedCsvHeaders = new Set(Object.keys(columnMapping));
      const strippedPreviewData = importResult.data.map(row => {
        const stripped: Record<string, any> = {};
        for (const [key, value] of Object.entries(row)) {
          if (value != null && value !== '' && mappedCsvHeaders.has(key)) {
            stripped[key] = value;
          }
        }
        return stripped;
      });

      const res = await fetch(apiUrl(entityType === 'invoices' ? '/api/invoices/import' : `/api/import-export/${entityType}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: strippedPreviewData,
          columnMapping,
          fixedValues,
          mcNumberId: selectedMcNumberId,
          currentMcNumber: selectedMcNumberId,
          updateExisting,
          previewOnly: true,
          treatAsHistorical: entityType === 'loads' ? treatAsHistorical : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Preview failed');
      setImportProgress({ status: 'idle', message: '', progress: 0 });
      return data;
    },
    onSuccess: (data) => {
      if (data.preview && data.data) {
        setPreviewData(data.data);
        setActiveStep(3);
        toast.success(`Preview ready: ${data.data.validCount} valid, ${data.data.warningCount} warnings, ${data.data.invalidCount} errors`);
      } else {
        toast.error('Invalid preview response');
      }
    },
    onError: (err: any) => {
      setImportProgress({ status: 'error', message: err.message, progress: 0 });
      toast.error(err.message);
    },
  });

  // Chunked import mutation
  const importMutation = useMutation({
    mutationFn: async () => {
      if (!importResult?.data) throw new Error('No data');
      setImportProgress({ status: 'uploading', message: 'Starting import...', progress: 0 });
      setImportDetails(null);
      setLogs([]);

      const BATCH_SIZE = 50;
      const totalRows = importResult.data.length;
      const chunks: any[][] = [];
      for (let i = 0; i < totalRows; i += BATCH_SIZE) {
        chunks.push(importResult.data.slice(i, i + BATCH_SIZE));
      }

      let totalCreated = 0, totalUpdated = 0, totalErrors = 0;
      const allCreated: any[] = [], allErrors: any[] = [];

      setLogs(prev => [...prev, `Starting import of ${totalRows} rows in ${chunks.length} batches...`]);

      // Strip unmapped columns and empty values to reduce payload size
      const mappedCsvHeaders = new Set(Object.keys(columnMapping));
      const stripRow = (row: any) => {
        const stripped: Record<string, any> = {};
        for (const [key, value] of Object.entries(row)) {
          if (value != null && value !== '' && mappedCsvHeaders.has(key)) {
            stripped[key] = value;
          }
        }
        return stripped;
      };

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const strippedChunk = chunk.map(stripRow);
        const batchNum = i + 1;
        setImportProgress({ status: 'processing', message: `Processing batch ${batchNum}/${chunks.length}...`, progress: Math.round((i / chunks.length) * 100) });

        try {
          const endpoint = entityType === 'invoices' ? '/api/invoices/import' : `/api/import-export/${entityType}`;
          const res = await fetch(apiUrl(endpoint), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: strippedChunk,
              columnMapping,
              fixedValues,
              mcNumberId: selectedMcNumberId,
              currentMcNumber: selectedMcNumberId,
              updateExisting,
              importMode: entityType === 'drivers' && updateExisting ? 'upsert' : undefined,
              treatAsHistorical: entityType === 'loads' ? treatAsHistorical : undefined,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error?.message || `Batch ${batchNum} failed`);

          const summary = data.data;
          const created = summary.created ?? summary.details?.created?.length ?? 0;
          const updated = summary.updated ?? 0;
          const errors = summary.errors ?? summary.details?.errors?.length ?? 0;
          totalCreated += created;
          totalUpdated += updated;
          totalErrors += errors;
          if (summary.details?.created) allCreated.push(...summary.details.created);
          if (summary.details?.errors) {
            const batchErrors = summary.details.errors.map((e: any) => ({ ...e, row: e.row === 0 ? 0 : e.row + i * BATCH_SIZE }));
            allErrors.push(...batchErrors);
          }
          setLogs(prev => [...prev, `Batch ${batchNum}: ${created} created, ${updated} updated, ${errors} errors`]);
        } catch (err: any) {
          setLogs(prev => [...prev, `Batch ${batchNum} Failed: ${err.message}`]);
          totalErrors += chunk.length;
          allErrors.push({ row: i * BATCH_SIZE, field: 'BATCH', error: `Batch failed: ${err.message}` });
        }
      }

      setImportProgress({ status: 'complete', message: `Complete: ${totalCreated} created, ${totalUpdated} updated, ${totalErrors} errors`, progress: 100, created: totalCreated, updated: totalUpdated, errors: totalErrors });
      setImportDetails({ created: allCreated, errors: allErrors, createdCount: totalCreated, updatedCount: totalUpdated, errorsCount: totalErrors });
      setLogs(prev => [...prev, 'Import Complete!']);
      return { createdCount: totalCreated, updatedCount: totalUpdated, errorsCount: totalErrors, createdItems: allCreated };
    },
    onSuccess: (data) => {
      const { createdCount, updatedCount, errorsCount, createdItems } = data;
      if (createdCount > 0 || updatedCount > 0) {
        const action = updatedCount > 0 ? (createdCount > 0 ? 'Imported & Updated' : 'Updated') : 'Imported';
        if (errorsCount > 0) toast.warning(`${action} some records with ${errorsCount} errors.`);
        else {
          toast.success(`${action} all records successfully.`);
          if (onImportComplete) onImportComplete(createdItems);
        }
      } else {
        toast.error(`Import failed. ${errorsCount} errors found.`);
      }
    },
    onError: (err: any) => {
      setImportProgress({ status: 'error', message: err.message, progress: 0 });
      toast.error(err.message);
    },
  });

  return {
    activeStep, setActiveStep,
    selectedFile, importResult, isProcessing, fileInputRef,
    columnMapping, setColumnMapping, fixedValues, setFixedValues, isAiMapping,
    selectedMcNumberId, setSelectedMcNumberId,
    updateExisting, setUpdateExisting,
    treatAsHistorical, setTreatAsHistorical,
    previewData, setPreviewData, previewMutation,
    importProgress, importDetails, importMutation,
    logs, logsEndRef,
    systemFields, modelName, validation, unmappedRequired,
    savedMappings, handleLoadMapping, saveMappingMutation,
    mappingName, setMappingName, isSaveDialogOpen, setIsSaveDialogOpen,
    handleFileSelect, handleReset,
    entityType,
  };
}

export type UseImportWizardReturn = ReturnType<typeof useImportWizard>;

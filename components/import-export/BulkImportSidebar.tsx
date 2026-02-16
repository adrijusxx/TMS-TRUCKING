'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, AlertCircle, CheckCircle2, X, Loader2, Settings2, Trash2, ArrowRight, Download, Copy, AlertTriangle, Sparkles, Save, CornerDownLeft } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { csvFileToJSON, parseCSV, CSVImportResult } from '@/lib/import-export/csv-import';
import { excelFileToJSON, ExcelImportResult } from '@/lib/import-export/excel-import';
import { apiUrl } from '@/lib/utils';
import { validateImportData, getModelNameFromEntityType } from '@/lib/validations/import-field-validator';
import McNumberSelector from '@/components/mc-numbers/McNumberSelector';
import { deduplicateSystemFields, getSystemFieldsForEntity } from '@/lib/import-export/field-utils';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import ImportFieldWarnings from './ImportFieldWarnings';
import { useQueryClient } from '@tanstack/react-query'; // Added useQueryClient
import { useQuery } from '@tanstack/react-query'; // Ensure useQuery is imported

interface AIAnalysisResult {
    summary: string;
    tips: string[];
    confidence: 'High' | 'Medium' | 'Low';
    suggestedMapping?: Record<string, string>;
}

interface BulkImportSidebarProps {
    entityType: string;
    onImportComplete?: (data: any[]) => void;
    onClose?: () => void;
}

export default function BulkImportSidebar({
    entityType,
    onImportComplete,
    onClose,
}: BulkImportSidebarProps) {
    // State
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [importResult, setImportResult] = useState<CSVImportResult | ExcelImportResult | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
    const [fixedValues, setFixedValues] = useState<Record<string, string>>({});
    const [selectedMcNumberId, setSelectedMcNumberId] = useState<string>('');
    const [updateExisting, setUpdateExisting] = useState<boolean>(false);
    const [activeStep, setActiveStep] = useState<number>(1);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // AI Analysis State
    const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const [importProgress, setImportProgress] = useState<{
        status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
        message: string;
        progress: number;
        created?: number;
        updated?: number;
        errors?: number;
    }>({
        status: 'idle',
        message: '',
        progress: 0,
    });

    const [importDetails, setImportDetails] = useState<{
        created: any[];
        errors: Array<{ row: number; field: string; error: string }>;
        createdCount?: number;
        updatedCount?: number;
        errorsCount?: number;
    } | null>(null);

    // Preview mode state
    const [previewData, setPreviewData] = useState<{
        totalRows: number;
        validCount: number;
        invalidCount: number;
        warningCount: number;
        valid: any[];
        invalid: any[];
        warnings: any[];
    } | null>(null);


    // Logs for accurate progress
    const [logs, setLogs] = useState<string[]>([]);
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll logs
    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    // Derived
    const systemFields = useMemo(() => {
        const rawFields = getSystemFieldsForEntity(entityType);
        return deduplicateSystemFields(rawFields);
    }, [entityType]);

    const modelName = useMemo(() => getModelNameFromEntityType(entityType), [entityType]);

    // Validation
    const validation = useMemo(() => {
        if (!importResult?.data?.[0]) return null;
        const csvHeaders = Object.keys(importResult.data[0]);
        // Include fixed value keys as provided fields to clear validation errors. Also include mcNumberId if selected.
        const provided = [...Object.keys(fixedValues)];
        if (selectedMcNumberId) provided.push('mcNumberId');
        return validateImportData(modelName, csvHeaders, importResult.data[0], columnMapping, provided);
    }, [importResult, columnMapping, modelName, fixedValues, selectedMcNumberId]);

    const unmappedRequired = useMemo(() => {
        return validation?.missingRequiredFields.filter(f => f.severity === 'error') || [];
    }, [validation]);

    // AI Analysis Mutation
    const analyzeFileMutation = useMutation({
        mutationFn: async (data: { headers: string[], sample: any[] }) => {
            const res = await fetch(apiUrl('/api/import-export/analyze-file'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    headers: data.headers,
                    sampleData: data.sample,
                    entityType
                })
            });
            if (!res.ok) throw new Error('Analysis failed');
            return await res.json() as AIAnalysisResult;
        },
        onSuccess: (data) => {
            setAiAnalysis(data);
            if (data.suggestedMapping) {
                setColumnMapping(prev => ({ ...prev, ...data.suggestedMapping }));
                toast.success('AI applied smart mappings');
            }
        },
        onError: () => {
            // Silently fail or just log, don't block user
            console.warn('AI analysis failed');
        }
    });

    const queryClient = useQueryClient();
    const [mappingName, setMappingName] = useState("");
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

    // Fetch Saved Mappings
    const { data: savedMappings } = useQuery({
        queryKey: ['import-mappings', entityType],
        queryFn: async () => {
            const res = await fetch(apiUrl(`/api/import/mappings?entityType=${entityType}`));
            if (!res.ok) throw new Error('Failed to fetch mappings');
            return await res.json() as { id: string, name: string, mapping: Record<string, string> }[];
        },
        enabled: activeStep === 2, // Fetch only when needed
    });

    // Save Mapping Mutation
    const saveMappingMutation = useMutation({
        mutationFn: async (name: string) => {
            const res = await fetch(apiUrl('/api/import/mappings'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    entityType,
                    mapping: columnMapping
                })
            });
            if (!res.ok) throw new Error('Failed to save mapping');
            return await res.json();
        },
        onSuccess: () => {
            toast.success('Mapping saved successfully');
            queryClient.invalidateQueries({ queryKey: ['import-mappings', entityType] });
            setIsSaveDialogOpen(false);
            setMappingName("");
        },
        onError: (err: any) => toast.error(err.message)
    });

    const handleLoadMapping = (mappingId: string) => {
        const mapping = savedMappings?.find(m => m.id === mappingId);
        if (mapping) {
            setColumnMapping(mapping.mapping);
            toast.success(`Applied mapping profile: ${mapping.name}`);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await fetch(apiUrl(`/api/import/template?entityType=${entityType}`));
            if (!response.ok) throw new Error('Failed to download template');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${entityType}_template.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success('Template downloaded');
        } catch (error) {
            toast.error('Failed to download template');
        }
    };


    // File Handling
    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            toast.error('Please select a CSV or Excel file');
            return;
        }

        setSelectedFile(file);
        setImportResult(null);
        setColumnMapping({});
        setFixedValues({});
        setImportDetails(null);
        setImportProgress({ status: 'idle', message: '', progress: 0 });
        setIsProcessing(true);

        try {
            let result;
            if (file.name.endsWith('.csv')) {
                result = await csvFileToJSON(file);
            } else {
                result = await excelFileToJSON(file);
            }

            setImportResult(result);

            if (result.success && result.data?.length > 0) {
                // Auto-map
                const headers = Object.keys(result.data[0]);
                const autoMap: Record<string, string> = {};

                headers.forEach(header => {
                    const normalizeSimple = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

                    // Advanced normalization: handle "number" vs "id" vs "#" common in trucking
                    const normalizeAdvanced = (str: string) => {
                        let s = str.toLowerCase().replace(/[^a-z0-9]/g, '');
                        s = s.replace(/number/g, 'id').replace(/no/g, 'id').replace(/#/g, 'id');
                        return s;
                    };

                    const normHeader = normalizeSimple(header);
                    const normHeaderAdv = normalizeAdvanced(header);

                    // Find best match
                    const match = systemFields.find(f => {
                        const normKey = normalizeSimple(f.key);
                        const normKeyAdv = normalizeAdvanced(f.key);

                        // 1. Exact match (normalized)
                        if (normHeader === normKey) return true;

                        // 2. Advanced semantic match (load_id == load_number)
                        if (normHeaderAdv === normKeyAdv) return true;

                        // 3. Substring match (careful with short strings)
                        if (normHeader.length > 3 && normKey.length > 3) {
                            return normHeader.includes(normKey) || normKey.includes(normHeader);
                        }

                        // 4. Check generated suggestions from validator
                        const suggestions = f.suggestedCsvHeaders || [];
                        return suggestions.some(s => {
                            const ns = normalizeSimple(s);
                            return ns === normHeader;
                        });
                    });

                    if (match) {
                        autoMap[header] = match.key;
                    }
                });
                setColumnMapping(autoMap);

                // Trigger AI Analysis
                analyzeFileMutation.mutate({
                    headers: Object.keys(result.data[0]),
                    sample: result.data.slice(0, 5)
                });

                // setActiveStep(2); // Do not auto-advance, let user see options first
            }

        } catch (err: any) {
            toast.error(err.message);
            setSelectedFile(null);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReset = () => {
        setSelectedFile(null);
        setImportResult(null);
        setColumnMapping({});
        setActiveStep(1);
        setUpdateExisting(false); // Reset this option too
        setImportDetails(null);
        setPreviewData(null); // Reset preview data
        setAiAnalysis(null); // Reset AI data
        setImportProgress({ status: 'idle', message: '', progress: 0 });
        // Do NOT reset MC Number as user likely wants to keep it
        if (fileInputRef.current) fileInputRef.current.value = '';
        setSelectedMcNumberId(''); // Reset this too to avoid stale state
    };

    // Helper to generate smart summary for toast
    const generateErrorSummary = (errors: any[]) => {
        if (!errors || errors.length === 0) return '';

        // Group by error message
        const groups: Record<string, number> = {};
        errors.forEach(e => {
            // Simplify error message for grouping (remove specific values if possible)
            let key = e.error || 'Unknown error';
            if (key.includes('Unique constraint')) key = 'Duplicate record found';
            if (key.includes('User with email')) key = 'Email already exists';

            groups[key] = (groups[key] || 0) + 1;
        });

        const topErrors = Object.entries(groups)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2)
            .map(([msg, count]) => `${msg} (${count})`)
            .join(', ');

        return topErrors + (Object.keys(groups).length > 2 ? ', ...' : '');
    };

    // Preview Mutation - validates data and returns preview without saving
    const previewMutation = useMutation({
        mutationFn: async () => {
            if (!selectedFile || !importResult) throw new Error("No file");

            setImportProgress({ status: 'processing', message: 'Analyzing data...', progress: 20 });

            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('columnMapping', JSON.stringify(columnMapping));
            formData.append('fixedValues', JSON.stringify(fixedValues));
            formData.append('mcNumberId', selectedMcNumberId);
            formData.append('updateExisting', updateExisting.toString());
            formData.append('previewOnly', 'true'); // KEY: Enable preview mode

            if (entityType === 'drivers' && updateExisting) {
                formData.append('importMode', 'upsert');
            }

            const endpoint = entityType === 'invoices' ? '/api/invoices/import' : `/api/import-export/${entityType}`;
            const res = await fetch(apiUrl(endpoint), { method: 'POST', body: formData });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error?.message || 'Preview failed');

            setImportProgress({ status: 'idle', message: '', progress: 0 });
            return data;
        },
        onSuccess: (data) => {
            if (data.preview && data.data) {
                setPreviewData(data.data);
                setActiveStep(3); // Move to preview step
                toast.success(`Preview ready: ${data.data.validCount} valid, ${data.data.warningCount} warnings, ${data.data.invalidCount} errors`);
            } else {
                toast.error('Invalid preview response');
            }
        },
        onError: (err: any) => {
            setImportProgress({ status: 'error', message: err.message, progress: 0 });
            toast.error(err.message);
        }
    });

    // Import Mutation (Chunked)
    const importMutation = useMutation({
        mutationFn: async () => {
            if (!selectedFile || !importResult?.data) throw new Error("No data");

            setImportProgress({ status: 'uploading', message: 'Starting import...', progress: 0 });
            setImportDetails(null);
            setLogs([]); // Clear logs

            const BATCH_SIZE = 500;
            const totalRows = importResult.data.length;
            const chunks = [];
            for (let i = 0; i < totalRows; i += BATCH_SIZE) {
                chunks.push(importResult.data.slice(i, i + BATCH_SIZE));
            }

            let totalCreated = 0;
            let totalUpdated = 0;
            let totalErrors = 0;
            const allCreatedItems: any[] = [];
            const allErrorItems: any[] = [];

            setLogs(prev => [...prev, `Starting import of ${totalRows} rows in ${chunks.length} batches...`]);

            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                const batchNum = i + 1;

                setImportProgress({
                    status: 'processing',
                    message: `Processing batch ${batchNum}/${chunks.length}...`,
                    progress: Math.round(((i) / chunks.length) * 100)
                });

                try {
                    const res = await fetch(apiUrl(entityType === 'invoices' ? '/api/invoices/import' : `/api/import-export/${entityType}`), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            data: chunk,
                            columnMapping,
                            fixedValues,
                            mcNumberId: selectedMcNumberId,
                            updateExisting,
                            importMode: (entityType === 'drivers' && updateExisting) ? 'upsert' : undefined,
                            currentMcNumber: selectedMcNumberId // Legacy support
                        })
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

                    if (summary.details?.created) allCreatedItems.push(...summary.details.created);
                    if (summary.details?.errors) {
                        // Adjust row numbers to match global index
                        const batchErrors = summary.details.errors.map((e: any) => ({
                            ...e,
                            row: e.row === 0 ? 0 : e.row + (i * BATCH_SIZE) // Approximate row adjustment if 0 not returned
                        }));
                        allErrorItems.push(...batchErrors);
                    }

                    setLogs(prev => [...prev, `✅ Batch ${batchNum}: ${created} created, ${updated} updated, ${errors} errors`]);

                } catch (err: any) {
                    setLogs(prev => [...prev, `❌ Batch ${batchNum} Failed: ${err.message}`]);
                    // Don't stop entire import, just log error? Or throw?
                    // Usually better to fail fast on network errors, but continue on data errors.
                    // If fetch failed (network), we might want to stop or retry.
                    // For now, we log and continue, but mark as error count?
                    totalErrors += chunk.length;
                    allErrorItems.push({ row: i * BATCH_SIZE, field: 'BATCH', error: `Batch failed: ${err.message}` });
                }
            }

            setImportProgress({
                status: 'complete',
                message: `Complete: ${totalCreated} created, ${totalUpdated} updated, ${totalErrors} errors`,
                progress: 100,
                created: totalCreated,
                updated: totalUpdated,
                errors: totalErrors
            });

            setImportDetails({
                created: allCreatedItems,
                errors: allErrorItems,
                createdCount: totalCreated,
                updatedCount: totalUpdated,
                errorsCount: totalErrors
            });

            setLogs(prev => [...prev, `🏁 Import Complete!`]);

            return { createdCount: totalCreated, updatedCount: totalUpdated, errorsCount: totalErrors, errorItems: allErrorItems, createdItems: allCreatedItems };
        },
        onSuccess: (data) => {
            const { createdCount, updatedCount, errorsCount, errorItems, createdItems } = data;

            if (createdCount > 0 || updatedCount > 0) {
                const action = updatedCount > 0 ? (createdCount > 0 ? 'Imported & Updated' : 'Updated') : 'Imported';
                if (errorsCount > 0) {
                    toast.warning(`${action} some records with ${errorsCount} errors.`);
                } else {
                    toast.success(`${action} all records successfully.`);
                    if (onImportComplete) onImportComplete(createdItems);
                    // if (onClose) setTimeout(onClose, 2000); // Keep open to show logs
                }
            } else {
                toast.error(`Import failed. ${errorsCount} errors found.`);
            }
        },
        onError: (err: any) => {
            setImportProgress({ status: 'error', message: err.message, progress: 0 });
            toast.error(err.message);
        }
    });

    // AI Mapping Mutation
    const aiMappingMutation = useMutation({
        mutationFn: async () => {
            if (!importResult?.data?.[0]) throw new Error("No data to map");

            const headers = Object.keys(importResult.data[0]);

            const res = await fetch(apiUrl('/api/import-export/ai-mapping'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ headers, entityType })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'AI Mapping failed');

            return data.mapping;
        },
        onSuccess: (newMapping) => {
            if (newMapping && Object.keys(newMapping).length > 0) {
                // Merge with existing, AI takes precedence or maybe just fill missing?
                // Let's overwrite for now as user explicitly asked for AI help
                // But maybe keep user manual selections? 
                // "Auto-Map" usually implies "Do it for me".
                setColumnMapping(prev => ({ ...prev, ...newMapping }));
                toast.success(`AI mapped ${Object.keys(newMapping).length} columns`);
            } else {
                toast.info('AI could not find any confident mappings');
            }
        },
        onError: (err: any) => {
            toast.error(err.message);
        }
    });

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Content */}
            <ScrollArea className="flex-1 px-6 py-6">
                <div className="space-y-8 pb-20">

                    {/* Step 1: Upload */}
                    <section className={`space-y-4 transition-opacity ${activeStep !== 1 && 'opacity-60 hover:opacity-100'}`}>
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold flex items-center gap-2">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${activeStep === 1 ? 'bg-primary text-primary-foreground border-primary' : (selectedFile ? 'bg-green-500 text-white border-green-500' : 'bg-muted')
                                    }`}>
                                    {selectedFile ? <CheckCircle2 className="w-3 h-3" /> : '1'}
                                </span>
                                Select File
                            </h3>
                            {selectedFile && activeStep !== 1 && (
                                <Button variant="ghost" size="sm" onClick={() => setActiveStep(1)} className="h-6 text-xs">Edit</Button>
                            )}
                        </div>

                        {(activeStep === 1 || !selectedFile) && (
                            <div className="space-y-4 ml-8">
                                {/* Template Download Link */}
                                <div className="flex justify-end">
                                    <Button variant="link" size="sm" className="text-xs h-auto p-0 text-muted-foreground hover:text-primary flex items-center gap-1" onClick={handleDownloadTemplate}>
                                        <Download className="w-3 h-3" />
                                        Download CSV Template
                                    </Button>
                                </div>

                                {/* MC Selection */}
                                <div className="space-y-1">
                                    <Label className="text-xs">Assign to MC Number (Applies to all rows if not in file)</Label>
                                    <McNumberSelector
                                        value={selectedMcNumberId}
                                        onValueChange={setSelectedMcNumberId}
                                        className="w-full"
                                    />
                                </div>

                                {!selectedFile ? (
                                    <div
                                        className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 cursor-pointer transition-colors"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                        <p className="text-sm font-medium">Click to upload CSV or Excel</p>
                                        <p className="text-xs text-muted-foreground mt-1">or drag and drop</p>
                                        <input ref={fileInputRef} type="file" className="hidden" accept=".csv,.xlsx,.xls" onChange={handleFileSelect} />
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                                        <div className="flex items-center gap-3">
                                            <FileText className="w-5 h-5 text-primary" />
                                            <div>
                                                <p className="text-sm font-medium">{selectedFile.name}</p>
                                                <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={handleReset} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}

                                {/* Update Existing Option (Drivers & Loads & Assets) */}
                                {(entityType === 'drivers' || entityType === 'loads' || entityType === 'trucks' || entityType === 'trailers') && selectedFile && (
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
                                                If checked, drivers with matching emails/IDs will be updated.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {selectedFile && (
                                    <div className="flex justify-end pt-2">
                                        <Button
                                            onClick={() => setActiveStep(2)}
                                            className="gap-2"
                                            disabled={!importResult || isProcessing}
                                        >
                                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Next Step'}
                                            {!isProcessing && <ArrowRight className="w-4 h-4 ml-2" />}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>

                    {/* AI Advisor Section */}
                    {selectedFile && (analyzeFileMutation.isPending || aiAnalysis) && activeStep === 1 && (
                        <section className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900 rounded-lg p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-full shrink-0">
                                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-sm text-indigo-900 dark:text-indigo-100">AI Import Advisor</h4>
                                        {aiAnalysis?.confidence && (
                                            <Badge variant="secondary" className="text-[10px] bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
                                                {aiAnalysis.confidence} Confidence
                                            </Badge>
                                        )}
                                    </div>

                                    {analyzeFileMutation.isPending ? (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            Analyzing file structure and data quality...
                                        </div>
                                    ) : aiAnalysis ? (
                                        <>
                                            <p className="text-sm text-indigo-800 dark:text-indigo-200 leading-relaxed">
                                                {aiAnalysis.summary}
                                            </p>

                                            {aiAnalysis.tips && aiAnalysis.tips.length > 0 && (
                                                <div className="bg-white/50 dark:bg-black/20 rounded p-3 text-xs space-y-1.5">
                                                    {aiAnalysis.tips.map((tip, idx) => (
                                                        <div key={idx} className="flex gap-2">
                                                            <span className="text-indigo-500">•</span>
                                                            <span className="text-indigo-900 dark:text-indigo-100">{tip}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    ) : null}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Step 2: Mapping */}
                    {selectedFile && importResult && (
                        <section className={`space-y-4 transition-opacity ${activeStep !== 2 && 'opacity-60 hover:opacity-100'}`}>
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${activeStep === 2 ? 'bg-primary text-primary-foreground border-primary' : (activeStep > 2 ? 'bg-green-500 text-white border-green-500' : 'bg-muted')
                                        }`}>
                                        {activeStep > 2 ? <CheckCircle2 className="w-3 h-3" /> : '2'}
                                    </span>
                                    Field Mapping
                                </h3>
                                {activeStep !== 2 && (
                                    <Button variant="ghost" size="sm" onClick={() => setActiveStep(2)} className="h-6 text-xs">Edit</Button>
                                )}
                            </div>

                            {activeStep === 2 && (
                                <div className="space-y-4 ml-8">
                                    {/* Saved Mappings & AI Toolbar */}
                                    <div className="flex items-center justify-between gap-2">
                                        {/* Saved Mappings Selector */}
                                        <div className="flex-1 min-w-0">
                                            <Select onValueChange={handleLoadMapping}>
                                                <SelectTrigger className="h-8 text-xs w-full">
                                                    <SelectValue placeholder="Load Saved Mapping..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none" disabled className="text-muted-foreground text-xs">select a profile...</SelectItem>
                                                    {savedMappings?.map(m => (
                                                        <SelectItem key={m.id} value={m.id} className="text-xs">{m.name}</SelectItem>
                                                    ))}
                                                    {(!savedMappings || savedMappings.length === 0) && (
                                                        <div className="p-2 text-xs text-muted-foreground text-center">No saved profiles</div>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Save Current Mapping */}
                                        <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm" className="h-8 px-2 text-xs gap-1" disabled={Object.keys(columnMapping).length === 0}>
                                                    <Save className="w-3 h-3" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[425px]">
                                                <DialogHeader>
                                                    <DialogTitle>Save Mapping Profile</DialogTitle>
                                                    <DialogDescription>
                                                        Save your current column configuration to reuse later.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="grid gap-4 py-4">
                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                        <Label htmlFor="name" className="text-right">
                                                            Name
                                                        </Label>
                                                        <Input
                                                            id="name"
                                                            value={mappingName}
                                                            onChange={(e) => setMappingName(e.target.value)}
                                                            className="col-span-3"
                                                            placeholder="e.g., TQL Load Sheet"
                                                        />
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button onClick={() => saveMappingMutation.mutate(mappingName)} disabled={!mappingName}>Save Profile</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>

                                        {/* AI Auto-Map Button */}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:text-indigo-400 dark:border-indigo-800 dark:hover:bg-indigo-950/30"
                                            onClick={() => aiMappingMutation.mutate()}
                                            disabled={aiMappingMutation.isPending}
                                        >
                                            {aiMappingMutation.isPending ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <Sparkles className="w-3 h-3" />
                                            )}
                                            AI Auto-Map
                                        </Button>
                                    </div>
                                    {/* Alerts & Quick Actions */}
                                    {unmappedRequired.length > 0 && (
                                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md border border-yellow-200 dark:border-yellow-800 space-y-3">
                                            <div className="flex gap-2">
                                                <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                                        Missing Required Fields
                                                    </p>
                                                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                                                        The following fields are required. You can map them below to a column, or set a default value.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid gap-2 pl-6">
                                                {unmappedRequired.map(f => {
                                                    const formattedName = f.fieldName.replace(/([A-Z])/g, ' $1').trim();
                                                    let defaultValue = 'N/A';
                                                    let label = 'Use "N/A"';

                                                    if (f.fieldType === 'Int' || f.fieldType === 'Float') {
                                                        defaultValue = '0';
                                                        label = 'Use 0';
                                                    } else if (f.fieldType === 'Boolean') {
                                                        defaultValue = 'false';
                                                        label = 'Use False';
                                                    } else if (f.fieldType === 'DateTime') {
                                                        defaultValue = new Date().toISOString();
                                                        label = 'Use Current Time';
                                                    }

                                                    return (
                                                        <div key={f.fieldName} className="flex items-center justify-between bg-yellow-100/50 dark:bg-yellow-900/30 p-2 rounded border border-yellow-200/50 dark:border-yellow-700/30">
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-semibold text-yellow-900 dark:text-yellow-100">{formattedName}</span>
                                                                <span className="text-[10px] text-yellow-700 dark:text-yellow-300">Type: {f.fieldType}</span>
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-7 text-xs bg-background hover:bg-muted border-yellow-300 dark:border-yellow-700"
                                                                onClick={() => {
                                                                    setFixedValues(prev => ({ ...prev, [f.fieldName]: defaultValue }));
                                                                }}
                                                            >
                                                                {label}
                                                            </Button>
                                                        </div>
                                                    );
                                                })}

                                                {unmappedRequired.length > 1 && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 text-xs w-full mt-1 hover:bg-yellow-200/50 dark:hover:bg-yellow-800/30 text-yellow-800 dark:text-yellow-200"
                                                        onClick={() => {
                                                            const updates: Record<string, string> = {};
                                                            unmappedRequired.forEach(f => {
                                                                if (f.fieldType === 'Int' || f.fieldType === 'Float') updates[f.fieldName] = '0';
                                                                else if (f.fieldType === 'Boolean') updates[f.fieldName] = 'false';
                                                                else if (f.fieldType === 'DateTime') updates[f.fieldName] = new Date().toISOString();
                                                                else updates[f.fieldName] = 'N/A';
                                                            });
                                                            setFixedValues(prev => ({ ...prev, ...updates }));
                                                        }}
                                                    >
                                                        Set Defaults for All Missing Fields
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Mapping List */}
                                    <div className="border rounded-md divide-y max-h-[400px] overflow-y-auto">
                                        {Object.keys(importResult.data[0]).map((header) => {
                                            const mappedKey = columnMapping[header];
                                            const isMapped = !!mappedKey;

                                            // Check for suggestions for this header
                                            const normalizeSimple = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
                                            const normalizeAdvanced = (str: string) => {
                                                let s = str.toLowerCase().replace(/[^a-z0-9]/g, '');
                                                s = s.replace(/number/g, 'id').replace(/no/g, 'id').replace(/#/g, 'id');
                                                return s;
                                            };

                                            const suggestion = !isMapped
                                                ? unmappedRequired.find(f => {
                                                    const normHeader = normalizeSimple(header);
                                                    const normHeaderAdv = normalizeAdvanced(header);
                                                    const normField = normalizeSimple(f.fieldName);
                                                    const normFieldAdv = normalizeAdvanced(f.fieldName);

                                                    // 1. Exact/Advanced Match
                                                    if (normHeader === normField || normHeaderAdv === normFieldAdv) return true;

                                                    // 2. Suggestions list
                                                    const suggestions = f.suggestedCsvHeaders || [];
                                                    return suggestions.some(s => {
                                                        const ns = normalizeSimple(s);
                                                        return normHeader.includes(ns) || ns.includes(normHeader);
                                                    });
                                                })
                                                : undefined;

                                            // Determine row style based on suggestion
                                            const rowStyle = suggestion
                                                ? "bg-yellow-50/50 dark:bg-yellow-900/10 border-l-4 border-l-yellow-500"
                                                : "hover:bg-muted/50";

                                            return (
                                                <div key={header} className={`p-3 flex items-center justify-between gap-4 ${rowStyle}`}>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-medium truncate" title={header}>
                                                                {header}
                                                                {systemFields.find(f => f.key === mappedKey)?.required && (
                                                                    <span className="text-destructive ml-1">*</span>
                                                                )}
                                                            </p>
                                                            {suggestion && (
                                                                <Badge variant="outline" className="text-[10px] h-4 px-1 bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800">
                                                                    Recommended: {suggestion.fieldName.replace(/([A-Z])/g, ' $1').trim()}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            Sample: {String(importResult.data[0][header] || '').slice(0, 30)}
                                                        </p>
                                                    </div>
                                                    <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                                                    <div className="w-[180px] shrink-0">
                                                        <Select
                                                            value={mappedKey || 'ignore'}
                                                            onValueChange={(val) => {
                                                                setColumnMapping(prev => {
                                                                    const next = { ...prev };
                                                                    if (val === 'ignore') delete next[header];
                                                                    else next[header] = val;
                                                                    return next;
                                                                });
                                                            }}
                                                        >
                                                            <SelectTrigger className={`h-8 text-xs ${suggestion ? 'border-yellow-400 dark:border-yellow-600 ring-1 ring-yellow-400/20' : ''}`}>
                                                                <SelectValue placeholder={suggestion ? `Suggest: ${suggestion.fieldName.replace(/([A-Z])/g, ' $1').trim()}` : "Ignore Column"} />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="ignore" className="text-muted-foreground italic">Ignore Column</SelectItem>
                                                                {systemFields.map(field => {
                                                                    // Check if this field is currently unmapped and required
                                                                    const isMissingRequired = unmappedRequired.some(f => f.fieldName === field.key);

                                                                    return (
                                                                        <SelectItem key={field.key} value={field.key}>
                                                                            <div className="flex items-center justify-between w-full gap-2">
                                                                                <span className={isMissingRequired ? "font-medium text-destructive" : ""}>
                                                                                    {field.label}
                                                                                </span>
                                                                                {field.required && (
                                                                                    <Badge
                                                                                        variant="outline"
                                                                                        className={`text-[10px] h-4 px-1 ${isMissingRequired ? "bg-destructive text-destructive-foreground border-destructive" : "bg-destructive/10 text-destructive border-destructive/20"}`}
                                                                                    >
                                                                                        {isMissingRequired ? "MISSING" : "Required"}
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                        </SelectItem>
                                                                    );
                                                                })}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <Button
                                        className="w-full"
                                        onClick={() => previewMutation.mutate()}
                                        disabled={unmappedRequired.length > 0 || previewMutation.isPending}
                                    >
                                        {previewMutation.isPending ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Analyzing...
                                            </>
                                        ) : (
                                            `Preview Import (${importResult.data.length} rows)`
                                        )}
                                    </Button>
                                </div>
                            )}
                        </section>
                    )}

                    {/* Step 3: Preview (NEW) */}
                    {previewData && activeStep === 3 && (
                        <section className="space-y-4 animate-in fade-in duration-300">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs border bg-primary text-primary-foreground border-primary">
                                        3
                                    </span>
                                    Review Import Preview
                                </h3>
                            </div>

                            <div className="ml-8 space-y-4">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                                            {previewData.validCount}
                                        </p>
                                        <p className="text-xs text-green-600 dark:text-green-400 font-medium">Valid</p>
                                    </div>
                                    <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                        <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                                            {previewData.warningCount}
                                        </p>
                                        <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Warnings</p>
                                    </div>
                                    <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                                        <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                                            {previewData.invalidCount}
                                        </p>
                                        <p className="text-xs text-red-600 dark:text-red-400 font-medium">Will Skip</p>
                                    </div>
                                </div>

                                {/* Warnings (will import with issues) */}
                                {previewData.warnings.length > 0 && (
                                    <Accordion type="single" collapsible>
                                        <AccordionItem value="warnings">
                                            <AccordionTrigger className="text-sm py-2">
                                                <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                                                    <AlertTriangle className="w-4 h-4" />
                                                    {previewData.warnings.length} Rows with Warnings
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <ScrollArea className="h-[150px] border rounded-md bg-yellow-50/50 dark:bg-yellow-950/10">
                                                    <div className="divide-y">
                                                        {previewData.warnings.slice(0, 20).map((w: any, idx: number) => (
                                                            <div key={idx} className="p-2 text-xs">
                                                                <Badge variant="outline" className="text-[10px] mr-2">Row {w.row}</Badge>
                                                                <span className="text-yellow-700 dark:text-yellow-400">{w.error}</span>
                                                            </div>
                                                        ))}
                                                        {previewData.warnings.length > 20 && (
                                                            <p className="p-2 text-xs text-muted-foreground">...and {previewData.warnings.length - 20} more</p>
                                                        )}
                                                    </div>
                                                </ScrollArea>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                )}

                                {/* Invalid rows (will be skipped) */}
                                {previewData.invalid.length > 0 && (
                                    <Accordion type="single" collapsible>
                                        <AccordionItem value="invalid">
                                            <AccordionTrigger className="text-sm py-2">
                                                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                                                    <AlertCircle className="w-4 h-4" />
                                                    {previewData.invalid.length} Rows Will Be Skipped
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <ScrollArea className="h-[150px] border rounded-md bg-red-50/50 dark:bg-red-950/10">
                                                    <div className="divide-y">
                                                        {previewData.invalid.slice(0, 20).map((e: any, idx: number) => (
                                                            <div key={idx} className="p-2 text-xs">
                                                                <Badge variant="outline" className="text-[10px] mr-2">Row {e.row}</Badge>
                                                                <span className="font-medium">{e.field}:</span>{' '}
                                                                <span className="text-red-600 dark:text-red-400">{e.error}</span>
                                                            </div>
                                                        ))}
                                                        {previewData.invalid.length > 20 && (
                                                            <p className="p-2 text-xs text-muted-foreground">...and {previewData.invalid.length - 20} more</p>
                                                        )}
                                                    </div>
                                                </ScrollArea>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-2 pt-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => {
                                            setPreviewData(null);
                                            setActiveStep(2);
                                        }}
                                    >
                                        <X className="w-4 h-4 mr-2" />
                                        Cancel
                                    </Button>
                                    <Button
                                        className="flex-1"
                                        onClick={() => importMutation.mutate()}
                                        disabled={importMutation.isPending || previewData.validCount === 0}
                                    >
                                        {importMutation.isPending ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Importing...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                                Approve & Import ({previewData.validCount})
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Step 4: Results (Enhanced) */}
                    {importDetails && (
                        <section className="space-y-4 animate-in fade-in duration-300">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${importDetails.errors.length === 0 ? 'bg-green-500 border-green-500 text-white' : 'bg-orange-500 border-orange-500 text-white'
                                        }`}>
                                        <CheckCircle2 className="w-3 h-3" />
                                    </span>
                                    Import Results
                                </h3>
                            </div>

                            <div className="ml-8 space-y-4">
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                                            {(importDetails.createdCount ?? 0) + (importDetails.updatedCount ?? 0)}
                                        </p>
                                        <p className="text-xs text-green-600 dark:text-green-400 font-medium">Synced</p>
                                    </div>
                                    <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                                        <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                                            {importDetails.errorsCount ?? importDetails.errors.length}
                                        </p>
                                        <p className="text-xs text-red-600 dark:text-red-400 font-medium">Failed</p>
                                    </div>
                                    <div className="p-3 bg-muted border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/80" onClick={() => {
                                        if (importDetails.errors.length > 0) {
                                            const errorText = importDetails.errors.map(e => `Row ${e.row} [${e.field}]: ${e.error}`).join('\n');
                                            navigator.clipboard.writeText(errorText);
                                            toast.success('Error log copied to clipboard');
                                        }
                                    }}>
                                        <Copy className="w-5 h-5 mb-1 text-muted-foreground" />
                                        <p className="text-xs text-muted-foreground">Copy Log</p>
                                    </div>
                                </div>

                                {importDetails.errors.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium flex items-center gap-2 text-red-700 dark:text-red-400">
                                            <AlertTriangle className="w-4 h-4" />
                                            Error Log
                                        </h4>
                                        <ScrollArea className="h-[250px] border rounded-md bg-white dark:bg-gray-950">
                                            <div className="divide-y">
                                                {importDetails.errors.map((error, idx) => (
                                                    <div key={idx} className="p-3 text-sm hover:bg-muted/50">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Badge variant="outline" className="text-[10px] h-4 px-1">
                                                                Row {error.row}
                                                            </Badge>
                                                            <span className="font-semibold text-xs text-muted-foreground">
                                                                {error.field}
                                                            </span>
                                                        </div>
                                                        <p className="text-red-600 dark:text-red-400 text-xs">
                                                            {error.error}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                )}

                                {importDetails.errors.length === 0 && (
                                    <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg flex items-center gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                                        <p className="text-sm text-green-700 dark:text-green-300">
                                            Success! All records were imported without errors.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Log Console (Moved to outer scope) */}

                </div>
            </ScrollArea>

            {/* Log Console (Pinned to bottom) */}
            {(importProgress.status !== 'idle' || logs.length > 0) && !importDetails && (
                <div className="border-t shadow-lg flex flex-col max-h-[200px] shrink-0">
                    {/* Header / Progress Bar */}
                    <div className="px-4 py-2 bg-muted/50 border-b flex items-center justify-between">
                        <span className="text-xs font-semibold flex items-center gap-2">
                            {importProgress.status === 'processing' && <Loader2 className="w-3 h-3 animate-spin" />}
                            {importProgress.message}
                        </span>
                        <span className="text-xs font-mono">{importProgress.progress}%</span>
                    </div>
                    <Progress value={importProgress.progress} className="h-1 rounded-none" />

                    {/* Logs Area */}
                    <div className="flex-1 p-4 overflow-y-auto bg-black text-green-400 font-mono text-xs space-y-1 h-32">
                        {logs.map((log, i) => (
                            <div key={i}>{log}</div>
                        ))}
                        <div ref={logsEndRef} />
                    </div>
                </div>
            )}
        </div>
    );
}

'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, AlertCircle, CheckCircle2, X, Loader2, Settings2, Trash2, ArrowRight } from 'lucide-react';
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
import ImportFieldWarnings from './ImportFieldWarnings';

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

    const [importProgress, setImportProgress] = useState<{
        status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
        message: string;
        progress: number;
        created?: number;
        errors?: number;
    }>({
        status: 'idle',
        message: '',
        progress: 0,
    });

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
                setActiveStep(2); // Move to mapping step automatically
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
        // Do NOT reset MC Number as user likely wants to keep it
        if (fileInputRef.current) fileInputRef.current.value = '';
        setSelectedMcNumberId(''); // Reset this too to avoid stale state
    };

    // Import Mutation
    const importMutation = useMutation({
        mutationFn: async () => {
            if (!selectedFile || !importResult) throw new Error("No file");

            setImportProgress({ status: 'uploading', message: 'Uploading...', progress: 10 });

            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('columnMapping', JSON.stringify(columnMapping));
            formData.append('fixedValues', JSON.stringify(fixedValues));
            formData.append('mcNumberId', selectedMcNumberId);
            formData.append('updateExisting', updateExisting.toString());

            // Handle updateExisting logic for drivers
            if (entityType === 'drivers' && updateExisting) {
                formData.append('importMode', 'upsert');
            }

            setImportProgress({ status: 'processing', message: 'Processing...', progress: 30 });

            const endpoint = entityType === 'invoices' ? '/api/invoices/import' : `/api/import-export/${entityType}`;

            // Simulation of progress for better UX
            const progressInterval = setInterval(() => {
                setImportProgress(prev => {
                    if (prev.progress >= 90) return prev;
                    return { ...prev, progress: prev.progress + 5 };
                });
            }, 500);

            try {
                const res = await fetch(apiUrl(endpoint), { method: 'POST', body: formData });
                clearInterval(progressInterval);

                const data = await res.json();
                if (!res.ok) throw new Error(data.error?.message || 'Import failed');

                // Fix: Handle nested response structure
                const createdCount = data.data?.created ?? data.data?.details?.created?.length ?? 0;
                const errorsCount = data.data?.errors ?? data.data?.details?.errors?.length ?? 0;
                const createdItems = data.data?.details?.created ?? (Array.isArray(data.data?.created) ? data.data.created : []);

                setImportProgress({
                    status: 'complete',
                    message: `Complete: ${createdCount} created, ${errorsCount} errors`,
                    progress: 100,
                    created: createdCount,
                    errors: errorsCount
                });

                return data;
            } catch (err) {
                clearInterval(progressInterval);
                throw err;
            }
        },
        onSuccess: (data) => {
            const createdItems = data.data?.details?.created ?? (Array.isArray(data.data?.created) ? data.data.created : []);
            const createdCount = data.data?.created ?? data.data?.details?.created?.length ?? 0;
            const errorsCount = data.data?.errors ?? data.data?.details?.errors?.length ?? 0;

            if (createdCount > 0) {
                toast.success(`Imported ${createdCount} records`);
                if (onImportComplete) onImportComplete(createdItems);
                if (errorsCount === 0 && onClose) {
                    setTimeout(onClose, 1500);
                }
            } else {
                toast.warning(`No records created. ${errorsCount} errors found.`);
            }
        },
        onError: (err: any) => {
            setImportProgress({ status: 'error', message: err.message, progress: 0 });
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

                                {/* Update Existing Option (Drivers only) */}
                                {entityType === 'drivers' && selectedFile && (
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

                                {selectedFile && importResult && (
                                    <Button className="w-full" onClick={() => setActiveStep(2)}>
                                        Next: Map Columns <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                )}
                            </div>
                        )}
                    </section>

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
                                        onClick={() => importMutation.mutate()}
                                        disabled={unmappedRequired.length > 0 || importMutation.isPending}
                                    >
                                        {importMutation.isPending ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Importing...
                                            </>
                                        ) : (
                                            `Start Import (${importResult.data.length} rows)`
                                        )}
                                    </Button>
                                </div>
                            )}
                        </section>
                    )}

                    {/* Progress Status */}
                    {importProgress.status !== 'idle' && (
                        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className={importProgress.status === 'error' ? 'text-destructive' : 'text-muted-foreground'}>
                                        {importProgress.message}
                                    </span>
                                    <span>{importProgress.progress}%</span>
                                </div>
                                <Progress
                                    value={importProgress.progress}
                                    className={`h-2 ${importProgress.status === 'error' ? '[&>div]:bg-destructive' : ''}`}
                                />
                            </div>
                        </div>
                    )}

                </div>
            </ScrollArea>
        </div>
    );
}

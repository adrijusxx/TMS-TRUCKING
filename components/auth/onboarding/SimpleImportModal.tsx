'use client';

import { useState, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, X, FileSpreadsheet, AlertCircle, CheckCircle2, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { ImportEntity } from '@/lib/validations/onboarding';
import { ColumnMapper, applyMapping, ENTITY_FIELDS } from './ColumnMapper';
import * as XLSX from 'xlsx';

interface SimpleImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    entityType: ImportEntity;
    onImport: (data: any[], options?: { updateExisting: boolean }) => void;
}

// Duplicate detection configuration per entity type
const DUPLICATE_KEYS: Record<string, string[]> = {
    drivers: ['email', 'firstName+lastName'], // Check email OR full name
    trucks: ['truckNumber', 'vin'],
    trailers: ['trailerNumber', 'vin'],
    customers: ['name', 'email'],
    loads: ['loadNumber'],
    invoices: ['invoiceNumber'],
    settlements: ['settlementNumber'],
};

// Helper to detect duplicates in mapped data
function detectDuplicates(data: any[], entityType: string): { duplicates: Set<number>; warnings: string[] } {
    const keys = DUPLICATE_KEYS[entityType] || [];
    const duplicates = new Set<number>();
    const warnings: string[] = [];
    const seen: Record<string, number[]> = {};

    data.forEach((row, index) => {
        for (const keyPattern of keys) {
            let value: string;
            if (keyPattern.includes('+')) {
                // Composite key (e.g., firstName+lastName)
                const parts = keyPattern.split('+');
                value = parts.map(p => (row[p] || '').toString().toLowerCase().trim()).join('|');
            } else {
                value = (row[keyPattern] || '').toString().toLowerCase().trim();
            }

            if (value && value !== '' && value !== '|') {
                const cacheKey = `${keyPattern}:${value}`;
                if (!seen[cacheKey]) {
                    seen[cacheKey] = [];
                }
                seen[cacheKey].push(index);
            }
        }
    });

    // Find duplicates
    for (const [key, indices] of Object.entries(seen)) {
        if (indices.length > 1) {
            indices.forEach(i => duplicates.add(i));
            const [keyName, value] = key.split(':');
            warnings.push(`Duplicate ${keyName.replace('+', ' + ')}: "${value}" appears ${indices.length} times (rows ${indices.map(i => i + 1).join(', ')})`);
        }
    }

    return { duplicates, warnings };
}

// Sample templates for download
const TEMPLATES: Record<ImportEntity, string> = {
    drivers: 'firstName,lastName,email,phone,licenseNumber,licenseState,licenseExpiry,medicalCardExpiry,payRate\nJohn,Doe,john@example.com,555-0101,CDL123456,TX,2025-01-01,2025-01-01,0.55',
    trucks: 'truckNumber,vin,make,model,year,licensePlate,state,equipmentType,odometerReading,registrationExpiry,inspectionExpiry\n101,1M8GDM9A,Freightliner,Cascadia,2022,P12345,TX,DRY_VAN,150000,2025-12-31,2025-12-31',
    trailers: 'trailerNumber,vin,make,model,year,licensePlate,state,type,registrationExpiry,inspectionExpiry\n5301,1TRAILER,Wabash,53FT,2021,T54321,TX,DRY_VAN,2025-12-31,2025-12-31',
    customers: 'name,email,phone,address,city,state,zip\nAcme Brokers,brokers@acme.com,555-9999,123 Main St,Dallas,TX,75001',
    loads: 'loadNumber,customerRef,rate,originCity,originState,destCity,destState,pickupDate,deliveryDate\nL-1001,REF-555,1500,Dallas,TX,Chicago,IL,2024-02-01,2024-02-03',
    invoices: 'invoiceNumber,loadNumber,amount,dueDate,status\nINV-1001,L-1001,1500,2024-03-01,Unpaid',
    settlements: 'settlementNumber,driverEmail,amount,date,status\nSET-101,john@example.com,1200,2024-02-15,Paid'
};

type ImportStep = 'upload' | 'mapping' | 'preview';

export function SimpleImportModal({ isOpen, onClose, entityType, onImport }: SimpleImportModalProps) {
    const [step, setStep] = useState<ImportStep>('upload');
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [rawData, setRawData] = useState<any[]>([]);
    const [mappedData, setMappedData] = useState<any[]>([]);
    const [sourceColumns, setSourceColumns] = useState<string[]>([]);
    const [updateExisting, setUpdateExisting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Detect duplicates whenever mappedData changes
    const { duplicates, warnings: duplicateWarnings } = useMemo(() => {
        if (mappedData.length === 0) return { duplicates: new Set<number>(), warnings: [] };
        return detectDuplicates(mappedData, entityType);
    }, [mappedData, entityType]);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const parseFile = async (file: File) => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer);
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);

            if (jsonData.length === 0) {
                throw new Error('File appears to be empty');
            }

            // Extract column headers from first row
            const columns = Object.keys(jsonData[0] as object);

            setRawData(jsonData);
            setSourceColumns(columns);
            setError(null);
            setStep('mapping'); // Go to mapping step
        } catch (err) {
            console.error(err);
            setError('Failed to parse file. Please ensure valid CSV or Excel format.');
            setRawData([]);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            const ext = droppedFile.name.split('.').pop()?.toLowerCase();

            if (['csv', 'xlsx', 'xls'].includes(ext || '')) {
                setFile(droppedFile);
                parseFile(droppedFile);
            } else {
                setError('Please upload a CSV or Excel file');
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            parseFile(selectedFile);
        }
    };

    const handleMappingComplete = (mapping: Record<string, string>) => {
        const mapped = applyMapping(rawData, mapping);
        setMappedData(mapped);
        setStep('preview');
    };

    const handleSave = () => {
        if (mappedData.length > 0) {
            onImport(mappedData, { updateExisting });
            onClose();
            resetState();
        }
    };

    const resetState = () => {
        setStep('upload');
        setFile(null);
        setRawData([]);
        setMappedData([]);
        setSourceColumns([]);
        setUpdateExisting(false);
        setError(null);
    };

    const handleBack = () => {
        if (step === 'mapping') {
            setStep('upload');
        } else if (step === 'preview') {
            setStep('mapping');
        }
    };

    const downloadTemplate = () => {
        try {
            const templateData = TEMPLATES[entityType];
            const headers = templateData.split('\n')[0].split(',');
            const example = templateData.split('\n')[1].split(',');

            const rowObj: any = {};
            headers.forEach((h, i) => rowObj[h] = example[i] || '');

            const ws = XLSX.utils.json_to_sheet([rowObj]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Template");

            XLSX.writeFile(wb, `${entityType}_template.xlsx`);
        } catch (err) {
            console.error('Error generating template:', err);
        }
    };

    // Get expected field labels for preview
    const expectedFields = ENTITY_FIELDS[entityType] || [];
    const previewFields = expectedFields.slice(0, 4).map(f => f.key);

    return (
        <Dialog open={isOpen} onOpenChange={() => { onClose(); resetState(); }}>
            <DialogContent className="sm:max-w-lg bg-slate-900 border-slate-800 text-slate-100">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold capitalize flex items-center gap-2">
                        {step !== 'upload' && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleBack}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        )}
                        Import {entityType}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        {step === 'upload' && 'Upload CSV or Excel file to import your data.'}
                        {step === 'mapping' && 'Map your file columns to our expected fields.'}
                        {step === 'preview' && 'Review your mapped data before importing.'}
                    </DialogDescription>
                </DialogHeader>

                {/* Step 1: Upload */}
                {step === 'upload' && (
                    <div className="space-y-4 py-4">
                        <div className="flex justify-end">
                            <Button variant="outline" size="sm" onClick={downloadTemplate} className="text-xs border-slate-700 text-slate-300 hover:bg-slate-800">
                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                Download Template
                            </Button>
                        </div>

                        <div
                            className={`
                relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                ${dragActive ? 'border-purple-500 bg-purple-500/10' : 'border-slate-700 hover:border-slate-600 bg-slate-900/50'}
                ${error ? 'border-red-500/50 bg-red-500/5' : ''}
              `}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => inputRef.current?.click()}
                        >
                            <input
                                ref={inputRef}
                                type="file"
                                className="hidden"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleChange}
                            />

                            <div className="space-y-2">
                                <Upload className="mx-auto h-10 w-10 text-slate-500" />
                                <p className="text-sm text-slate-300">
                                    Drag & drop or <span className="text-purple-400 font-medium">click to browse</span>
                                </p>
                                <p className="text-xs text-slate-500">Supports CSV, XLSX, XLS</p>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-md bg-red-500/10 text-red-400 text-sm">
                                <AlertCircle className="h-4 w-4" />
                                {error}
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2: Column Mapping */}
                {step === 'mapping' && (
                    <div className="py-4">
                        <ColumnMapper
                            entityType={entityType}
                            sourceColumns={sourceColumns}
                            onMappingComplete={handleMappingComplete}
                            onCancel={() => setStep('upload')}
                        />
                    </div>
                )}

                {/* Step 3: Preview */}
                {step === 'preview' && (
                    <div className="space-y-4 py-4">
                        <div className="flex items-center gap-2 text-sm text-green-400">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>{mappedData.length} records ready to import</span>
                        </div>

                        <div className="flex items-start space-x-2 p-3 rounded-md bg-slate-800/50 border border-slate-700">
                            <Checkbox
                                id="update-existing-modal"
                                checked={updateExisting}
                                onCheckedChange={(checked) => setUpdateExisting(checked === true)}
                                className="mt-1 border-slate-600"
                            />
                            <div className="grid gap-1.5 leading-none">
                                <label
                                    htmlFor="update-existing-modal"
                                    className="text-sm font-medium leading-none text-slate-200"
                                >
                                    Update existing records
                                </label>
                                <p className="text-xs text-slate-400">
                                    Merge data with existing records instead of creating duplicates.
                                </p>
                            </div>
                        </div>

                        {/* Duplicate Warnings */}
                        {duplicateWarnings.length > 0 && (
                            <div className="space-y-2 p-3 rounded-md bg-yellow-500/10 border border-yellow-500/30">
                                <div className="flex items-center gap-2 text-sm text-yellow-400 font-medium">
                                    <AlertTriangle className="h-4 w-4" />
                                    <span>Potential Duplicates Detected</span>
                                </div>
                                <ul className="text-xs text-yellow-300/80 space-y-1 ml-6 list-disc">
                                    {duplicateWarnings.slice(0, 5).map((warning, i) => (
                                        <li key={i}>{warning}</li>
                                    ))}
                                    {duplicateWarnings.length > 5 && (
                                        <li className="text-yellow-400">+ {duplicateWarnings.length - 5} more...</li>
                                    )}
                                </ul>
                                <p className="text-xs text-yellow-300/60 mt-2">
                                    You can still import, but duplicates may be skipped or cause errors.
                                </p>
                            </div>
                        )}

                        <div className="rounded-md border border-slate-700 bg-slate-800/50 max-h-[250px] overflow-y-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="text-slate-500 sticky top-0 bg-slate-900">
                                    <tr>
                                        <th className="p-2 w-8">#</th>
                                        {previewFields.map(field => (
                                            <th key={field} className="p-2 font-medium capitalize">{field}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="text-slate-300">
                                    {mappedData.slice(0, 10).map((row, i) => (
                                        <tr
                                            key={i}
                                            className={`border-t border-slate-700/50 ${duplicates.has(i) ? 'bg-yellow-500/10' : ''
                                                }`}
                                        >
                                            <td className="p-2 text-slate-500">
                                                {i + 1}
                                                {duplicates.has(i) && (
                                                    <AlertTriangle className="inline h-3 w-3 ml-1 text-yellow-400" />
                                                )}
                                            </td>
                                            {previewFields.map(field => (
                                                <td key={field} className="p-2 truncate max-w-[100px]">
                                                    {row[field] || '-'}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {mappedData.length > 10 && (
                                <div className="text-center text-xs text-slate-500 py-2 border-t border-slate-700/50">
                                    + {mappedData.length - 10} more records
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setStep('mapping')} className="text-slate-400">
                                Back to Mapping
                            </Button>
                            <Button
                                onClick={handleSave}
                                className="bg-purple-600 hover:bg-purple-500 text-white"
                            >
                                Import {mappedData.length} Records
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

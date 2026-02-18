'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import ColumnMappingDialog from './ColumnMappingDialog';
import { DataAlignmentConsole } from './DataAlignmentConsole';

interface ImportMatchingStepProps {
    selectedMcNumberId: string;
    setSelectedMcNumberId: (id: string) => void;
    mcNumbers: any[];
    updateExisting: boolean;
    setUpdateExisting: (val: boolean) => void;
    columnMapping: Record<string, string>;
    setColumnMapping: (mapping: Record<string, string>) => void;
    excelColumns: string[];
    deduplicatedFields: any[];
    onBack: () => void;
    onNext: () => void;
    isAiMapping?: boolean;
    entityType?: string;
    treatAsHistorical?: boolean;
    setTreatAsHistorical?: (val: boolean) => void;
}

export function ImportMatchingStep({
    selectedMcNumberId,
    setSelectedMcNumberId,
    mcNumbers,
    updateExisting,
    setUpdateExisting,
    columnMapping,
    setColumnMapping,
    excelColumns,
    deduplicatedFields,
    onBack,
    onNext,
    isAiMapping,
    entityType,
    treatAsHistorical,
    setTreatAsHistorical,
}: ImportMatchingStepProps) {
    const [showColumnMapping, setShowColumnMapping] = useState(false);

    const mappedFields = new Set(Object.values(columnMapping));
    const requiredFields = deduplicatedFields.filter((f) => f.required);
    const unmappedRequired = requiredFields.filter((f) => !mappedFields.has(f.key));

    return (
        <div className="space-y-6">
            <div>
                <Label htmlFor="mc-number" className="text-base font-semibold mb-2 block">
                    Select MC Number *
                </Label>
                <Select value={selectedMcNumberId} onValueChange={setSelectedMcNumberId}>
                    <SelectTrigger id="mc-number" className="w-full">
                        <SelectValue placeholder="Select an MC number" />
                    </SelectTrigger>
                    <SelectContent>
                        {mcNumbers.map((mc: any) => (
                            <SelectItem key={mc.mcNumberId} value={mc.mcNumberId}>
                                {mc.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

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
                        If checked, existing records with matching IDs/emails will be updated instead of skipped.
                    </p>
                </div>
            </div>

            {entityType === 'loads' && setTreatAsHistorical && (
                <div className="flex items-start space-x-2 pt-2">
                    <Checkbox
                        id="treat-historical"
                        checked={treatAsHistorical}
                        onCheckedChange={(checked) => setTreatAsHistorical(checked === true)}
                    />
                    <div className="grid gap-1.5 leading-none">
                        <label
                            htmlFor="treat-historical"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Treat as historical data (recommended)
                        </label>
                        <p className="text-xs text-muted-foreground">
                            All loads will be marked as fully completed (PAID). Uncheck only if importing loads that are still in progress.
                        </p>
                    </div>
                </div>
            )}

            <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Data Alignment Console</Label>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowColumnMapping(true)}
                    >
                        {Object.keys(columnMapping).length > 0
                            ? `${Object.keys(columnMapping).length} Mapped`
                            : 'Map Columns'}
                    </Button>
                </div>

                <DataAlignmentConsole
                    columnMapping={columnMapping}
                    isMapping={!!isAiMapping}
                    systemFields={deduplicatedFields}
                    excelColumns={excelColumns}
                />
            </div>

            {unmappedRequired.length > 0 && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                            {unmappedRequired.length} required field(s) need mapping: {unmappedRequired.map(f => f.label).join(', ')}
                        </span>
                    </div>
                </div>
            )}

            <div className="flex justify-end gap-2 pt-6">
                <Button variant="outline" onClick={onBack}>
                    Back
                </Button>
                <Button
                    onClick={onNext}
                    disabled={!selectedMcNumberId || unmappedRequired.length > 0}
                >
                    Next step
                </Button>
            </div>

            <ColumnMappingDialog
                open={showColumnMapping}
                onOpenChange={setShowColumnMapping}
                excelColumns={excelColumns}
                systemFields={deduplicatedFields}
                initialMapping={columnMapping}
                onMappingComplete={(mapping) => {
                    setColumnMapping(mapping);
                    setShowColumnMapping(false);
                }}
            />
        </div>
    );
}

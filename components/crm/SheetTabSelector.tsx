'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Layers } from 'lucide-react';
import type { SheetConfig } from '@/lib/utils/crm-config';

interface SheetTabSelectorProps {
    availableTabs: string[];
    selectedTabs: string[];
    onSelectionChange: (tabs: string[]) => void;
    isLoading: boolean;
    disabled: boolean;
    onLoadTabs: () => void;
    perSheetProgress?: Record<string, SheetConfig>;
}

export function SheetTabSelector({
    availableTabs,
    selectedTabs,
    onSelectionChange,
    isLoading,
    disabled,
    onLoadTabs,
    perSheetProgress,
}: SheetTabSelectorProps) {
    if (isLoading) {
        return (
            <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading sheet tabs...
            </div>
        );
    }

    // Fallback: comma-separated text input when tabs aren't loaded
    if (availableTabs.length === 0) {
        return (
            <div className="flex items-center gap-2">
                <Input
                    placeholder="Sheet1, Sheet2, ..."
                    value={selectedTabs.join(', ')}
                    onChange={(e) => {
                        const tabs = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                        onSelectionChange(tabs);
                    }}
                    disabled={disabled}
                />
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onLoadTabs}
                    disabled={disabled}
                    title="Load available sheet tabs"
                    className="shrink-0"
                >
                    <Layers className="h-4 w-4" />
                </Button>
            </div>
        );
    }

    const allSelected = availableTabs.length > 0 && availableTabs.every(t => selectedTabs.includes(t));

    function toggleTab(tab: string) {
        if (selectedTabs.includes(tab)) {
            onSelectionChange(selectedTabs.filter(t => t !== tab));
        } else {
            onSelectionChange([...selectedTabs, tab]);
        }
    }

    function toggleAll() {
        onSelectionChange(allSelected ? [] : [...availableTabs]);
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={toggleAll} disabled={disabled} className="h-6 px-2 text-xs">
                    {allSelected ? 'Deselect all' : 'Select all'}
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onLoadTabs}
                    disabled={disabled}
                    title="Refresh tabs"
                    className="h-6 px-2"
                >
                    <Layers className="h-3 w-3" />
                </Button>
            </div>
            <div className="max-h-40 overflow-y-auto rounded-md border p-2 space-y-1">
                {availableTabs.map((tab) => {
                    const progress = perSheetProgress?.[tab];
                    const rows = progress?.lastImportedRow || 0;
                    return (
                        <label
                            key={tab}
                            className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-muted/50 cursor-pointer text-sm"
                        >
                            <Checkbox
                                checked={selectedTabs.includes(tab)}
                                onCheckedChange={() => toggleTab(tab)}
                                disabled={disabled}
                            />
                            <span className="flex-1">{tab}</span>
                            {rows > 0 && (
                                <Badge variant="secondary" className="text-[10px] h-5">
                                    {rows} row{rows !== 1 ? 's' : ''}
                                </Badge>
                            )}
                        </label>
                    );
                })}
            </div>
        </div>
    );
}

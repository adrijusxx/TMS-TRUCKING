'use client';

import * as React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table as TableInstance } from '@tanstack/react-table';
import { ExtendedColumnDef } from './types';
import { useDebounce } from '@/hooks/useDebounce';
import { FilterSearchableSelect } from './FilterSearchableSelect';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DateRangeFilter } from './DateRangeFilter';

interface InlineFilterRowProps<TData extends Record<string, any>> {
    table: TableInstance<TData>;
    entityType?: string;
    hasRowActions?: boolean;
}

export function InlineFilterRow<TData extends Record<string, any>>({ table, entityType, hasRowActions }: InlineFilterRowProps<TData>) {
    return (
        <TableRow className="bg-muted/30 hover:bg-muted/30 border-b">
            {table.getVisibleLeafColumns().map((column) => {
                const columnDef = column.columnDef as ExtendedColumnDef<TData>;
                const filterType = columnDef.filterType;
                const filterKey = columnDef.filterKey || column.id;

                // Skip if no filter type is defined or if it's not a data column
                if (!filterType || column.id === 'select' || column.id === 'actions') {
                    return <TableCell key={column.id} className="p-1" />;
                }

                const currentValue = (table.getState().columnFilters.find((f) => f.id === filterKey)?.value) as any;

                return (
                    <TableCell key={column.id} className="p-1 align-middle">
                        <FilterInput
                            type={filterType}
                            value={currentValue}
                            onChange={(value) => {
                                table.setColumnFilters((prev) => {
                                    const without = prev.filter((f) => f.id !== filterKey);
                                    if (value === undefined || value === null || value === '') return without;
                                    return [...without, { id: filterKey, value }];
                                });
                            }}
                            columnDef={columnDef}
                            entityType={entityType}
                            filterKey={filterKey}
                        />
                    </TableCell>
                );
            })}
            {/* Empty cell for Actions column to maintain alignment */}
            {hasRowActions && <TableCell className="p-1 w-[70px]" />}
        </TableRow>
    );
}

interface FilterInputProps<TData extends Record<string, any>> {
    type: string;
    value: any;
    onChange: (value: any) => void;
    columnDef: ExtendedColumnDef<TData>;
    entityType?: string;
    filterKey: string;
}

// Specialized components to avoid conditional hook usage and state issues
function TextFilter({
    value,
    onChange,
    type,
    placeholder
}: {
    value: any,
    onChange: (val: any) => void,
    type: 'text' | 'number',
    placeholder: string
}) {
    const [localValue, setLocalValue] = React.useState<string>(value === undefined || value === null ? '' : String(value));
    const debouncedValue = useDebounce(localValue, 500);

    // Sync from parent to local ONLY if parent value is different from what we have locally
    // This allows typing without interruption, but respects external resets
    React.useEffect(() => {
        const normalizedParent = value === undefined || value === null ? '' : String(value);
        if (normalizedParent !== localValue) {
            // Only update if the parent value is meaningfully different
            // e.g. if parent reset to empty, but we have text
            // BUT we must avoid loop: Input -> Debounce -> Parent -> Prop -> Local
            // If Prop matches Debounced, it's just the echo back, so ignore.
            if (normalizedParent !== debouncedValue) {
                setLocalValue(normalizedParent);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]); // Only check when parent value changes

    // Sync from local to parent (debounced)
    React.useEffect(() => {
        const normalizedParent = value === undefined || value === null ? '' : String(value);
        if (debouncedValue !== normalizedParent) {
            onChange(debouncedValue);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedValue]); // Only check when debounced value changes

    return (
        <div className="relative">
            <Input
                placeholder={placeholder}
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                className="h-7 text-xs px-2 w-full"
                type={type === 'number' ? 'number' : 'text'}
            />
            {localValue && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                        setLocalValue('');
                        onChange('');
                    }}
                >
                    <X className="h-3 w-3" />
                </Button>
            )}
        </div>
    );
}

function FilterInput<TData extends Record<string, any>>({ type, value, onChange, columnDef, entityType, filterKey }: FilterInputProps<TData>) {
    // Dispatch to appropriate component based on type
    if (type === 'text' || type === 'number') {
        return (
            <TextFilter
                value={value}
                onChange={onChange}
                type={type}
                placeholder="Filter..."
            />
        );
    }

    if (type === 'select' || type === 'boolean' || type === 'multiselect') {
        return (
            <Select
                value={String(value || 'all')}
                onValueChange={(val) => onChange(val === 'all' ? undefined : val)}
            >
                <SelectTrigger className="h-7 text-xs px-2 w-full">
                    <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {type === 'boolean' ? (
                        <>
                            <SelectItem value="true">Yes</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                        </>
                    ) : (
                        columnDef.filterOptions?.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))
                    )}
                </SelectContent>
            </Select>
        );
    }

    if (type === 'searchable-select' && entityType && filterKey) {
        const targetEntityType = (columnDef as any).entityType || entityType;

        return (
            <FilterSearchableSelect
                value={value}
                onValueChange={onChange}
                entityType={targetEntityType}
                filterKey={filterKey}
                placeholder="Select..."
                className="h-7 text-xs px-2 w-full"
            />
        );
    }

    if (type === 'date' || type === 'daterange') {
        return (
            <DateRangeFilter
                value={value}
                onChange={onChange}
            />
        );
    }

    return null;
}

'use client';

import * as React from 'react';
import {
    SortableContext,
    horizontalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { flexRender, Header, ColumnFiltersState } from '@tanstack/react-table';
import { TableHead } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { ColumnFilter } from './ColumnFilter';
import type { ExtendedColumnDef } from './types';

interface SortableHeaderProps<TData> {
    header: Header<TData, unknown>;
    children: React.ReactNode;
}

function SortableHeader<TData>({ header, children }: SortableHeaderProps<TData>) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: header.id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative',
        zIndex: isDragging ? 1 : 0,
    };

    // Skip dragging for select and actions columns
    const isDraggable = header.id !== 'select' && header.id !== 'actions';

    if (!isDraggable) {
        return (
            <TableHead
                key={header.id}
                style={{ width: header.getSize() }}
                className="group"
            >
                {children}
            </TableHead>
        );
    }

    return (
        <TableHead
            ref={setNodeRef}
            style={{ ...style, width: header.getSize() }}
            className={cn(
                'group cursor-grab active:cursor-grabbing select-none',
                isDragging && 'bg-muted/80 shadow-lg ring-2 ring-primary/20'
            )}
            {...attributes}
            {...listeners}
        >
            {children}
        </TableHead>
    );
}

type TableData = Record<string, any>;

interface DraggableTableHeaderProps<TData extends TableData> {
    headers: Header<TData, unknown>[];
    enableInlineFilters?: boolean;
    entityType?: string;
    columnFilters?: ColumnFiltersState;
    onColumnFilterChange?: (columnId: string, values: string[]) => void;
    setColumnFilters?: (filters: ColumnFiltersState) => void;
    isCompact?: boolean;
}

export function DraggableTableHeader<TData extends TableData>({
    headers,
    enableInlineFilters,
    entityType,
    columnFilters,
    onColumnFilterChange,
    setColumnFilters,
    isCompact,
}: DraggableTableHeaderProps<TData>) {
    const headerIds = headers.map((h) => h.id);

    return (
        <SortableContext items={headerIds} strategy={horizontalListSortingStrategy}>
            {headers.map((header) => {
                const canSort = header.column.getCanSort();
                const isSorted = header.column.getIsSorted();
                const colDef = header.column.columnDef as ExtendedColumnDef<TData>;

                return (
                    <SortableHeader key={header.id} header={header}>
                        {header.isPlaceholder ? null : (
                            <div className="flex items-center justify-between w-full">
                                <div
                                    className={cn(
                                        'flex items-center gap-1 flex-1',
                                        canSort && 'cursor-pointer select-none hover:text-foreground'
                                    )}
                                    onClick={header.column.getToggleSortingHandler()}
                                >
                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                    {canSort && (
                                        <span className="text-muted-foreground">
                                            {isSorted === 'asc' ? '↑' : isSorted === 'desc' ? '↓' : '⇅'}
                                        </span>
                                    )}
                                    {colDef.tooltip && (
                                        <TooltipProvider delayDuration={200}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Info className="h-3 w-3 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent side="top" className="max-w-xs text-xs">
                                                    {colDef.tooltip}
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                                {!enableInlineFilters && colDef.enableColumnFilter && entityType && onColumnFilterChange && columnFilters && setColumnFilters && (
                                    <div className="ml-2" onClick={(e) => e.stopPropagation()}>
                                        <ColumnFilter
                                            columnId={header.column.id}
                                            filterKey={colDef.filterKey || header.column.id}
                                            entityType={entityType}
                                            value={
                                                columnFilters
                                                    .filter((f) => f.id === (colDef.filterKey || header.column.id))
                                                    .map((f) => {
                                                        try {
                                                            const strVal = String(f.value);
                                                            const parsed = JSON.parse(strVal);
                                                            return Array.isArray(parsed) ? parsed : [strVal];
                                                        } catch {
                                                            return [String(f.value)];
                                                        }
                                                    })
                                                    .flat() || []
                                            }
                                            onChange={(values) => {
                                                const fKey = colDef.filterKey || header.column.id;
                                                const newFilters = columnFilters.filter((f) => f.id !== fKey);
                                                if (values.length > 0) {
                                                    newFilters.push({ id: fKey, value: JSON.stringify(values) });
                                                }
                                                setColumnFilters(newFilters);
                                                onColumnFilterChange(header.column.id, values);
                                            }}
                                            onClear={() => {
                                                const fKey = colDef.filterKey || header.column.id;
                                                const newFilters = columnFilters.filter((f) => f.id !== fKey);
                                                setColumnFilters(newFilters);
                                                onColumnFilterChange(header.column.id, []);
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </SortableHeader>
                );
            })}
        </SortableContext>
    );
}

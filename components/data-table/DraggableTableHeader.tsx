'use client';

import * as React from 'react';
import {
    SortableContext,
    horizontalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Header, ColumnFiltersState } from '@tanstack/react-table';
import { TableHead } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { TableHeaderCell } from './TableHeaderCell';

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
            {headers.map((header) => (
                <SortableHeader key={header.id} header={header}>
                    <TableHeaderCell
                        header={header}
                        isCompact={isCompact}
                        enableInlineFilters={enableInlineFilters}
                        entityType={entityType}
                        columnFilters={columnFilters}
                        onColumnFilterChange={onColumnFilterChange}
                        setColumnFilters={setColumnFilters}
                    />
                </SortableHeader>
            ))}
        </SortableContext>
    );
}

'use client';

import * as React from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    horizontalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { flexRender, Header } from '@tanstack/react-table';
import { TableHead } from '@/components/ui/table';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

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
            <div className="flex items-center w-full">
                {children}
            </div>
        </TableHead>
    );
}

interface DraggableTableHeaderProps<TData> {
    headers: Header<TData, unknown>[];
    onColumnOrderChange: (newOrder: string[]) => void;
}

export function DraggableTableHeader<TData>({
    headers,
    onColumnOrderChange,
}: DraggableTableHeaderProps<TData>) {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const headerIds = headers.map((h) => h.id);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = headerIds.indexOf(active.id as string);
            const newIndex = headerIds.indexOf(over.id as string);
            const newOrder = arrayMove(headerIds, oldIndex, newIndex);
            onColumnOrderChange(newOrder);
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={headerIds} strategy={horizontalListSortingStrategy}>
                {headers.map((header) => (
                    <SortableHeader key={header.id} header={header}>
                        {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                    </SortableHeader>
                ))}
            </SortableContext>
        </DndContext>
    );
}

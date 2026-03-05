'use client';

import { type Column } from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { TableHead } from './table';

interface SortableHeaderProps<T> {
  column: Column<T, unknown>;
  children: React.ReactNode;
  className?: string;
}

export function SortableHeader<T>({ column, children, className }: SortableHeaderProps<T>) {
  const sorted = column.getIsSorted();

  return (
    <TableHead className={className}>
      <button
        className="flex items-center gap-1 hover:text-foreground transition-colors text-left font-medium"
        onClick={() => column.toggleSorting(sorted === 'asc')}
      >
        {children}
        {!sorted && <ArrowUpDown className="h-3 w-3 opacity-40" />}
        {sorted === 'asc' && <ArrowUp className="h-3 w-3" />}
        {sorted === 'desc' && <ArrowDown className="h-3 w-3" />}
      </button>
    </TableHead>
  );
}

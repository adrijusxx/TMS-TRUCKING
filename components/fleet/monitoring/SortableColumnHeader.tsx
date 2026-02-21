'use client';

import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface Props {
  label: string;
  column: string;
  currentSort: { column: string; order: 'asc' | 'desc' } | null;
  onSort: (column: string) => void;
  className?: string;
}

export default function SortableColumnHeader({ label, column, currentSort, onSort, className }: Props) {
  const isActive = currentSort?.column === column;
  const order = isActive ? currentSort.order : null;

  return (
    <th className={`pb-2 pr-3 font-medium ${className || ''}`}>
      <button
        className="flex items-center gap-1 hover:text-foreground transition-colors text-left"
        onClick={() => onSort(column)}
      >
        {label}
        {!isActive && <ArrowUpDown className="h-3 w-3 opacity-40" />}
        {order === 'asc' && <ArrowUp className="h-3 w-3" />}
        {order === 'desc' && <ArrowDown className="h-3 w-3" />}
      </button>
    </th>
  );
}

'use client';

import * as React from 'react';
import type { Table as TanStackTable } from '@tanstack/react-table';

type TableData = Record<string, any>;

interface FocusedCell {
  rowIndex: number;
  colIndex: number;
}

interface UseTableKeyboardProps<TData extends TableData> {
  table: TanStackTable<TData>;
  onRowClick?: (row: TData) => void;
  enableRowSelection?: boolean;
}

/**
 * Keyboard navigation for DataTable.
 * Arrow keys navigate cells, Enter activates row click, Space toggles selection,
 * Ctrl+A selects all, Escape clears selection and focus.
 */
export function useTableKeyboard<TData extends TableData>({
  table,
  onRowClick,
  enableRowSelection,
}: UseTableKeyboardProps<TData>) {
  const [focusedCell, setFocusedCell] = React.useState<FocusedCell | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const rows = table.getRowModel().rows;
  const visibleColumns = table.getVisibleFlatColumns();

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (!focusedCell) {
      // Start navigation on first arrow key
      if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        setFocusedCell({ rowIndex: 0, colIndex: 0 });
      }
      return;
    }

    const { rowIndex, colIndex } = focusedCell;
    const maxRow = rows.length - 1;
    const maxCol = visibleColumns.length - 1;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (rowIndex < maxRow) {
          setFocusedCell({ rowIndex: rowIndex + 1, colIndex });
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (rowIndex > 0) {
          setFocusedCell({ rowIndex: rowIndex - 1, colIndex });
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (colIndex < maxCol) {
          setFocusedCell({ rowIndex, colIndex: colIndex + 1 });
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (colIndex > 0) {
          setFocusedCell({ rowIndex, colIndex: colIndex - 1 });
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (rows[rowIndex] && onRowClick) {
          onRowClick(rows[rowIndex].original);
        }
        break;
      case ' ':
        if (enableRowSelection && rows[rowIndex]) {
          e.preventDefault();
          rows[rowIndex].toggleSelected();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setFocusedCell(null);
        if (enableRowSelection) {
          table.resetRowSelection();
        }
        break;
      case 'a':
        if (e.ctrlKey || e.metaKey) {
          if (enableRowSelection) {
            e.preventDefault();
            table.toggleAllPageRowsSelected(true);
          }
        }
        break;
    }
  }, [focusedCell, rows, visibleColumns.length, onRowClick, enableRowSelection, table]);

  // Scroll focused cell into view
  React.useEffect(() => {
    if (!focusedCell || !containerRef.current) return;
    const { rowIndex, colIndex } = focusedCell;
    const cell = containerRef.current.querySelector(
      `[data-row-index="${rowIndex}"][data-col-index="${colIndex}"]`
    );
    if (cell) {
      (cell as HTMLElement).scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }, [focusedCell]);

  return {
    focusedCell,
    setFocusedCell,
    containerRef,
    handleKeyDown,
  };
}

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import type { Table as TanStackTable } from '@tanstack/react-table';

interface DataTablePaginationProps<TData> {
  table: TanStackTable<TData>;
  totalCount?: number;
  dataLength: number;
}

/**
 * Pagination controls for DataTable.
 * Renders page navigation, page size selector, and row count.
 */
export function DataTablePagination<TData>({
  table,
  totalCount,
  dataLength,
}: DataTablePaginationProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const total = totalCount ?? dataLength;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-1 py-1">
      <div className="flex items-center gap-1">
        <p className="text-[11px] text-muted-foreground">
          {pageIndex * pageSize + 1}-
          {Math.min((pageIndex + 1) * pageSize, total)}{' '}
          of {total}
        </p>
      </div>
      <div className="flex items-center gap-1">
        {/* First page - hidden on mobile */}
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:flex h-6 w-6 p-0"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          aria-label="Go to first page"
        >
          <ChevronsLeft className="h-3 w-3" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          aria-label="Go to previous page"
        >
          <ChevronLeft className="h-3 w-3" />
        </Button>
        {/* Page number input - hidden on very small screens */}
        <div className="hidden sm:flex items-center gap-1">
          <span className="text-[11px]">Page</span>
          <Input
            type="number"
            min={1}
            max={table.getPageCount()}
            value={pageIndex + 1}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
              table.setPageIndex(page);
            }}
            className="w-12 h-6 text-[11px] px-1"
          />
          <span className="text-[11px]">of {table.getPageCount()}</span>
        </div>
        {/* Mobile-only simple page indicator */}
        <span className="sm:hidden text-[11px] text-muted-foreground px-1">
          {pageIndex + 1}/{table.getPageCount()}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          aria-label="Go to next page"
        >
          <ChevronRight className="h-3 w-3" />
        </Button>
        {/* Last page - hidden on mobile */}
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:flex h-6 w-6 p-0"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
          aria-label="Go to last page"
        >
          <ChevronsRight className="h-3 w-3" />
        </Button>
        <Select
          value={String(pageSize)}
          onValueChange={(value) => {
            table.setPageSize(Number(value));
          }}
        >
          <SelectTrigger className="h-6 w-[55px] text-[11px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 30, 50, 100].map((size) => (
              <SelectItem key={size} value={String(size)} className="text-[11px]">
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

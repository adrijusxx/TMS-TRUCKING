'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface LoadBoardPaginationProps {
  pageSize: number;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export default function LoadBoardPagination({
  pageSize,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: LoadBoardPaginationProps) {
  return (
    <div className="flex items-center justify-between text-xs px-1">
      <span className="text-muted-foreground">{totalItems} drivers</span>
      <div className="flex items-center gap-2">
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="border border-input bg-background text-foreground rounded px-1.5 py-0.5 text-xs h-6"
        >
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={0}>All</option>
        </select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="h-6 w-6 p-0"
        >
          <ChevronLeft className="h-3 w-3" />
        </Button>
        <span className="min-w-[60px] text-center">
          {totalPages > 0 ? `${currentPage} of ${totalPages}` : '–'}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="h-6 w-6 p-0"
        >
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

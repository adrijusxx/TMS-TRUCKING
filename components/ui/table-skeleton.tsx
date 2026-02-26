import { cn } from '@/lib/utils';

interface TableSkeletonProps {
  /** Number of skeleton rows */
  rows?: number;
  /** Number of skeleton columns */
  columns?: number;
  /** Show a toolbar skeleton above the table */
  showToolbar?: boolean;
  className?: string;
}

/**
 * Standard skeleton loader for data table pages.
 * Matches the DataTable layout with optional toolbar, header row, and body rows.
 */
export function TableSkeleton({
  rows = 5,
  columns = 5,
  showToolbar = true,
  className,
}: TableSkeletonProps) {
  return (
    <div className={cn('space-y-4 animate-pulse', className)}>
      {/* Toolbar skeleton */}
      {showToolbar && (
        <div className="flex items-center gap-2">
          <div className="h-9 w-64 bg-muted rounded-md" />
          <div className="flex-1" />
          <div className="h-9 w-20 bg-muted rounded-md" />
          <div className="h-9 w-24 bg-muted rounded-md" />
        </div>
      )}

      {/* Table skeleton */}
      <div className="border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="h-10 bg-muted/50 border-b flex items-center px-4 gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <div
              key={`h-${i}`}
              className="h-3 bg-muted rounded"
              style={{ width: `${60 + Math.random() * 60}px` }}
            />
          ))}
        </div>

        {/* Rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={`r-${i}`}
            className="h-12 border-b last:border-b-0 flex items-center px-4 gap-4"
          >
            {Array.from({ length: columns }).map((_, j) => (
              <div
                key={`c-${j}`}
                className="h-3 bg-muted rounded"
                style={{ width: `${40 + Math.random() * 80}px` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

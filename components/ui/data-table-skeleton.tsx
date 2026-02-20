import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface DataTableSkeletonProps {
  /** Number of columns to render */
  columns?: number;
  /** Number of rows to render */
  rows?: number;
  className?: string;
}

export function DataTableSkeleton({
  columns = 5,
  rows = 6,
  className,
}: DataTableSkeletonProps) {
  return (
    <div className={cn('rounded-xl border shadow-card overflow-hidden', className)}>
      {/* Header */}
      <div className="bg-muted/30 border-b px-2 py-2">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton
              key={`header-${i}`}
              className="h-4"
              style={{ width: `${60 + Math.random() * 60}px` }}
            />
          ))}
        </div>
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={`row-${rowIdx}`}
          className={cn(
            'flex gap-4 px-2 py-2.5 border-b last:border-0',
            rowIdx % 2 === 1 && 'bg-muted/20'
          )}
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton
              key={`cell-${rowIdx}-${colIdx}`}
              className="h-3.5"
              style={{ width: `${40 + Math.random() * 80}px` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

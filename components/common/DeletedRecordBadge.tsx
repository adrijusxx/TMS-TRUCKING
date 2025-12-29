'use client';

import { Badge } from '@/components/ui/badge';
import { Trash2, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';

interface DeletedRecordBadgeProps {
  deletedAt: Date | null | undefined;
  className?: string;
  showIcon?: boolean;
  showTooltip?: boolean;
  variant?: 'default' | 'outline' | 'destructive' | 'secondary';
}

/**
 * Badge component to visually indicate a soft-deleted record
 * Shows a badge with deletion indicator and optional tooltip with deletion date
 */
export function DeletedRecordBadge({
  deletedAt,
  className,
  showIcon = true,
  showTooltip = true,
  variant = 'destructive',
}: DeletedRecordBadgeProps) {
  // Don't show badge if record is not deleted
  if (!deletedAt) {
    return null;
  }

  const badge = (
    <Badge variant={variant} className={className}>
      {showIcon && <Trash2 className="h-3 w-3 mr-1" />}
      <span>Deleted</span>
    </Badge>
  );

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                <span className="font-semibold">Soft Deleted</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Deleted on {format(new Date(deletedAt), 'PPp')}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}





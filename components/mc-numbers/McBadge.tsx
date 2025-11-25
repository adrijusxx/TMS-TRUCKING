'use client';

import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface McBadgeProps {
  mcNumber?: string | null;
  mcNumberId?: string | null;
  companyName?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showTooltip?: boolean;
}

export default function McBadge({
  mcNumber,
  mcNumberId,
  companyName,
  className,
  size = 'sm',
  showIcon = false,
  showTooltip = true,
}: McBadgeProps) {
  if (!mcNumber && !mcNumberId) {
    return null;
  }

  const displayText = mcNumber || mcNumberId || 'N/A';
  const formattedText = mcNumber?.startsWith('MC') ? mcNumber : `MC ${displayText}`;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const badge = (
    <Badge
      variant="outline"
      className={cn(
        'font-mono font-medium border-primary/30 bg-primary/5 text-primary hover:bg-primary/10',
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Building2 className="h-3 w-3 mr-1" />}
      {formattedText}
    </Badge>
  );

  if (showTooltip && companyName) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{companyName}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}


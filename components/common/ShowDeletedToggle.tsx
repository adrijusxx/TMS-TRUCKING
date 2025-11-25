'use client';

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ShowDeletedToggleProps {
  className?: string;
  label?: string;
  showIcon?: boolean;
}

/**
 * Toggle component for admins to show/hide soft-deleted records
 * Updates the URL query parameter 'includeDeleted'
 */
export function ShowDeletedToggle({
  className,
  label = 'Show Deleted',
  showIcon = true,
}: ShowDeletedToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const includeDeleted = searchParams.get('includeDeleted') === 'true';

  const handleToggle = (checked: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (checked) {
      params.set('includeDeleted', 'true');
    } else {
      params.delete('includeDeleted');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const toggle = (
    <div className={`flex items-center gap-2 ${className}`}>
      {showIcon && (
        <div className="text-muted-foreground">
          {includeDeleted ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </div>
      )}
      <Switch
        id="show-deleted-toggle"
        checked={includeDeleted}
        onCheckedChange={handleToggle}
      />
      <Label
        htmlFor="show-deleted-toggle"
        className="text-sm font-normal cursor-pointer"
      >
        {label}
      </Label>
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>{toggle}</div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">
            {includeDeleted
              ? 'Showing all records including soft-deleted ones'
              : 'Only showing active (non-deleted) records'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}





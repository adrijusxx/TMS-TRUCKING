'use client';

import { Button } from '@/components/ui/button';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

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
    <div className={className}>
      <Button
        variant={includeDeleted ? "default" : "outline"}
        size="sm"
        onClick={() => handleToggle(!includeDeleted)}
        className="gap-2 h-8"
      >
        {showIcon && (
          includeDeleted ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />
        )}
        {label}
      </Button>
    </div>
  );

  return toggle;
}





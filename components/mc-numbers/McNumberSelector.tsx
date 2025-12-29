'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface McNumber {
  id: string;
  number: string;
  companyName: string;
  isDefault: boolean;
}

interface McNumberSelectorProps {
  value?: string;
  onValueChange: (mcNumberId: string) => void;
  required?: boolean;
  companyId?: string;
  label?: string;
  className?: string;
  error?: string;
  disabled?: boolean;
}

async function fetchMcNumbers(companyId?: string) {
  const response = await fetch(apiUrl('/api/mc-numbers?limit=1000'));
  if (!response.ok) throw new Error('Failed to fetch MC numbers');
  return response.json();
}

export default function McNumberSelector({
  value,
  onValueChange,
  required = false,
  companyId,
  label = 'MC Number',
  className,
  error,
  disabled = false,
}: McNumberSelectorProps) {
  const { data: session } = useSession();
  const effectiveCompanyId = companyId || session?.user?.companyId;

  const { data, isLoading, error: fetchError } = useQuery({
    queryKey: ['mc-numbers', effectiveCompanyId],
    queryFn: () => fetchMcNumbers(effectiveCompanyId),
    enabled: !!effectiveCompanyId,
  });

  const allMcNumbers: McNumber[] = data?.data || [];

  // Filter MC numbers based on user's mcAccess permissions
  const userRole = session?.user?.role;
  const userMcAccess = (session?.user as any)?.mcAccess || [];
  const isAdmin = userRole === 'ADMIN';
  
  let mcNumbers: McNumber[] = [];
  
  if (isAdmin && userMcAccess.length === 0) {
    // Admin with empty mcAccess array can see all MCs
    mcNumbers = allMcNumbers;
  } else if (userMcAccess.length > 0) {
    // User with mcAccess array can only see MCs they have access to
    mcNumbers = allMcNumbers.filter(mc => userMcAccess.includes(mc.id));
  } else {
    // User with no mcAccess (non-admin) - show only their default MC if available
    const defaultMcId = (session?.user as any)?.mcNumberId;
    if (defaultMcId) {
      mcNumbers = allMcNumbers.filter(mc => mc.id === defaultMcId);
    } else {
      mcNumbers = [];
    }
  }

  // Sort: default first, then by company name
  const sortedMcNumbers = [...mcNumbers].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return a.companyName.localeCompare(b.companyName);
  });

  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)}>
        {label && (
          <Label>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className={cn('space-y-2', className)}>
        {label && (
          <Label>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
        <div className="text-sm text-destructive">
          Failed to load MC numbers
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <Select
        value={value || ''}
        onValueChange={onValueChange}
        disabled={disabled || mcNumbers.length === 0}
        required={required}
      >
        <SelectTrigger className={cn(error && 'border-destructive')}>
          <SelectValue placeholder={mcNumbers.length === 0 ? 'No MC numbers available' : 'Select MC number'} />
        </SelectTrigger>
        <SelectContent>
          {sortedMcNumbers.map((mc) => (
            <SelectItem key={mc.id} value={mc.id}>
              <div className="flex items-center justify-between w-full">
                <span>{mc.companyName}</span>
                <span className="text-muted-foreground ml-2">
                  {mc.number}
                  {mc.isDefault && (
                    <span className="ml-1 text-xs">(Default)</span>
                  )}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      {mcNumbers.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No MC numbers found. Please create an MC number first.
        </p>
      )}
    </div>
  );
}






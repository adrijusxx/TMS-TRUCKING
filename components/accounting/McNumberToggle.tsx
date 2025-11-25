'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiUrl } from '@/lib/utils';
import { Building2 } from 'lucide-react';

interface McNumber {
  id: string;
  number: string;
  companyName: string;
}

async function fetchMcNumbers() {
  const response = await fetch(apiUrl('/api/companies'));
  if (!response.ok) throw new Error('Failed to fetch MC numbers');
  const data = await response.json();
  return data.mcNumbers || [];
}

export default function McNumberToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mcNumberFilter, setMcNumberFilter] = useState<string>('current');

  const { data: mcNumbers = [], isLoading } = useQuery<McNumber[]>({
    queryKey: ['mc-numbers'],
    queryFn: fetchMcNumbers,
  });

  // MC state is managed via cookies, not URL params
  // Initialize from cookies on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
        return null;
      };
      
      const viewMode = getCookie('mcViewMode');
      const mcId = getCookie('currentMcNumberId');
      
      if (viewMode === 'all') {
        setMcNumberFilter('all');
      } else if (mcId) {
        setMcNumberFilter(mcId);
      } else {
        setMcNumberFilter('current');
      }
    }
  }, []);

  const handleMcNumberChange = (value: string) => {
    setMcNumberFilter(value);
    // Use the MC set-view API instead of URL params
    if (value === 'current' || value === 'all') {
      fetch(apiUrl('/api/mc-numbers/set-view'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mcNumberId: value === 'all' ? null : undefined,
          mcNumberIds: []
        }),
      });
    } else {
      fetch(apiUrl('/api/mc-numbers/set-view'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mcNumberId: value }),
      });
    }
    
    // Remove MC param from URL if it exists
    const params = new URLSearchParams(searchParams.toString());
    if (params.has('mc')) {
      params.delete('mc');
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(newUrl, { scroll: false });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Select value={mcNumberFilter} onValueChange={handleMcNumberChange} disabled={isLoading}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="MC Number" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="current">Current MC</SelectItem>
          <SelectItem value="all">All MC Numbers</SelectItem>
          {mcNumbers.map((mc) => (
            <SelectItem key={mc.id} value={mc.id}>
              {mc.companyName} (MC {mc.number})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}


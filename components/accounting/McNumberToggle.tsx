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

  useEffect(() => {
    const mcParam = searchParams.get('mc');
    if (mcParam) {
      setMcNumberFilter(mcParam);
    }
  }, [searchParams]);

  const handleMcNumberChange = (value: string) => {
    setMcNumberFilter(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'current') {
      params.delete('mc');
    } else {
      params.set('mc', value);
    }
    router.push(`${pathname}?${params.toString()}`);
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


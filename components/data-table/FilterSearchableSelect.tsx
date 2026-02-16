'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { apiUrl } from '@/lib/utils';

interface ColumnFilterValue {
  value: string | null;
  label: string;
  count: number;
}

interface FilterSearchableSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  entityType: string;
  filterKey: string;
  placeholder?: string;
  className?: string;
}

async function fetchColumnValues(
  entityType: string,
  column: string
): Promise<ColumnFilterValue[]> {
  const response = await fetch(apiUrl(`/api/${entityType}/column-values?column=${column}`));
  if (!response.ok) {
    throw new Error('Failed to fetch column values');
  }
  const result = await response.json();
  return result.data || [];
}

export function FilterSearchableSelect({
  value,
  onValueChange,
  entityType,
  filterKey,
  placeholder = 'Search...',
  className,
}: FilterSearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const { data: values = [], isLoading } = useQuery({
    queryKey: [`column-values-${entityType}-${filterKey}`, searchQuery],
    queryFn: () => fetchColumnValues(entityType, filterKey),
    enabled: open,
  });

  const filteredValues = React.useMemo(() => {
    if (!searchQuery) return values;
    return values.filter((v) =>
      v.label?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [values, searchQuery]);

  const selectedValue = filteredValues.find((v) => v.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between h-7 text-xs px-2', className)}
        >
          <span className="truncate">{selectedValue ? selectedValue.label : placeholder}</span>
          <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? 'Loading...' : 'No results found.'}
            </CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__all__"
                onSelect={() => {
                  onValueChange('');
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    !value ? 'opacity-100' : 'opacity-0'
                  )}
                />
                All
              </CommandItem>
              {filteredValues.map((item) => (
                <CommandItem
                  key={item.value || 'null'}
                  value={item.label || item.value || ''}
                  onSelect={() => {
                    onValueChange(item.value || '');
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === item.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {item.label || 'N/A'}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {item.count}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}


























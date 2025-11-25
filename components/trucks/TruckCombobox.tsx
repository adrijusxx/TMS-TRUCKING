'use client';

import * as React from 'react';
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
import { useQuery } from '@tanstack/react-query';
import { apiUrl } from '@/lib/utils';

interface Truck {
  id: string;
  truckNumber: string;
  make?: string;
  model?: string;
  vin?: string;
}

interface TruckComboboxProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  trucks?: Truck[]; // Optional: pre-loaded trucks
  disabled?: boolean;
}

async function fetchTrucks(search?: string) {
  const url = search
    ? apiUrl(`/api/trucks?limit=100&search=${encodeURIComponent(search)}`)
    : apiUrl('/api/trucks?limit=100');
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch trucks');
  return response.json();
}

export default function TruckCombobox({
  value,
  onValueChange,
  placeholder = 'Search truck...',
  className,
  trucks: preloadedTrucks,
  disabled,
}: TruckComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Always use API search when there's a query, otherwise use preloaded trucks if available
  const shouldUseApi = open && (searchQuery.length > 0 || !preloadedTrucks);
  
  const { data: trucksData, isLoading } = useQuery({
    queryKey: ['trucks', searchQuery],
    queryFn: () => fetchTrucks(searchQuery),
    enabled: shouldUseApi,
  });

  // Filter preloaded trucks by search query if no API search
  const filteredPreloaded = React.useMemo(() => {
    if (!preloadedTrucks || searchQuery.length === 0) return preloadedTrucks || [];
    const query = searchQuery.toLowerCase();
    return preloadedTrucks.filter(
      (t) =>
        t.truckNumber.toLowerCase().includes(query) ||
        t.vin?.toLowerCase().includes(query) ||
        t.make?.toLowerCase().includes(query) ||
        t.model?.toLowerCase().includes(query)
    );
  }, [preloadedTrucks, searchQuery]);

  const trucks: Truck[] = shouldUseApi
    ? trucksData?.data || []
    : filteredPreloaded;
  const selectedTruck = trucks.find((t) => t.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('h-7 w-full justify-between text-xs font-normal', className)}
        >
          {selectedTruck ? (
            <span className="truncate">
              #{selectedTruck.truckNumber}
              {selectedTruck.make && selectedTruck.model && ` - ${selectedTruck.make} ${selectedTruck.model}`}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by truck number, VIN, or make/model..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {isLoading ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                Loading...
              </div>
            ) : (
              <>
                <CommandEmpty>
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    {searchQuery ? 'No trucks found.' : 'Start typing to search...'}
                  </div>
                </CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="none"
                    onSelect={() => {
                      onValueChange('');
                      setOpen(false);
                      setSearchQuery('');
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-3.5 w-3.5',
                        !value || value === '' ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span>None</span>
                  </CommandItem>
                  {trucks.map((truck) => (
                    <CommandItem
                      key={truck.id}
                      value={truck.id}
                      onSelect={() => {
                        onValueChange(truck.id);
                        setOpen(false);
                        setSearchQuery('');
                      }}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          'mr-2 h-3.5 w-3.5',
                          value === truck.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium text-xs">
                          #{truck.truckNumber}
                        </span>
                        {(truck.make || truck.model) && (
                          <span className="text-xs text-muted-foreground">
                            {truck.make} {truck.model}
                          </span>
                        )}
                        {truck.vin && (
                          <span className="text-xs text-muted-foreground">
                            VIN: {truck.vin}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}






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

interface Driver {
  id: string;
  driverNumber: string;
  user: {
    firstName: string;
    lastName: string;
  };
}

interface DriverComboboxProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  drivers?: Driver[]; // Optional: pre-loaded drivers
  selectedDriver?: Driver | { user: { firstName: string; lastName: string }; driverNumber: string }; // Optional: explicit selected driver object
  disabled?: boolean;
}

async function fetchDrivers(search?: string) {
  const url = search
    ? apiUrl(`/api/drivers?limit=100&search=${encodeURIComponent(search)}`)
    : apiUrl('/api/drivers?limit=100');
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch drivers');
  return response.json();
}

export default function DriverCombobox({
  value,
  onValueChange,
  placeholder = 'Search driver...',
  className,
  drivers: preloadedDrivers,
  selectedDriver: explicitSelectedDriver,
  disabled,
}: DriverComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Always use API search when there's a query, otherwise use preloaded drivers if available
  // Check if preloaded drivers array has items, not just if it exists (empty array is truthy)
  const hasPreloadedDrivers = preloadedDrivers && preloadedDrivers.length > 0;
  const shouldUseApi = open && (searchQuery.length > 0 || !hasPreloadedDrivers);

  const { data: driversData, isLoading } = useQuery({
    queryKey: ['drivers', searchQuery],
    queryFn: () => fetchDrivers(searchQuery),
    enabled: shouldUseApi,
  });

  // Filter preloaded drivers by search query if no API search
  const filteredPreloaded = React.useMemo(() => {
    if (!hasPreloadedDrivers || searchQuery.length === 0) return preloadedDrivers || [];
    const query = searchQuery.toLowerCase();
    return preloadedDrivers.filter(
      (d) =>
        d.user.firstName.toLowerCase().includes(query) ||
        d.user.lastName.toLowerCase().includes(query) ||
        d.driverNumber.toLowerCase().includes(query)
    );
  }, [preloadedDrivers, searchQuery, hasPreloadedDrivers]);

  const drivers: Driver[] = shouldUseApi
    ? driversData?.data || []
    : filteredPreloaded;
  const selectedDriver = drivers.find((d) => d.id === value) || (value && explicitSelectedDriver ? (explicitSelectedDriver as Driver) : undefined);

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
          {selectedDriver ? (
            <span className="truncate">
              {selectedDriver.user?.firstName || 'Unknown'} {selectedDriver.user?.lastName || 'Driver'} (#{selectedDriver.driverNumber})
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
            placeholder="Search by name or driver number..."
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
                    {searchQuery ? 'No drivers found.' : 'Start typing to search...'}
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
                  {drivers.map((driver) => (
                    <CommandItem
                      key={driver.id}
                      value={driver.id}
                      onSelect={() => {
                        onValueChange(driver.id);
                        setOpen(false);
                        setSearchQuery('');
                      }}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          'mr-2 h-3.5 w-3.5',
                          value === driver.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium text-xs">
                          {driver.user?.firstName || 'Unknown'} {driver.user?.lastName || 'Driver'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          #{driver.driverNumber}
                        </span>
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






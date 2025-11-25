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
import { Badge } from '@/components/ui/badge';

interface Load {
  id: string;
  loadNumber: string;
  status: string;
  customer?: {
    id: string;
    name: string;
  } | null;
  pickupCity?: string | null;
  pickupState?: string | null;
  deliveryCity?: string | null;
  deliveryState?: string | null;
}

interface LoadComboboxProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  loads?: Load[]; // Optional: pre-loaded loads
  disabled?: boolean;
}

async function fetchLoads(search?: string) {
  const url = search
    ? apiUrl(`/api/loads?limit=100&search=${encodeURIComponent(search)}`)
    : apiUrl('/api/loads?limit=100');
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch loads');
  return response.json();
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  ASSIGNED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  EN_ROUTE_PICKUP: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  AT_PICKUP: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  LOADED: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  EN_ROUTE_DELIVERY: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  AT_DELIVERY: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  DELIVERED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  INVOICED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  PAID: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function LoadCombobox({
  value,
  onValueChange,
  placeholder = 'Search load...',
  className,
  loads: preloadedLoads,
  disabled = false,
}: LoadComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedLoadData, setSelectedLoadData] = React.useState<Load | null>(null);

  // Always use API search when there's a query, otherwise use preloaded loads if available
  const shouldUseApi = open && (searchQuery.length > 0 || !preloadedLoads);
  
  const { data: loadsData, isLoading } = useQuery({
    queryKey: ['loads', searchQuery],
    queryFn: () => fetchLoads(searchQuery),
    enabled: shouldUseApi,
  });

  // Filter preloaded loads by search query if no API search
  const filteredPreloaded = React.useMemo(() => {
    if (!preloadedLoads || searchQuery.length === 0) return preloadedLoads || [];
    const query = searchQuery.toLowerCase();
    return preloadedLoads.filter(
      (l) =>
        l.loadNumber.toLowerCase().includes(query) ||
        l.customer?.name.toLowerCase().includes(query) ||
        l.pickupCity?.toLowerCase().includes(query) ||
        l.deliveryCity?.toLowerCase().includes(query) ||
        `${l.pickupCity || ''} ${l.pickupState || ''}`.toLowerCase().includes(query) ||
        `${l.deliveryCity || ''} ${l.deliveryState || ''}`.toLowerCase().includes(query)
    );
  }, [preloadedLoads, searchQuery]);

  const loads: Load[] = shouldUseApi
    ? loadsData?.data || []
    : filteredPreloaded;
  
  // Find selected load - check multiple sources
  const selectedLoad = React.useMemo(() => {
    if (!value || value.trim() === '') return null;
    
    // First check the cached selected load data
    if (selectedLoadData && selectedLoadData.id === value) {
      return selectedLoadData;
    }
    
    // Then check current filtered list
    const fromList = loads.find((l) => l.id === value);
    if (fromList) return fromList;
    
    // Then check preloaded loads
    const fromPreloaded = preloadedLoads?.find((l) => l.id === value);
    if (fromPreloaded) return fromPreloaded;
    
    // Finally check API data
    const fromApi = loadsData?.data?.find((l: Load) => l.id === value);
    return fromApi || null;
  }, [value, selectedLoadData, loads, preloadedLoads, loadsData]);

  // Update cached selected load when value changes
  React.useEffect(() => {
    if (value && selectedLoad && selectedLoad.id === value) {
      setSelectedLoadData(selectedLoad);
    } else if (!value) {
      setSelectedLoadData(null);
    }
  }, [value, selectedLoad]);

  // Fetch selected load details if we have value but no data
  const { data: selectedLoadDetails } = useQuery({
    queryKey: ['load', value],
    queryFn: async () => {
      const response = await fetch(apiUrl(`/api/loads/${value}`));
      if (!response.ok) throw new Error('Failed to fetch load');
      return response.json();
    },
    enabled: !!value && !selectedLoad,
  });

  React.useEffect(() => {
    if (selectedLoadDetails?.data && value === selectedLoadDetails.data.id) {
      setSelectedLoadData(selectedLoadDetails.data);
    }
  }, [selectedLoadDetails, value]);

  const displayLoad = selectedLoad || selectedLoadDetails?.data;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('h-10 w-full justify-between text-sm font-normal', className)}
          title="Search by load number, customer, or location"
        >
          {displayLoad ? (
            <span className="truncate flex items-center gap-2">
              <span className="font-medium">{displayLoad.loadNumber}</span>
              {displayLoad.customer && (
                <span className="text-muted-foreground">- {displayLoad.customer.name}</span>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by load number, customer, or location..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Loading...
              </div>
            ) : (
              <>
                <CommandEmpty>
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    {searchQuery ? 'No loads found.' : 'Start typing to search...'}
                  </div>
                </CommandEmpty>
                <CommandGroup>
                  {loads.map((load) => (
                    <CommandItem
                      key={load.id}
                      value={load.id}
                      onSelect={() => {
                        // Cache the selected load data
                        setSelectedLoadData(load);
                        // Call the onChange handler with the load ID
                        onValueChange(load.id);
                        setOpen(false);
                        setSearchQuery('');
                      }}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === load.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{load.loadNumber}</span>
                          {load.status && (
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs px-1.5 py-0',
                                statusColors[load.status] || 'bg-gray-100 text-gray-800'
                              )}
                            >
                              {formatStatus(load.status)}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5 mt-0.5">
                          {load.customer && (
                            <span className="text-xs text-muted-foreground">
                              {load.customer.name}
                            </span>
                          )}
                          {(load.pickupCity || load.deliveryCity) && (
                            <span className="text-xs text-muted-foreground">
                              {load.pickupCity && load.pickupState && (
                                <>{load.pickupCity}, {load.pickupState}</>
                              )}
                              {(load.pickupCity || load.deliveryCity) && ' → '}
                              {load.deliveryCity && load.deliveryState && (
                                <>{load.deliveryCity}, {load.deliveryState}</>
                              )}
                            </span>
                          )}
                        </div>
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


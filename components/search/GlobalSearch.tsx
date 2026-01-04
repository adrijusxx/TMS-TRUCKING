'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Package, Users, Truck, Building2, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiUrl } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

async function search(query: string) {
  if (query.length < 2) {
    return {
      success: true,
      data: {
        loads: [],
        drivers: [],
        trucks: [],
        customers: [],
      },
    };
  }

  try {
    const response = await fetch(apiUrl(`/api/search?q=${encodeURIComponent(query)}`));
    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Debounce search query to avoid too many API calls
  const debouncedQuery = useDebounce(query, 300);

  // Debug: Log query changes
  useEffect(() => {
    if (query) {
      console.log('Query changed:', query);
    }
  }, [query]);

  // Debug: Log debounced query changes
  useEffect(() => {
    if (debouncedQuery) {
      console.log('Debounced query:', debouncedQuery);
    }
  }, [debouncedQuery]);

  // Only render after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ['global-search', debouncedQuery],
    queryFn: () => search(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 0, // Disable caching to force fresh searches during debug
  });

  // Debug: Log API response
  useEffect(() => {
    if (data) {
      console.log('[GlobalSearch] API Response:', data);
    }
    if (error) {
      console.error('[GlobalSearch] API Error:', error);
    }
  }, [data, error]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Reset query when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery('');
    } else {
      // Small delay to ensure dialog is fully rendered before focusing
      setTimeout(() => {
        const input = document.querySelector('[cmdk-input]') as HTMLInputElement;
        if (input) {
          input.focus();
        }
      }, 100);
    }
  }, [open]);

  const results = useMemo(() => {
    if (!data?.success || !data?.data) {
      return {
        loads: [],
        drivers: [],
        trucks: [],
        customers: [],
      };
    }
    // Ensure all arrays exist even if API returns partial data
    return {
      loads: Array.isArray(data.data.loads) ? data.data.loads : [],
      drivers: Array.isArray(data.data.drivers) ? data.data.drivers : [],
      trucks: Array.isArray(data.data.trucks) ? data.data.trucks : [],
      customers: Array.isArray(data.data.customers) ? data.data.customers : [],
    };
  }, [data]);

  const hasResults = useMemo(() => {
    return (
      results.loads.length > 0 ||
      results.drivers.length > 0 ||
      results.trucks.length > 0 ||
      results.customers.length > 0
    );
  }, [results]);

  const handleSelect = (type: string, id: string) => {
    setOpen(false);
    setQuery('');
    router.push(`/dashboard/${type}/${id}`);
  };

  if (!mounted) {
    // Return a placeholder with the same dimensions to prevent layout shift
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className="relative h-9 w-9 sm:w-64 sm:justify-start"
      >
        <Search className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline-flex">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="relative h-9 w-9 sm:w-64 sm:justify-start"
      >
        <Search className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline-flex">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        shouldFilter={false}
      >
        <CommandInput
          placeholder="Search loads, drivers, trucks, customers..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {query.length < 2 && (
            <CommandEmpty>
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Search className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Type at least 2 characters to search
                </p>
              </div>
            </CommandEmpty>
          )}

          {isLoading && debouncedQuery.length >= 2 && (
            <CommandEmpty>
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
                <span className="text-sm text-muted-foreground">Searching...</span>
              </div>
            </CommandEmpty>
          )}

          {error && debouncedQuery.length >= 2 && (
            <CommandEmpty>
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <p className="text-sm text-destructive">Failed to search. Please try again.</p>
              </div>
            </CommandEmpty>
          )}

          {!isLoading && !error && debouncedQuery.length >= 2 && (
            <>
              {!hasResults && (
                <CommandEmpty>
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <Search className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No results found for &quot;{debouncedQuery}&quot;
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Try searching by name, number, or location
                    </p>
                  </div>
                </CommandEmpty>
              )}

              {results.loads.length > 0 && (
                <CommandGroup heading={`Loads (${results.loads.length})`}>
                  {results.loads.map((load: any) => (
                    <CommandItem
                      key={load.id}
                      onSelect={() => handleSelect('loads', load.id)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Package className="h-4 w-4 flex-shrink-0" />
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{load.loadNumber || 'N/A'}</span>
                          {load.status && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              {load.status}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground truncate">
                          {load.pickupCity && load.pickupState && load.deliveryCity && load.deliveryState
                            ? `${load.pickupCity}, ${load.pickupState} → ${load.deliveryCity}, ${load.deliveryState}`
                            : load.commodity
                              ? `Commodity: ${load.commodity}`
                              : 'No details'}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results.drivers.length > 0 && (
                <CommandGroup heading={`Drivers (${results.drivers.length})`}>
                  {results.drivers.map((driver: any) => (
                    <CommandItem
                      key={driver.id}
                      onSelect={() => handleSelect('drivers', driver.id)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Users className="h-4 w-4 flex-shrink-0" />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-medium truncate">
                          {driver.user?.firstName && driver.user?.lastName
                            ? `${driver.user.firstName} ${driver.user.lastName}`
                            : 'Unknown Driver'}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {driver.driverNumber ? `Driver #${driver.driverNumber}` : 'No driver number'}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results.trucks.length > 0 && (
                <CommandGroup heading={`Trucks (${results.trucks.length})`}>
                  {results.trucks.map((truck: any) => (
                    <CommandItem
                      key={truck.id}
                      onSelect={() => handleSelect('trucks', truck.id)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Truck className="h-4 w-4 flex-shrink-0" />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-medium truncate">
                          {truck.truckNumber || 'N/A'}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {truck.make && truck.model
                            ? `${truck.make} ${truck.model}${truck.year ? ` (${truck.year})` : ''}`
                            : 'No details'}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results.customers.length > 0 && (
                <CommandGroup heading={`Customers (${results.customers.length})`}>
                  {results.customers.map((customer: any) => (
                    <CommandItem
                      key={customer.id}
                      onSelect={() => handleSelect('customers', customer.id)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Building2 className="h-4 w-4 flex-shrink-0" />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-medium truncate">
                          {customer.name || 'Unknown Customer'}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {customer.customerNumber
                            ? `Customer #${customer.customerNumber}${customer.city && customer.state ? ` • ${customer.city}, ${customer.state}` : ''}`
                            : customer.city && customer.state
                              ? `${customer.city}, ${customer.state}`
                              : 'No details'}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}


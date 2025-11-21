'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Package, Users, Truck, Building2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiUrl } from '@/lib/utils';

async function search(query: string) {
  if (query.length < 2) return { loads: [], drivers: [], trucks: [], customers: [] };
  
  const response = await fetch(apiUrl(`/api/search?q=${encodeURIComponent(query)}`));
  if (!response.ok) throw new Error('Search failed');
  return response.json();
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Only render after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['global-search', query],
    queryFn: () => search(query),
    enabled: query.length >= 2,
  });

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

  const results = data?.data || {
    loads: [],
    drivers: [],
    trucks: [],
    customers: [],
  };

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
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search loads, drivers, trucks, customers..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {isLoading && query.length >= 2 && (
            <CommandEmpty>Searching...</CommandEmpty>
          )}
          {!isLoading && query.length >= 2 && (
            <>
              {results.loads.length === 0 &&
                results.drivers.length === 0 &&
                results.trucks.length === 0 &&
                results.customers.length === 0 && (
                  <CommandEmpty>No results found.</CommandEmpty>
                )}

              {results.loads.length > 0 && (
                <CommandGroup heading="Loads">
                  {results.loads.map((load: any) => (
                    <CommandItem
                      key={load.id}
                      onSelect={() => handleSelect('loads', load.id)}
                    >
                      <Package className="mr-2 h-4 w-4" />
                      <span>{load.loadNumber}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {load.pickupCity}, {load.pickupState} → {load.deliveryCity},{' '}
                        {load.deliveryState}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results.drivers.length > 0 && (
                <CommandGroup heading="Drivers">
                  {results.drivers.map((driver: any) => (
                    <CommandItem
                      key={driver.id}
                      onSelect={() => handleSelect('drivers', driver.id)}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      <span>
                        {driver.user.firstName} {driver.user.lastName}
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {driver.driverNumber}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results.trucks.length > 0 && (
                <CommandGroup heading="Trucks">
                  {results.trucks.map((truck: any) => (
                    <CommandItem
                      key={truck.id}
                      onSelect={() => handleSelect('trucks', truck.id)}
                    >
                      <Truck className="mr-2 h-4 w-4" />
                      <span>{truck.truckNumber}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {truck.make} {truck.model}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results.customers.length > 0 && (
                <CommandGroup heading="Customers">
                  {results.customers.map((customer: any) => (
                    <CommandItem
                      key={customer.id}
                      onSelect={() => handleSelect('customers', customer.id)}
                    >
                      <Building2 className="mr-2 h-4 w-4" />
                      <span>{customer.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {customer.customerNumber}
                      </span>
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


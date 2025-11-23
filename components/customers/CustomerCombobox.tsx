'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
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

interface Customer {
  id: string;
  name: string;
  customerNumber: string;
  email?: string;
}

interface CustomerComboboxProps {
  value?: string;
  onValueChange: (value: string) => void;
  onNewCustomer?: () => void;
  placeholder?: string;
  className?: string;
  customers?: Customer[]; // Optional: pre-loaded customers
}

async function fetchCustomers(search?: string) {
  const url = search
    ? apiUrl(`/api/customers?limit=100&search=${encodeURIComponent(search)}`)
    : apiUrl('/api/customers?limit=100');
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch customers');
  return response.json();
}

export default function CustomerCombobox({
  value,
  onValueChange,
  onNewCustomer,
  placeholder = 'Search customer...',
  className,
  customers: preloadedCustomers,
}: CustomerComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCustomerData, setSelectedCustomerData] = React.useState<Customer | null>(null);

  // Always use API search when there's a query, otherwise use preloaded customers if available
  const shouldUseApi = open && (searchQuery.length > 0 || !preloadedCustomers);
  
  const { data: customersData, isLoading } = useQuery({
    queryKey: ['customers', searchQuery],
    queryFn: () => fetchCustomers(searchQuery),
    enabled: shouldUseApi,
  });

  // Filter preloaded customers by search query if no API search
  const filteredPreloaded = React.useMemo(() => {
    if (!preloadedCustomers || searchQuery.length === 0) return preloadedCustomers || [];
    const query = searchQuery.toLowerCase();
    return preloadedCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.customerNumber.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query)
    );
  }, [preloadedCustomers, searchQuery]);

  const customers: Customer[] = shouldUseApi
    ? customersData?.data || []
    : filteredPreloaded;
  
  // Find selected customer - check multiple sources
  const selectedCustomer = React.useMemo(() => {
    if (!value || value.trim() === '') return null;
    
    // First check the cached selected customer data
    if (selectedCustomerData && selectedCustomerData.id === value) {
      return selectedCustomerData;
    }
    
    // Then check current filtered list
    const fromList = customers.find((c) => c.id === value);
    if (fromList) return fromList;
    
    // Then check preloaded customers
    const fromPreloaded = preloadedCustomers?.find((c) => c.id === value);
    if (fromPreloaded) return fromPreloaded;
    
    // Finally check API data
    const fromApi = customersData?.data?.find((c: Customer) => c.id === value);
    return fromApi || null;
  }, [value, selectedCustomerData, customers, preloadedCustomers, customersData]);

  // Update cached selected customer when value changes
  React.useEffect(() => {
    if (value && selectedCustomer && selectedCustomer.id === value) {
      setSelectedCustomerData(selectedCustomer);
    } else if (!value) {
      setSelectedCustomerData(null);
    }
  }, [value, selectedCustomer]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('h-8 w-full justify-between text-sm font-normal', className)}
          title="Search by customer name, number, or email"
        >
          {selectedCustomer ? (
            <span className="truncate">
              {selectedCustomer.name} ({selectedCustomer.customerNumber})
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
            placeholder="Search by name, number, or email..."
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
                  {searchQuery ? (
                    <div className="py-6 text-center text-sm">
                      <p className="text-muted-foreground mb-2">No customers found.</p>
                      {onNewCustomer && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setOpen(false);
                            onNewCustomer();
                          }}
                          className="mt-2"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Create New Customer
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Start typing to search...
                    </div>
                  )}
                </CommandEmpty>
                <CommandGroup>
                  {customers.map((customer) => (
                    <CommandItem
                      key={customer.id}
                      value={customer.id}
                      onSelect={() => {
                        // Cache the selected customer data
                        setSelectedCustomerData(customer);
                        // Call the onChange handler with the customer ID
                        onValueChange(customer.id);
                        setOpen(false);
                        setSearchQuery('');
                      }}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === customer.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{customer.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {customer.customerNumber}
                          {customer.email && ` • ${customer.email}`}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
                {onNewCustomer && customers.length > 0 && (
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setOpen(false);
                        onNewCustomer();
                      }}
                      className="cursor-pointer border-t"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      <span>Create New Customer</span>
                    </CommandItem>
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}


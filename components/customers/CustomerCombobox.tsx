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
  // Check if preloaded customers array has items, not just if it exists (empty array is truthy)
  const hasPreloadedCustomers = preloadedCustomers && preloadedCustomers.length > 0;
  const shouldUseApi = open && (searchQuery.length > 0 || !hasPreloadedCustomers);
  
  const { data: customersData, isLoading } = useQuery({
    queryKey: ['customers', searchQuery],
    queryFn: () => fetchCustomers(searchQuery),
    enabled: shouldUseApi,
  });

  // Filter preloaded customers by search query if no API search
  const filteredPreloaded = React.useMemo(() => {
    const customersList = Array.isArray(preloadedCustomers) ? preloadedCustomers : [];
    if (!hasPreloadedCustomers || searchQuery.length === 0) return customersList;
    const query = searchQuery.toLowerCase();
    return customersList.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.customerNumber.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query)
    );
  }, [preloadedCustomers, searchQuery, hasPreloadedCustomers]);

  const customers: Customer[] = shouldUseApi
    ? (Array.isArray(customersData?.data) ? customersData.data : [])
    : (Array.isArray(filteredPreloaded) ? filteredPreloaded : []);
  
  // Fetch selected customer if we have a value but don't have the customer data
  // Use the list endpoint and search by ID (though not ideal, it works)
  const needsFetch = React.useMemo(() => {
    if (!value || value.trim() === '') return false;
    if (selectedCustomerData && selectedCustomerData.id === value) return false;
    if (customers.find((c) => c.id === value)) return false;
    if (preloadedCustomers?.find((c) => c.id === value)) return false;
    return true;
  }, [value, selectedCustomerData, customers, preloadedCustomers]);

  const { data: selectedCustomerDataFromApi, isLoading: isLoadingCustomer } = useQuery({
    queryKey: ['customer', value, 'by-id'],
    queryFn: async () => {
      if (!value || value.trim() === '') return null;
      // Try to fetch from the list endpoint - we'll search all customers
      // This is a workaround since there's no single customer endpoint
      const response = await fetch(apiUrl(`/api/customers?limit=1000`));
      if (!response.ok) return null;
      const data = await response.json();
      const found = data.data?.find((c: Customer) => c.id === value);
      return found || null;
    },
    enabled: needsFetch,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Find selected customer - check multiple sources
  const selectedCustomer = React.useMemo(() => {
    if (!value || value.trim() === '') return null;
    
    // First check the cached selected customer data
    if (selectedCustomerData && selectedCustomerData.id === value) {
      return selectedCustomerData;
    }
    
    // Check API-fetched customer data
    if (selectedCustomerDataFromApi && selectedCustomerDataFromApi.id === value) {
      return selectedCustomerDataFromApi;
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
  }, [value, selectedCustomerData, selectedCustomerDataFromApi, customers, preloadedCustomers, customersData]);

  // Update cached selected customer when value changes
  React.useEffect(() => {
    if (value && selectedCustomer && selectedCustomer.id === value) {
      setSelectedCustomerData(selectedCustomer);
    } else if (!value) {
      setSelectedCustomerData(null);
    }
  }, [value, selectedCustomer]);

  // Update cached data when API-fetched customer is available
  React.useEffect(() => {
    if (selectedCustomerDataFromApi && selectedCustomerDataFromApi.id === value) {
      setSelectedCustomerData(selectedCustomerDataFromApi);
    }
  }, [selectedCustomerDataFromApi, value]);

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
              {selectedCustomer.name} {selectedCustomer.customerNumber ? `(${selectedCustomer.customerNumber})` : ''}
            </span>
          ) : value && isLoadingCustomer ? (
            <span className="text-muted-foreground">Loading customer...</span>
          ) : value ? (
            <span className="text-muted-foreground">Customer ID: {value}</span>
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


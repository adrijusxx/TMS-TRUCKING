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

interface Trailer {
  id: string;
  trailerNumber: string;
  make?: string;
  model?: string;
  vin?: string;
}

interface TrailerComboboxProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  trailers?: Trailer[]; // Optional: pre-loaded trailers
  disabled?: boolean;
  selectedTrailer?: Trailer; // Optional: explicit selected trailer object
}

async function fetchTrailers(search?: string) {
  const queryParams = new URLSearchParams();
  queryParams.set('limit', '100');
  if (search) {
    queryParams.set('search', search);
  }
  // MC filtering handled server-side via cookies
  const url = apiUrl(`/api/trailers?${queryParams.toString()}`);
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch trailers');
  return response.json();
}

export default function TrailerCombobox({
  value,
  onValueChange,
  placeholder = 'Search trailer...',
  className,
  trailers: preloadedTrailers,
  disabled,
  selectedTrailer: explicitSelectedTrailer,
}: TrailerComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Always use API search when there's a query, otherwise use preloaded trailers if available
  const shouldUseApi = open && (searchQuery.length > 0 || !preloadedTrailers);

  const { data: trailersData, isLoading } = useQuery({
    queryKey: ['trailers', searchQuery],
    queryFn: () => fetchTrailers(searchQuery),
    enabled: shouldUseApi,
  });

  // Filter preloaded trailers by search query if no API search
  const filteredPreloaded = React.useMemo(() => {
    if (!preloadedTrailers || searchQuery.length === 0) return preloadedTrailers || [];
    const query = searchQuery.toLowerCase();
    return preloadedTrailers.filter(
      (t) =>
        t.trailerNumber.toLowerCase().includes(query) ||
        t.vin?.toLowerCase().includes(query) ||
        t.make?.toLowerCase().includes(query) ||
        t.model?.toLowerCase().includes(query)
    );
  }, [preloadedTrailers, searchQuery]);

  const trailers: Trailer[] = shouldUseApi
    ? (trailersData?.success ? trailersData?.data || [] : [])
    : filteredPreloaded;
  const selectedTrailer = trailers.find((t) => t.id === value) || (value && explicitSelectedTrailer?.id === value ? explicitSelectedTrailer : undefined);

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
          {selectedTrailer ? (
            <span className="truncate">
              #{selectedTrailer.trailerNumber}
              {selectedTrailer.make && selectedTrailer.model && ` - ${selectedTrailer.make} ${selectedTrailer.model}`}
            </span>
          ) : value ? (
            <span className="truncate">{value}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by trailer number, VIN, or make/model..."
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
                    {searchQuery ? 'No trailers found.' : 'Start typing to search...'}
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
                  {trailers.map((trailer) => (
                    <CommandItem
                      key={trailer.id}
                      value={trailer.trailerNumber}
                      onSelect={() => {
                        onValueChange(trailer.id);
                        setOpen(false);
                        setSearchQuery('');
                      }}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          'mr-2 h-3.5 w-3.5',
                          value === trailer.trailerNumber || value === trailer.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium text-xs">
                          #{trailer.trailerNumber}
                        </span>
                        {(trailer.make || trailer.model) && (
                          <span className="text-xs text-muted-foreground">
                            {trailer.make} {trailer.model}
                          </span>
                        )}
                        {trailer.vin && (
                          <span className="text-xs text-muted-foreground">
                            VIN: {trailer.vin}
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


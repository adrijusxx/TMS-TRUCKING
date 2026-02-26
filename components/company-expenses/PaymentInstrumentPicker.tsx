'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronsUpDown, CreditCard, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { apiUrl } from '@/lib/utils';

interface PaymentInstrument {
  id: string;
  name: string;
  institutionName: string;
  type: string;
  lastFour: string | null;
  color: string | null;
  isActive: boolean;
}

interface PaymentInstrumentPickerProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  mcNumberId?: string | null;
}

export function PaymentInstrumentPicker({
  value,
  onChange,
  placeholder = 'Select card / account...',
  disabled,
  mcNumberId,
}: PaymentInstrumentPickerProps) {
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['payment-instruments', mcNumberId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (mcNumberId) params.set('mcNumberId', mcNumberId);
      const res = await fetch(apiUrl(`/api/payment-instruments?${params}`));
      if (!res.ok) throw new Error('Failed to fetch instruments');
      const json = await res.json();
      return json.data as PaymentInstrument[];
    },
    staleTime: 30_000,
  });

  const selected = data?.find((i) => i.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isLoading}
          className="w-full justify-between font-normal"
        >
          {selected ? (
            <span className="flex items-center gap-1.5 truncate">
              <CreditCard className="h-3.5 w-3.5 shrink-0 opacity-60" />
              <span className="truncate">{selected.name}</span>
              {selected.lastFour && (
                <span className="text-muted-foreground text-xs">···{selected.lastFour}</span>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search cards & accounts..." />
          <CommandList>
            <CommandEmpty>No payment instruments found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__none__"
                onSelect={() => {
                  onChange(null);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn('mr-2 h-4 w-4', value == null ? 'opacity-100' : 'opacity-0')}
                />
                <span className="text-muted-foreground">— None / Cash</span>
              </CommandItem>
              {data?.map((instrument) => (
                <CommandItem
                  key={instrument.id}
                  value={`${instrument.name} ${instrument.institutionName} ${instrument.lastFour ?? ''}`}
                  onSelect={() => {
                    onChange(instrument.id === value ? null : instrument.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === instrument.id ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <div
                    className="mr-2 h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: instrument.color ?? '#6b7280' }}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="truncate font-medium text-sm">{instrument.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {instrument.institutionName}
                      {instrument.lastFour && ` · ···${instrument.lastFour}`}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

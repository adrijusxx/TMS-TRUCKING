'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown, Trash2 } from 'lucide-react';
import { TRANSACTION_TYPES } from './types';

interface TransactionFormProps {
  transaction: { deductionType: string; description: string; amount: string };
  setTransaction: (t: any) => void;
  customTypes: any[];
  category: 'addition' | 'deduction';
  openCombobox: boolean;
  setOpenCombobox: (v: boolean) => void;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  createCustomType: (name: string, category: 'addition' | 'deduction') => Promise<string>;
  deleteCustomType: (e: React.MouseEvent, templateId: string) => void;
}

export default function TransactionTypeCombobox({
  transaction, setTransaction, customTypes, category,
  openCombobox, setOpenCombobox, searchTerm, setSearchTerm,
  createCustomType, deleteCustomType,
}: TransactionFormProps) {
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Type *</Label>
        <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className={cn("w-full justify-between font-normal", !transaction.deductionType && "text-muted-foreground")}
            >
              {transaction.deductionType === 'OTHER' && transaction.description
                ? transaction.description
                : (TRANSACTION_TYPES[transaction.deductionType as keyof typeof TRANSACTION_TYPES]?.label || 'Select type...')}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search or create type..." value={searchTerm} onValueChange={setSearchTerm} />
              <CommandList>
                <CommandEmpty>
                  <Button
                    variant="ghost"
                    className="w-full text-sm justify-start h-auto py-1.5 px-2 font-normal"
                    onClick={async () => {
                      const foundKey = Object.keys(TRANSACTION_TYPES).find(key =>
                        TRANSACTION_TYPES[key as keyof typeof TRANSACTION_TYPES].label === searchTerm
                      );
                      if (foundKey) {
                        setTransaction({ ...transaction, deductionType: foundKey });
                        setOpenCombobox(false);
                        setSearchTerm('');
                        return;
                      }
                      await createCustomType(searchTerm, category);
                      setTransaction({ ...transaction, deductionType: 'OTHER', description: searchTerm });
                      setOpenCombobox(false);
                      setSearchTerm('');
                    }}
                  >
                    Create &quot;{searchTerm}&quot;
                  </Button>
                </CommandEmpty>
                {customTypes.length > 0 && (
                  <CommandGroup heading={category === 'addition' ? 'Additions' : 'Deductions'}>
                    {customTypes.map((ct: any) => (
                      <CommandItem
                        key={ct.id}
                        value={ct.name}
                        onSelect={() => {
                          setTransaction({ ...transaction, deductionType: 'OTHER', description: ct.name });
                          setOpenCombobox(false);
                          setSearchTerm('');
                        }}
                        className="justify-between"
                      >
                        <div className="flex items-center">
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              (transaction.deductionType === 'OTHER' && transaction.description === ct.name)
                                ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {ct.name}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                          onClick={(e) => deleteCustomType(e, ct.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <div className="space-y-2">
        <Label>Description *</Label>
        <Input
          placeholder={category === 'addition' ? 'e.g., Safety Bonus, Extra Hours' : 'Enter deduction description'}
          value={transaction.description}
          onChange={(e) => setTransaction({ ...transaction, description: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Amount *</Label>
        <Input
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={transaction.amount}
          onChange={(e) => setTransaction({ ...transaction, amount: e.target.value })}
        />
      </div>
    </div>
  );
}

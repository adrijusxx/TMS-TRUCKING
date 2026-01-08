'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { X, Plus, Calculator, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface RecurringTransaction {
  id: string;
  type: string;
  category: 'addition' | 'deduction';
  amount: number;
  frequency: string;
  note?: string;
  stopLimit?: number; // goalAmount
  currentBalance?: number; // currentAmount
}

interface RecurringTransactionsSectionProps {
  transactions: RecurringTransaction[];
  onTransactionsChange: (transactions: RecurringTransaction[]) => void;
  isReadOnly: boolean;
}

// Transaction types with their categories
const TRANSACTION_TYPES = {
  // Additions (Payments to driver)
  BONUS: { label: 'Bonus', category: 'addition' },
  OVERTIME: { label: 'Overtime', category: 'addition' },
  INCENTIVE: { label: 'Incentive', category: 'addition' },
  REIMBURSEMENT: { label: 'Reimbursement', category: 'addition' },

  // Deductions (Charges from driver)
  FUEL_ADVANCE: { label: 'Fuel Advance', category: 'deduction' },
  CASH_ADVANCE: { label: 'Cash Advance', category: 'deduction' },
  INSURANCE: { label: 'Insurance', category: 'deduction' },
  OCCUPATIONAL_ACCIDENT: { label: 'Occupational Accident', category: 'deduction' },
  TRUCK_PAYMENT: { label: 'Truck Payment', category: 'deduction' },
  LEASE: { label: 'Truck Lease', category: 'deduction' },
  ESCROW: { label: 'Escrow', category: 'deduction' },
  EQUIPMENT_RENTAL: { label: 'Equipment Rental', category: 'deduction' },
  ELD: { label: 'ELD', category: 'deduction' },
  MAINTENANCE: { label: 'Maintenance', category: 'deduction' },
  TOLLS: { label: 'Tolls', category: 'deduction' },
  PERMITS: { label: 'Permits', category: 'deduction' },
  FUEL_CARD: { label: 'Fuel Card', category: 'deduction' },
  FUEL_CARD_FEE: { label: 'Fuel Card Fee', category: 'deduction' },
  TRAILER_RENTAL: { label: 'Trailer Rental', category: 'deduction' },
  OTHER: { label: 'Other', category: 'deduction' },
} as const;

export function RecurringTransactionsSection({
  transactions,
  onTransactionsChange,
  isReadOnly,
}: RecurringTransactionsSectionProps) {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const [openComboboxId, setOpenComboboxId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const addTransaction = () => {
    const newTransaction: RecurringTransaction = {
      id: Date.now().toString(),
      type: '',
      category: 'deduction',
      amount: 0,
      frequency: 'WEEKLY',
      note: '',
    };
    onTransactionsChange([...transactions, newTransaction]);
  };

  const removeTransaction = (id: string) => {
    onTransactionsChange(transactions.filter((t) => t.id !== id));
  };

  const updateTransaction = (id: string, field: keyof RecurringTransaction, value: any) => {
    onTransactionsChange(
      transactions.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const handleTypeSelect = (id: string, typeValue: string) => {
    const config = TRANSACTION_TYPES[typeValue as keyof typeof TRANSACTION_TYPES];
    if (config) {
      updateTransaction(id, 'type', typeValue);
      // Optional: enforce category based on type
      updateTransaction(id, 'category', config.category);
    } else {
      updateTransaction(id, 'type', typeValue);
    }
    setOpenComboboxId(null);
    setSearchTerm('');
  };

  const totalAdditions = transactions
    .filter((t) => t.category === 'addition')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDeductions = transactions
    .filter((t) => t.category === 'deduction')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          <CardTitle>Recurring Payments & Deductions</CardTitle>
        </div>
        <CardDescription>
          Configure automatic payments (bonuses, overtime) and deductions (insurance, lease) applied to driver settlements
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Amount ($)</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Stop Limit</TableHead>
              <TableHead>Current Bal.</TableHead>
              <TableHead>Note</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No recurring transactions configured
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => {
                // Find label for current type key, or use raw value if custom
                const currentTypeLabel = TRANSACTION_TYPES[transaction.type as keyof typeof TRANSACTION_TYPES]?.label || transaction.type;

                return (
                  <TableRow
                    key={transaction.id}
                    className={transaction.category === 'addition' ? 'bg-green-50/50 hover:bg-green-50' : 'hover:bg-muted/50'}
                  >
                    <TableCell className="w-[200px]">
                      <Popover
                        open={openComboboxId === transaction.id}
                        onOpenChange={(open) => {
                          setOpenComboboxId(open ? transaction.id : null);
                          if (!open) setSearchTerm('');
                        }}
                      >
                        <PopoverTrigger asChild disabled={isReadOnly}>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between bg-background font-normal",
                              !transaction.type && "text-muted-foreground"
                            )}
                          >
                            {currentTypeLabel || "Select type..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0" align="start">
                          <Command>
                            <CommandInput
                              placeholder="Search or type custom..."
                              value={searchTerm}
                              onValueChange={setSearchTerm}
                            />
                            <CommandList>
                              {searchTerm && (
                                <CommandEmpty>
                                  <Button
                                    variant="ghost"
                                    className="w-full text-sm justify-start h-auto py-1.5 px-2 font-normal"
                                    onClick={() => handleTypeSelect(transaction.id, searchTerm)}
                                  >
                                    Create "{searchTerm}"
                                  </Button>
                                </CommandEmpty>
                              )}
                              <CommandGroup heading="Additions">
                                {Object.entries(TRANSACTION_TYPES)
                                  .filter(([_, config]) => config.category === 'addition')
                                  .map(([key, config]) => (
                                    <CommandItem
                                      key={key}
                                      value={config.label}
                                      onSelect={() => handleTypeSelect(transaction.id, key)}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          transaction.type === key ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {config.label}
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                              <CommandSeparator />
                              <CommandGroup heading="Deductions">
                                {Object.entries(TRANSACTION_TYPES)
                                  .filter(([_, config]) => config.category === 'deduction')
                                  .map(([key, config]) => (
                                    <CommandItem
                                      key={key}
                                      value={config.label}
                                      onSelect={() => handleTypeSelect(transaction.id, key)}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          transaction.type === key ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {config.label}
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={transaction.category}
                        onValueChange={(value) => updateTransaction(transaction.id, 'category', value as any)}
                        disabled={isReadOnly}
                      >
                        <SelectTrigger className={`w-36 bg-background ${transaction.category === 'addition' ? 'text-green-700 font-medium border-green-200' : 'text-red-700 font-medium border-red-200'}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="addition" className="text-green-700 font-medium">Addition (+)</SelectItem>
                          <SelectItem value="deduction" className="text-red-700 font-medium">Deduction (-)</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={transaction.amount}
                          onChange={(e) =>
                            updateTransaction(transaction.id, 'amount', parseFloat(e.target.value) || 0)
                          }
                          className="w-32 bg-background pl-6 font-medium"
                          disabled={isReadOnly}
                          readOnly={isReadOnly}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={transaction.frequency}
                        onValueChange={(value) => updateTransaction(transaction.id, 'frequency', value)}
                        disabled={isReadOnly}
                      >
                        <SelectTrigger className="w-32 bg-background" disabled={isReadOnly}>
                          <SelectValue placeholder="Frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="WEEKLY">Weekly</SelectItem>
                          <SelectItem value="MONTHLY">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                        <Input
                          type="number"
                          step="100"
                          min="0"
                          placeholder="No Limit"
                          value={transaction.stopLimit || ''}
                          onChange={(e) => updateTransaction(transaction.id, 'stopLimit', e.target.value ? parseFloat(e.target.value) : undefined)}
                          className="w-32 bg-background pl-6"
                          disabled={isReadOnly}
                          readOnly={isReadOnly}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 font-mono text-sm py-2">
                        <span className="text-muted-foreground">$</span>
                        <span>{transaction.currentBalance?.toFixed(2) || '0.00'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        value={transaction.note || ''}
                        onChange={(e) => updateTransaction(transaction.id, 'note', e.target.value)}
                        placeholder="Note..."
                        className="w-[140px] bg-background"
                        disabled={isReadOnly}
                        readOnly={isReadOnly}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTransaction(transaction.id)}
                        disabled={isReadOnly}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <Button type="button" variant="outline" onClick={addTransaction} disabled={isReadOnly}>
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
          <div className="text-sm space-y-1 text-right">
            <div className="flex items-center justify-end gap-3">
              <span className="text-muted-foreground">Total Additions:</span>
              <span className="font-medium text-green-600">${totalAdditions.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-end gap-3">
              <span className="text-muted-foreground">Total Deductions:</span>
              <span className="font-medium text-destructive">${totalDeductions.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Additions (Bonus, Reimbursement) increase driver pay. Deductions (Insurance, Lease) reduce driver pay.
        </p>
      </CardContent>
    </Card>
  );
}



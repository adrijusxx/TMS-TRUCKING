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
import { X, Plus, Calculator } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface RecurringTransaction {
  id: string;
  type: string;
  amount: number;
  frequency: string;
  note?: string;
}

interface RecurringTransactionsSectionProps {
  transactions: RecurringTransaction[];
  onTransactionsChange: (transactions: RecurringTransaction[]) => void;
  isReadOnly: boolean;
}

// Transaction types with their categories
// Note: LEASE and ELD are mapped to TRUCK_LEASE and EQUIPMENT_RENTAL respectively in the backend
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
  LEASE: { label: 'Truck Lease', category: 'deduction' }, // Maps to TRUCK_LEASE in backend
  ESCROW: { label: 'Escrow', category: 'deduction' },
  EQUIPMENT_RENTAL: { label: 'Equipment Rental', category: 'deduction' },
  ELD: { label: 'ELD', category: 'deduction' }, // Maps to EQUIPMENT_RENTAL in backend
  MAINTENANCE: { label: 'Maintenance', category: 'deduction' },
  TOLLS: { label: 'Tolls', category: 'deduction' },
  PERMITS: { label: 'Permits', category: 'deduction' },
  FUEL_CARD: { label: 'Fuel Card', category: 'deduction' },
  FUEL_CARD_FEE: { label: 'Fuel Card Fee', category: 'deduction' },
  TRAILER_RENTAL: { label: 'Trailer Rental', category: 'deduction' },
  OTHER: { label: 'Other', category: 'deduction' },
};

export function RecurringTransactionsSection({
  transactions,
  onTransactionsChange,
  isReadOnly,
}: RecurringTransactionsSectionProps) {
  const addTransaction = () => {
    const newTransaction: RecurringTransaction = {
      id: Date.now().toString(),
      type: '',
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

  const getCategory = (type: string): 'addition' | 'deduction' | null => {
    const transactionType = TRANSACTION_TYPES[type as keyof typeof TRANSACTION_TYPES];
    return transactionType ? transactionType.category as 'addition' | 'deduction' : null;
  };

  const totalAdditions = transactions
    .filter((t) => getCategory(t.type) === 'addition')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDeductions = transactions
    .filter((t) => getCategory(t.type) === 'deduction')
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
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Amount ($)</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Note</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No recurring transactions configured
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => {
                const category = getCategory(transaction.type);
                return (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <Select
                        value={transaction.type}
                        onValueChange={(value) => updateTransaction(transaction.id, 'type', value)}
                        disabled={isReadOnly}
                      >
                        <SelectTrigger className="w-48" disabled={isReadOnly}>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                            Additions (Payments)
                          </div>
                          {Object.entries(TRANSACTION_TYPES)
                            .filter(([_, config]) => config.category === 'addition')
                            .map(([key, config]) => (
                              <SelectItem key={key} value={key}>
                                {config.label}
                              </SelectItem>
                            ))}
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1">
                            Deductions
                          </div>
                          {Object.entries(TRANSACTION_TYPES)
                            .filter(([_, config]) => config.category === 'deduction')
                            .map(([key, config]) => (
                              <SelectItem key={key} value={key}>
                                {config.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {category === 'addition' && (
                        <Badge variant="default" className="bg-green-600">
                          Addition
                        </Badge>
                      )}
                      {category === 'deduction' && (
                        <Badge variant="destructive">Deduction</Badge>
                      )}
                      {!category && <Badge variant="outline">-</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="text-sm">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={transaction.amount}
                          onChange={(e) =>
                            updateTransaction(transaction.id, 'amount', parseFloat(e.target.value) || 0)
                          }
                          className="w-28"
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
                        <SelectTrigger className="w-32" disabled={isReadOnly}>
                          <SelectValue placeholder="Frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="WEEKLY">Weekly</SelectItem>
                          <SelectItem value="MONTHLY">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        value={transaction.note || ''}
                        onChange={(e) => updateTransaction(transaction.id, 'note', e.target.value)}
                        placeholder="Optional note"
                        className="w-32"
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
        <div className="mt-4 flex items-center justify-between">
          <Button type="button" variant="outline" onClick={addTransaction} disabled={isReadOnly}>
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
          <div className="text-sm space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Total Additions:</span>
              <span className="font-medium text-green-600">${totalAdditions.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Total Deductions:</span>
              <span className="font-medium text-destructive">${totalDeductions.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Note: These transactions will be applied automatically to driver settlements based on the frequency selected.
        </p>
      </CardContent>
    </Card>
  );
}



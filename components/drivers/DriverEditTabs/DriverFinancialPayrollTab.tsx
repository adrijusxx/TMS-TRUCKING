'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { X, Plus, DollarSign, Calculator, Shield, Lock, RotateCcw } from 'lucide-react';
import { PayType } from '@prisma/client';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { calculateDriverTariff } from '@/lib/utils/driverTariff';

interface DriverFinancialPayrollTabProps {
  driver: any;
  onSave: (data: any) => void;
}

interface RecurringDeductionRow {
  id: string;
  type: string;
  amount: number;
  frequency: string;
}

interface OtherPayRow {
  id: string;
  type: string;
  note: string;
  quantity: number;
  amount: number;
}

interface DeductionRow {
  id: string;
  type: string;
  note: string;
  quantity: number;
  amount: number;
}

interface BalanceRow {
  id: string;
  type: string;
  note: string;
  numberOfTransactions: number;
  debit: number;
  credit: number;
  balance: number;
}

const financialsSchema = z.object({
  payType: z.nativeEnum(PayType),
  payRate: z.number().min(0, 'Rate cannot be negative'),
  perDiem: z.number().min(0, 'Per diem cannot be negative').optional(),
  escrowTargetAmount: z.number().min(0, 'Target amount cannot be negative').optional(),
  escrowDeductionPerWeek: z.number().min(0, 'Deduction per week cannot be negative').optional(),
  driverTariff: z.string().optional(),
});

type FinancialsFormData = z.infer<typeof financialsSchema>;

export default function DriverFinancialPayrollTab({ driver, onSave }: DriverFinancialPayrollTabProps) {
  const { data: session } = useSession();
  const role = session?.user?.role as 'ADMIN' | 'ACCOUNTANT' | 'DISPATCHER' | 'DRIVER' | 'CUSTOMER';
  const isReadOnly = role === 'DISPATCHER';
  
  const [recurringDeductions, setRecurringDeductions] = useState<RecurringDeductionRow[]>([]);
  const [otherPayRows, setOtherPayRows] = useState<OtherPayRow[]>([]);
  const [deductionRows, setDeductionRows] = useState<DeductionRow[]>([]);
  const [balanceRows, setBalanceRows] = useState<BalanceRow[]>([
    {
      id: '1',
      type: 'ESCROW',
      note: '',
      numberOfTransactions: 0,
      debit: 0,
      credit: 0,
      balance: 0,
    },
  ]);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FinancialsFormData>({
    resolver: zodResolver(financialsSchema),
    defaultValues: {
      payType: driver.payType || 'PER_MILE',
      payRate: driver.payRate || 0,
      perDiem: driver.perDiem || undefined,
      escrowTargetAmount: driver.escrowTargetAmount || undefined,
      escrowDeductionPerWeek: driver.escrowDeductionPerWeek || undefined,
      driverTariff: driver.driverTariff || '',
    },
  });

  const payType = watch('payType');
  const payRate = watch('payRate');
  const driverTariff = watch('driverTariff');
  const escrowTargetAmount = watch('escrowTargetAmount') || 0;
  const escrowDeductionPerWeek = watch('escrowDeductionPerWeek') || 0;
  const escrowBalance = driver.escrowBalance || 0;

  const weeksToTarget = escrowTargetAmount > 0 && escrowDeductionPerWeek > 0
    ? Math.ceil((escrowTargetAmount - escrowBalance) / escrowDeductionPerWeek)
    : null;

  const otherPayTotal = otherPayRows.reduce((sum, row) => sum + row.quantity * row.amount, 0);
  const deductionTotal = deductionRows.reduce((sum, row) => sum + row.quantity * row.amount, 0);

  const addRecurringDeduction = () => {
    setRecurringDeductions([
      ...recurringDeductions,
      {
        id: Date.now().toString(),
        type: '',
        amount: 0,
        frequency: '',
      },
    ]);
  };

  const removeRecurringDeduction = (id: string) => {
    setRecurringDeductions(recurringDeductions.filter((row) => row.id !== id));
  };

  const updateRecurringDeduction = (id: string, field: keyof RecurringDeductionRow, value: any) => {
    setRecurringDeductions(
      recurringDeductions.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const addOtherPayRow = () => {
    setOtherPayRows([
      ...otherPayRows,
      {
        id: Date.now().toString(),
        type: '',
        note: '',
        quantity: 1,
        amount: 0,
      },
    ]);
  };

  const removeOtherPayRow = (id: string) => {
    setOtherPayRows(otherPayRows.filter((row) => row.id !== id));
  };

  const updateOtherPayRow = (id: string, field: keyof OtherPayRow, value: any) => {
    setOtherPayRows(
      otherPayRows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const addDeductionRow = () => {
    setDeductionRows([
      ...deductionRows,
      {
        id: Date.now().toString(),
        type: '',
        note: '',
        quantity: 1,
        amount: 0,
      },
    ]);
  };

  const removeDeductionRow = (id: string) => {
    setDeductionRows(deductionRows.filter((row) => row.id !== id));
  };

  const updateDeductionRow = (id: string, field: keyof DeductionRow, value: any) => {
    setDeductionRows(
      deductionRows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const addBalanceRow = () => {
    setBalanceRows([
      ...balanceRows,
      {
        id: Date.now().toString(),
        type: '',
        note: '',
        numberOfTransactions: 0,
        debit: 0,
        credit: 0,
        balance: 0,
      },
    ]);
  };

  const removeBalanceRow = (id: string) => {
    setBalanceRows(balanceRows.filter((row) => row.id !== id));
  };

  const updateBalanceRow = (id: string, field: keyof BalanceRow, value: any) => {
    setBalanceRows(
      balanceRows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleBacktrackCalculation = () => {
    const tariff = calculateDriverTariff({
      payType: payType as PayType,
      payRate: parseFloat(payRate.toString()),
      loads: driver.loads || [],
    });
    setValue('driverTariff', tariff);
  };

  const onSubmit = (data: FinancialsFormData) => {
    onSave({
      payType: data.payType,
      payRate: parseFloat(data.payRate.toString()),
      perDiem: data.perDiem ? parseFloat(data.perDiem.toString()) : undefined,
      escrowTargetAmount: data.escrowTargetAmount ? parseFloat(data.escrowTargetAmount.toString()) : undefined,
      escrowDeductionPerWeek: data.escrowDeductionPerWeek ? parseFloat(data.escrowDeductionPerWeek.toString()) : undefined,
      recurringDeductions: recurringDeductions.length > 0 ? recurringDeductions : undefined,
      driverTariff: data.driverTariff || undefined,
    });
  };

  useEffect(() => {
    const handleSave = () => {
      handleSubmit(onSubmit)();
    };
    
    window.addEventListener('driver-form-save', handleSave);
    return () => window.removeEventListener('driver-form-save', handleSave);
  }, [handleSubmit, recurringDeductions]);

  return (
    <form id="driver-financial-payroll-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {isReadOnly && (
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            You have read-only access to financial data. Only administrators and accountants can modify pay structure and deductions.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Pay Structure */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            <CardTitle>Pay Structure</CardTitle>
          </div>
          <CardDescription>
            {isReadOnly 
              ? 'View driver compensation method and rates (read-only)'
              : 'Configure driver compensation method and rates'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payType">
                Method <span className="text-destructive">*</span>
              </Label>
              <Select
                value={payType}
                onValueChange={(value) => setValue('payType', value as PayType)}
                disabled={isReadOnly}
              >
                <SelectTrigger id="payType" disabled={isReadOnly}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PER_MILE">CPM (Cents Per Mile)</SelectItem>
                  <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                  <SelectItem value="PER_LOAD">Flat (Per Load)</SelectItem>
                </SelectContent>
              </Select>
              {errors.payType && (
                <p className="text-sm text-destructive">{errors.payType.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="payRate">
                Rate <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-2">
                {payType === 'PERCENTAGE' ? (
                  <>
                    <Input
                      id="payRate"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('payRate', { valueAsNumber: true })}
                      placeholder="25"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </>
                ) : payType === 'PER_MILE' ? (
                  <>
                    <span className="text-sm text-muted-foreground">$</span>
                    <Input
                      id="payRate"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('payRate', { valueAsNumber: true })}
                      placeholder="0.60"
                      disabled={isReadOnly}
                      readOnly={isReadOnly}
                    />
                    <span className="text-sm text-muted-foreground">/mile</span>
                  </>
                ) : (
                  <>
                    <span className="text-sm text-muted-foreground">$</span>
                    <Input
                      id="payRate"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('payRate', { valueAsNumber: true })}
                      placeholder="500.00"
                    />
                  </>
                )}
              </div>
              {errors.payRate && (
                <p className="text-sm text-destructive">{errors.payRate.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {payType === 'PER_MILE' && 'e.g., 0.60 = $0.60 per mile'}
                {payType === 'PERCENTAGE' && 'e.g., 25 = 25% of load revenue'}
                {payType === 'PER_LOAD' && 'e.g., 500 = $500 per load'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="perDiem">Per Diem (Cents per mile tax-free)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="perDiem"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('perDiem', { valueAsNumber: true })}
                  placeholder="0.00"
                  disabled={isReadOnly}
                  readOnly={isReadOnly}
                />
                <span className="text-sm text-muted-foreground">cents/mile</span>
              </div>
              {errors.perDiem && (
                <p className="text-sm text-destructive">{errors.perDiem.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Tax-free per diem allowance (e.g., 0.10 = 10 cents per mile)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Tariff */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Tariff</CardTitle>
          <CardDescription>
            Display and calculate tariff information based on pay structure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="tariff" className="w-20">TARIFF</Label>
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 relative">
                <Input
                  id="tariff"
                  value={driverTariff}
                  onChange={(e) => setValue('driverTariff', e.target.value)}
                  placeholder="$0.65 per mile + 30 per stop"
                  disabled={isReadOnly}
                  readOnly={isReadOnly}
                />
                {driverTariff && !isReadOnly && (
                  <button
                    type="button"
                    onClick={() => setValue('driverTariff', '')}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleBacktrackCalculation}
                className="whitespace-nowrap"
                disabled={isReadOnly}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Backtrack calculation
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recurring Deductions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            <CardTitle>Recurring Deductions</CardTitle>
          </div>
          <CardDescription>
            Configure automatic deductions applied to driver settlements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Amount ($)</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recurringDeductions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No recurring deductions configured
                  </TableCell>
                </TableRow>
              ) : (
                recurringDeductions.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Select
                        value={row.type}
                        onValueChange={(value) => updateRecurringDeduction(row.id, 'type', value)}
                        disabled={isReadOnly}
                      >
                        <SelectTrigger className="w-40" disabled={isReadOnly}>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INSURANCE">Insurance</SelectItem>
                          <SelectItem value="ELD">ELD</SelectItem>
                          <SelectItem value="LEASE">Lease</SelectItem>
                          <SelectItem value="EQUIPMENT_RENTAL">Equipment Rental</SelectItem>
                          <SelectItem value="FUEL_CARD_FEE">Fuel Card Fee</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="text-sm">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={row.amount}
                          onChange={(e) =>
                            updateRecurringDeduction(row.id, 'amount', parseFloat(e.target.value) || 0)
                          }
                          className="w-24"
                          disabled={isReadOnly}
                          readOnly={isReadOnly}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={row.frequency}
                        onValueChange={(value) => updateRecurringDeduction(row.id, 'frequency', value)}
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
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRecurringDeduction(row.id)}
                        disabled={isReadOnly}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="mt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={addRecurringDeduction}
              disabled={isReadOnly}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Deduction
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Note: These deductions will be applied automatically to driver settlements based on the frequency selected.
          </p>
        </CardContent>
      </Card>

      {/* Weekly Other Pay */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Other Pay</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Total amount</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {otherPayRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Select
                      value={row.type}
                      onValueChange={(value) => updateOtherPayRow(row.id, 'type', value)}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger className="w-32" disabled={isReadOnly}>
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bonus">Bonus</SelectItem>
                        <SelectItem value="overtime">Overtime</SelectItem>
                        <SelectItem value="incentive">Incentive</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={row.note}
                      onValueChange={(value) => updateOtherPayRow(row.id, 'note', value)}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger className="w-32" disabled={isReadOnly}>
                        <SelectValue placeholder="Note" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={row.quantity}
                      onChange={(e) =>
                        updateOtherPayRow(row.id, 'quantity', parseFloat(e.target.value) || 0)
                      }
                      className="w-20"
                      disabled={isReadOnly}
                      readOnly={isReadOnly}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={row.amount}
                      onChange={(e) =>
                        updateOtherPayRow(row.id, 'amount', parseFloat(e.target.value) || 0)
                      }
                      className="w-24"
                      disabled={isReadOnly}
                      readOnly={isReadOnly}
                    />
                  </TableCell>
                  <TableCell>${(row.quantity * row.amount).toFixed(2)}</TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOtherPayRow(row.id)}
                      disabled={isReadOnly}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between mt-4">
            <Button type="button" variant="outline" onClick={addOtherPayRow} disabled={isReadOnly}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
            <div className="text-right">
              <span className="font-medium">Total amount: </span>
              <span className="text-lg">${otherPayTotal.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Deductions */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Deductions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Total amount</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deductionRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Select
                      value={row.type}
                      onValueChange={(value) => updateDeductionRow(row.id, 'type', value)}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger className="w-32" disabled={isReadOnly}>
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="insurance">Insurance</SelectItem>
                        <SelectItem value="fuel">Fuel</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={row.note}
                      onValueChange={(value) => updateDeductionRow(row.id, 'note', value)}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger className="w-32" disabled={isReadOnly}>
                        <SelectValue placeholder="Note" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={row.quantity}
                      onChange={(e) =>
                        updateDeductionRow(row.id, 'quantity', parseFloat(e.target.value) || 0)
                      }
                      className="w-20"
                      disabled={isReadOnly}
                      readOnly={isReadOnly}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={row.amount}
                      onChange={(e) =>
                        updateDeductionRow(row.id, 'amount', parseFloat(e.target.value) || 0)
                      }
                      className="w-24"
                      disabled={isReadOnly}
                      readOnly={isReadOnly}
                    />
                  </TableCell>
                  <TableCell>${(row.quantity * row.amount).toFixed(2)}</TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDeductionRow(row.id)}
                      disabled={isReadOnly}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={addDeductionRow} disabled={isReadOnly}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
            <div className="text-right">
              <span className="font-medium">Total amount: </span>
              <span className="text-lg">${deductionTotal.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Driver Balances */}
      <Card>
        <CardHeader>
          <CardTitle>Driver Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Number of transactions</TableHead>
                <TableHead>Debit</TableHead>
                <TableHead>Credit</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {balanceRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    {row.type ? (
                      <span>{row.type}</span>
                    ) : (
                      <Select
                        value={row.type}
                        onValueChange={(value) => updateBalanceRow(row.id, 'type', value)}
                        disabled={isReadOnly}
                      >
                        <SelectTrigger className="w-32" disabled={isReadOnly}>
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ESCROW">ESCROW</SelectItem>
                          <SelectItem value="ADVANCE">Advance</SelectItem>
                          <SelectItem value="LOAN">Loan</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell>
                    <Input
                      value={row.note}
                      onChange={(e) => updateBalanceRow(row.id, 'note', e.target.value)}
                      placeholder="Note"
                      className="w-32"
                      disabled={isReadOnly}
                      readOnly={isReadOnly}
                    />
                  </TableCell>
                  <TableCell>{row.numberOfTransactions}</TableCell>
                  <TableCell>${row.debit.toFixed(2)}</TableCell>
                  <TableCell>${row.credit.toFixed(2)}</TableCell>
                  <TableCell>${row.balance.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {row.type && (
                        <Button type="button" variant="outline" size="sm" disabled={isReadOnly}>
                          Transactions
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBalanceRow(row.id)}
                        disabled={isReadOnly}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4">
            <Button type="button" variant="outline" onClick={addBalanceRow} disabled={isReadOnly}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Escrow / Holdings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Escrow / Holdings</CardTitle>
          </div>
          <CardDescription>
            Configure escrow target and automatic weekly deductions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="escrowTargetAmount">Target Amount</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">$</span>
                <Input
                  id="escrowTargetAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('escrowTargetAmount', { valueAsNumber: true })}
                  placeholder="2500.00"
                  disabled={isReadOnly}
                  readOnly={isReadOnly}
                />
              </div>
              {errors.escrowTargetAmount && (
                <p className="text-sm text-destructive">{errors.escrowTargetAmount.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Target escrow balance (e.g., $2,500)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="escrowDeductionPerWeek">Deduction Per Week</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">$</span>
                <Input
                  id="escrowDeductionPerWeek"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('escrowDeductionPerWeek', { valueAsNumber: true })}
                  placeholder="100.00"
                  disabled={isReadOnly}
                  readOnly={isReadOnly}
                />
              </div>
              {errors.escrowDeductionPerWeek && (
                <p className="text-sm text-destructive">{errors.escrowDeductionPerWeek.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Weekly deduction amount (e.g., $100)
              </p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="space-y-2">
              <Label>Current Balance (Read-Only)</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">$</span>
                <Input
                  type="number"
                  value={escrowBalance.toFixed(2)}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Current escrow balance (calculated from settlements)
              </p>
              {escrowTargetAmount > 0 && escrowDeductionPerWeek > 0 && weeksToTarget !== null && (
                <p className="text-sm text-muted-foreground mt-2">
                  {weeksToTarget > 0 ? (
                    <>
                      <span className="font-medium">{weeksToTarget}</span> week{weeksToTarget !== 1 ? 's' : ''} remaining to reach target
                    </>
                  ) : (
                    <span className="text-green-600 font-medium">Target reached</span>
                  )}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}


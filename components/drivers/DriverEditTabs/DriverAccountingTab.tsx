'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import { X, Plus, ChevronDown, RotateCcw } from 'lucide-react';
import { PayType } from '@prisma/client';
import { calculateDriverTariff } from '@/lib/utils/driverTariff';

interface DriverAccountingTabProps {
  driver: any;
  onSave: (data: any) => void;
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

export default function DriverAccountingTab({ driver, onSave }: DriverAccountingTabProps) {
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      payType: driver.payType || 'PER_MILE',
      payRate: driver.payRate || 0.63,
      driverTariff: driver.driverTariff || '',
    },
  });

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

  const payType = watch('payType');
  const payRate = watch('payRate');
  const driverTariff = watch('driverTariff');

  // Calculate total for other pay
  const otherPayTotal = otherPayRows.reduce((sum, row) => sum + row.quantity * row.amount, 0);

  // Calculate total for deductions
  const deductionTotal = deductionRows.reduce((sum, row) => sum + row.quantity * row.amount, 0);

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
    // Calculate tariff from pay type and rate
    const tariff = calculateDriverTariff({
      payType: payType as PayType,
      payRate: parseFloat(payRate.toString()),
      loads: driver.loads || [],
    });
    setValue('driverTariff', tariff);
  };

  const onSubmit = (data: any) => {
    onSave({
      payType: data.payType,
      payRate: parseFloat(data.payRate),
      driverTariff: data.driverTariff || undefined,
    });
  };

  // Save when main Save button is clicked
  useEffect(() => {
    const handleSave = () => {
      const formData = watch();
      if (formData.payType && formData.payRate) {
        onSubmit(formData);
      }
    };
    
    window.addEventListener('driver-form-save', handleSave);
    return () => window.removeEventListener('driver-form-save', handleSave);
  }, [watch]);

  return (
    <div className="space-y-6">
      {/* Payment Tariff */}
      <Card>
        <CardHeader>
          <CardTitle>Payment tariff</CardTitle>
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
                />
                {driverTariff && (
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
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Backtrack calculation
              </Button>
            </div>
            <Select
              value=""
              onValueChange={() => {}}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="+ Add one time charges" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="charge1">One-time Charge 1</SelectItem>
                <SelectItem value="charge2">One-time Charge 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="payType" className="w-20">Pay Type</Label>
            <Select
              value={payType}
              onValueChange={(value) => setValue('payType', value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PER_MILE">Per Mile</SelectItem>
                <SelectItem value="PER_LOAD">Per Load</SelectItem>
                <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                <SelectItem value="HOURLY">Hourly</SelectItem>
              </SelectContent>
            </Select>
            <Label htmlFor="payRate" className="ml-4">Pay Rate</Label>
            <Input
              id="payRate"
              type="number"
              step="0.01"
              {...register('payRate', { valueAsNumber: true })}
              className="w-32"
            />
            <Button type="button" variant="outline" size="sm">
              Open
            </Button>
          </div>
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
                    >
                      <SelectTrigger className="w-32">
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
                    >
                      <SelectTrigger className="w-32">
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
                    />
                  </TableCell>
                  <TableCell>${(row.quantity * row.amount).toFixed(2)}</TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOtherPayRow(row.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between mt-4">
            <Button type="button" variant="outline" onClick={addOtherPayRow}>
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
                    >
                      <SelectTrigger className="w-32">
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
                    >
                      <SelectTrigger className="w-32">
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
                    />
                  </TableCell>
                  <TableCell>${(row.quantity * row.amount).toFixed(2)}</TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDeductionRow(row.id)}
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
              <Button type="button" variant="outline" onClick={addDeductionRow}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
              <Button type="button" variant="outline">
                + Deduction tariff
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
                      >
                        <SelectTrigger className="w-32">
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
                    {row.type ? (
                      <Input
                        value={row.note}
                        onChange={(e) => updateBalanceRow(row.id, 'note', e.target.value)}
                        placeholder="Note"
                        className="w-32"
                      />
                    ) : (
                      <Input
                        value={row.note}
                        onChange={(e) => updateBalanceRow(row.id, 'note', e.target.value)}
                        placeholder="Note"
                        className="w-32"
                      />
                    )}
                  </TableCell>
                  <TableCell>{row.numberOfTransactions}</TableCell>
                  <TableCell>${row.debit.toFixed(2)}</TableCell>
                  <TableCell>${row.credit.toFixed(2)}</TableCell>
                  <TableCell>${row.balance.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {row.type && (
                        <Button type="button" variant="outline" size="sm">
                          Transactions
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBalanceRow(row.id)}
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
            <Button type="button" variant="outline" onClick={addBalanceRow}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

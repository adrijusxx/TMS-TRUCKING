'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { X, Plus } from 'lucide-react';

export interface BalanceRow {
  id: string;
  type: string;
  note: string;
  numberOfTransactions: number;
  debit: number;
  credit: number;
  balance: number;
}

interface DriverBalancesSectionProps {
  balances: BalanceRow[];
  onBalancesChange: (balances: BalanceRow[]) => void;
  isReadOnly: boolean;
}

export function DriverBalancesSection({
  balances,
  onBalancesChange,
  isReadOnly,
}: DriverBalancesSectionProps) {
  const addBalance = () => {
    const newBalance: BalanceRow = {
      id: Date.now().toString(),
      type: '',
      note: '',
      numberOfTransactions: 0,
      debit: 0,
      credit: 0,
      balance: 0,
    };
    onBalancesChange([...balances, newBalance]);
  };

  const removeBalance = (id: string) => {
    onBalancesChange(balances.filter((b) => b.id !== id));
  };

  const updateBalance = (id: string, field: keyof BalanceRow, value: any) => {
    onBalancesChange(balances.map((b) => (b.id === id ? { ...b, [field]: value } : b)));
  };

  return (
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
            {balances.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  {row.type ? (
                    <span>{row.type}</span>
                  ) : (
                    <Select
                      value={row.type}
                      onValueChange={(value) => updateBalance(row.id, 'type', value)}
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
                    onChange={(e) => updateBalance(row.id, 'note', e.target.value)}
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
                      onClick={() => removeBalance(row.id)}
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
          <Button type="button" variant="outline" onClick={addBalance} disabled={isReadOnly}>
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}








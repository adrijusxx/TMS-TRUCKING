'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { getTransactionLabel } from './types';
import { Landmark } from 'lucide-react';

interface SettlementDriverBalancesProps {
  driver: any;
  escrowItems?: any[];
}

export default function SettlementDriverBalances({ driver, escrowItems }: SettlementDriverBalancesProps) {
  if (!driver) return null;

  const hasEscrow = driver.escrowTargetAmount || driver.escrowDeductionPerWeek || driver.escrowBalance > 0;
  const hasEscrowItems = escrowItems && escrowItems.length > 0;

  const target = driver.escrowTargetAmount || 0;
  const balance = driver.escrowBalance || 0;
  const weeklyRate = driver.escrowDeductionPerWeek || 0;
  const progressPct = target > 0 ? Math.min((balance / target) * 100, 100) : 0;
  const remaining = target > 0 ? Math.max(target - balance, 0) : 0;
  const weeksRemaining = weeklyRate > 0 && remaining > 0 ? Math.ceil(remaining / weeklyRate) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Landmark className="h-5 w-5" />
          Driver Balances
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasEscrow ? (
          <>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Escrow</span>
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(balance)} {target > 0 && `/ ${formatCurrency(target)}`}
                </span>
              </div>
              {target > 0 && (
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div
                    className="bg-primary rounded-full h-2.5 transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {weeklyRate > 0 && (
                <div>
                  <p className="text-muted-foreground">Weekly Deduction</p>
                  <p className="font-medium">{formatCurrency(weeklyRate)}</p>
                </div>
              )}
              {weeksRemaining > 0 && (
                <div>
                  <p className="text-muted-foreground">Est. Weeks Remaining</p>
                  <p className="font-medium">{weeksRemaining}</p>
                </div>
              )}
              {remaining > 0 && (
                <div>
                  <p className="text-muted-foreground">Remaining</p>
                  <p className="font-medium">{formatCurrency(remaining)}</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">No balances configured for this driver.</p>
        )}
        {hasEscrowItems && (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {escrowItems!.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>{getTransactionLabel(item.deductionType, item.description)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                    <TableCell className="text-right">{item.quantity ?? 1}</TableCell>
                    <TableCell className="text-right font-medium text-red-600">
                      -{formatCurrency(item.amount * (item.quantity ?? 1))}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{item.description || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

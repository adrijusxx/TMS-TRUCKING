'use client';

import * as React from 'react';
import { formatCurrency } from '@/lib/utils';

interface InvoiceSummaryTotalsProps {
  filteredTotals: {
    accrual: number;
    paid: number;
    balance: number;
  };
  grandTotals?: {
    accrual: number;
    paid: number;
    balance: number;
  };
}

export function InvoiceSummaryTotals({
  filteredTotals,
  grandTotals,
}: InvoiceSummaryTotalsProps) {
  return (
    <div className="flex flex-col gap-1 py-2 text-sm">
      <div className="font-medium">
        Total accrual: {formatCurrency(filteredTotals.accrual)} Total paid:{' '}
        {formatCurrency(filteredTotals.paid)} Total ending balance:{' '}
        {formatCurrency(filteredTotals.balance)}
      </div>
      {grandTotals && (
        <div className="text-muted-foreground text-xs">
          (All invoices: Accrual: {formatCurrency(grandTotals.accrual)} Paid:{' '}
          {formatCurrency(grandTotals.paid)} Balance:{' '}
          {formatCurrency(grandTotals.balance)})
        </div>
      )}
    </div>
  );
}


























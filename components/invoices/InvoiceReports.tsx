'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { formatCurrency, apiUrl } from '@/lib/utils';
import { Download } from 'lucide-react';

async function fetchInvoiceReports(fromDate?: string, toDate?: string) {
  const params = new URLSearchParams();
  if (fromDate) params.set('fromDate', fromDate);
  if (toDate) params.set('toDate', toDate);

  const response = await fetch(apiUrl(`/api/invoices/reports?${params}`));
  if (!response.ok) throw new Error('Failed to fetch reports');
  return response.json();
}

export default function InvoiceReports() {
  const [fromDate, setFromDate] = useState('2022-01-01');
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

  const { data, isLoading } = useQuery({
    queryKey: ['invoice-reports', fromDate, toDate],
    queryFn: () => fetchInvoiceReports(fromDate, toDate),
  });

  const customers = data?.data?.customers || [];
  const totals = data?.data?.totals || {};

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-muted-foreground">
            Customer summary reports
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="space-y-2">
          <Label htmlFor="fromDate">FROM DATE</Label>
          <Input
            id="fromDate"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="toDate">TO DATE</Label>
          <Input
            id="toDate"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading reports...</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer name</TableHead>
                <TableHead>Customer ID</TableHead>
                <TableHead className="text-right">Beginning balance</TableHead>
                <TableHead className="text-right">Accrual</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Ending balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer: any) => (
                <TableRow key={customer.customerId}>
                  <TableCell className="font-medium">{customer.customerName}</TableCell>
                  <TableCell>{customer.customerNumber || customer.customerId}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(customer.beginningBalance)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(customer.accrual)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(customer.paid)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(customer.endingBalance)}
                  </TableCell>
                </TableRow>
              ))}
              {totals && (
                <TableRow className="font-bold">
                  <TableCell colSpan={2}>Total</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(totals.beginningBalance || 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(totals.accrual || 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(totals.paid || 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(totals.endingBalance || 0)}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}


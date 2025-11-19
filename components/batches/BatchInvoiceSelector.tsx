'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency, formatDate, apiUrl } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: {
    name: string;
    customerNumber: string;
  };
  invoiceDate: string;
  total: number;
  status: string;
  mcNumber: string | null;
}

interface BatchInvoiceSelectorProps {
  selectedInvoiceIds: string[];
  onSelectionChange: (ids: string[]) => void;
  excludeInvoiceIds?: string[];
}

async function fetchAvailableInvoices() {
  const response = await fetch(apiUrl('/api/invoices?limit=1000&status=INVOICED,SENT'));
  if (!response.ok) throw new Error('Failed to fetch invoices');
  return response.json();
}

export default function BatchInvoiceSelector({
  selectedInvoiceIds,
  onSelectionChange,
  excludeInvoiceIds = [],
}: BatchInvoiceSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['available-invoices'],
    queryFn: fetchAvailableInvoices,
  });

  const invoices: Invoice[] = (data?.data || []).filter(
    (inv: Invoice) => !excludeInvoiceIds.includes(inv.id)
  );

  const filteredInvoices = invoices.filter((invoice) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      invoice.invoiceNumber.toLowerCase().includes(query) ||
      invoice.customer.name.toLowerCase().includes(query) ||
      (invoice.mcNumber && invoice.mcNumber.toLowerCase().includes(query))
    );
  });

  const handleToggleInvoice = (invoiceId: string) => {
    if (selectedInvoiceIds.includes(invoiceId)) {
      onSelectionChange(selectedInvoiceIds.filter((id) => id !== invoiceId));
    } else {
      onSelectionChange([...selectedInvoiceIds, invoiceId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedInvoiceIds.length === filteredInvoices.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(filteredInvoices.map((inv) => inv.id));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Search Invoices</Label>
        <Input
          placeholder="Search by invoice number, customer, or MC number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="border rounded-lg max-h-96 overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    filteredInvoices.length > 0 &&
                    filteredInvoices.every((inv) => selectedInvoiceIds.includes(inv.id))
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>MC Number</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No invoices available
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedInvoiceIds.includes(invoice.id)}
                      onCheckedChange={() => handleToggleInvoice(invoice.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{invoice.customer.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {invoice.customer.customerNumber}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                  <TableCell>{invoice.mcNumber || '-'}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(invoice.total)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedInvoiceIds.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {selectedInvoiceIds.length} invoice(s) selected
        </div>
      )}
    </div>
  );
}


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
  dueDate: string;
  total: number;
  balance: number;
  amountPaid: number;
  status: string;
  mcNumber: string | null;
}

interface BatchInvoiceSelectorProps {
  selectedInvoiceIds: string[];
  onSelectionChange: (ids: string[]) => void;
  excludeInvoiceIds?: string[];
}

async function fetchAvailableInvoices() {
  // Fetch all invoices
  const response = await fetch(apiUrl('/api/invoices?limit=1000'));
  if (!response.ok) throw new Error('Failed to fetch invoices');
  const invoiceData = await response.json();
  
  // Fetch all batches to get invoice IDs that are already in batches
  const batchesResponse = await fetch(apiUrl('/api/batches?limit=1000'));
  const invoiceIdsInBatches = new Set<string>();
  
  if (batchesResponse.ok) {
    const batchesData = await batchesResponse.json();
    if (batchesData.success && batchesData.data) {
      // Extract invoice IDs from all batches
      for (const batch of batchesData.data) {
        if (batch.items && Array.isArray(batch.items)) {
          for (const item of batch.items) {
            if (item.invoiceId) {
              invoiceIdsInBatches.add(item.invoiceId);
            }
            if (item.invoice && item.invoice.id) {
              invoiceIdsInBatches.add(item.invoice.id);
            }
          }
        }
      }
    }
  }
  
  // Filter invoices: exclude PAID invoices and those already in batches
  if (invoiceData.success && invoiceData.data) {
    invoiceData.data = invoiceData.data.filter((inv: Invoice) => {
      // Exclude PAID invoices
      if (inv.status === 'PAID') return false;
      // Exclude invoices already in batches
      if (invoiceIdsInBatches.has(inv.id)) return false;
      return true;
    });
  }
  
  return invoiceData;
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
      invoice.customer.customerNumber.toLowerCase().includes(query) ||
      (invoice.mcNumber && invoice.mcNumber.toLowerCase().includes(query)) ||
      invoice.status.toLowerCase().includes(query)
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
    <div className="space-y-4 h-full flex flex-col min-h-0">
      <div className="space-y-2 flex-shrink-0">
        <Label>Search Invoices</Label>
        <Input
          placeholder="Search by invoice number, customer, or MC number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="border rounded-lg flex-1 min-h-0 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
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
              <TableHead>Invoice Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>MC Number</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No invoices available
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => {
                const isSelected = selectedInvoiceIds.includes(invoice.id);
                const isOverdue = invoice.dueDate && new Date(invoice.dueDate) < new Date();
                return (
                  <TableRow 
                    key={invoice.id}
                    className={isSelected ? 'bg-muted/50' : ''}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
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
                    <TableCell>
                      <div className={isOverdue ? 'text-red-600 font-medium' : ''}>
                        {formatDate(invoice.dueDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        invoice.status === 'SENT' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        invoice.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                      }`}>
                        {invoice.status}
                      </span>
                    </TableCell>
                    <TableCell>{invoice.mcNumber || '-'}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(invoice.total)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(invoice.balance || invoice.total)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        </div>
      </div>

      {selectedInvoiceIds.length > 0 && (
        <div className="text-sm text-muted-foreground flex-shrink-0 pt-2 border-t">
          <strong>{selectedInvoiceIds.length}</strong> invoice(s) selected
        </div>
      )}
    </div>
  );
}


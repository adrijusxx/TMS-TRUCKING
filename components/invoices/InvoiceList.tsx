'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Plus, Search, Filter, Download } from 'lucide-react';
import { exportToCSV, formatDateForExport, formatCurrencyForExport } from '@/lib/export';
import { formatCurrency, formatDate, apiUrl } from '@/lib/utils';
import { InvoiceStatus } from '@prisma/client';
import AdvancedFilters from '@/components/filters/AdvancedFilters';
import SavedFilters from '@/components/filters/SavedFilters';
import InvoiceListStats from '@/components/invoices/InvoiceListStats';
import InvoiceQuickView from '@/components/invoices/InvoiceQuickView';
import { useKeyboardShortcuts, commonShortcuts } from '@/lib/hooks/useKeyboardShortcuts';

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
  status: InvoiceStatus;
  subtotal: number;
  tax: number;
  paidAmount?: number;
}

const statusColors: Record<InvoiceStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 border-gray-200',
  SENT: 'bg-blue-100 text-blue-800 border-blue-200',
  PARTIAL: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PAID: 'bg-green-100 text-green-800 border-green-200',
  OVERDUE: 'bg-red-100 text-red-800 border-red-200',
  CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200',
};

function formatStatus(status: InvoiceStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

async function fetchInvoices(params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  [key: string]: any;
}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.status) queryParams.set('status', params.status);
  if (params.search) queryParams.set('search', params.search);
  
  // Add advanced filters
  Object.keys(params).forEach((key) => {
    if (!['page', 'limit', 'status', 'search'].includes(key) && params[key]) {
      queryParams.set(key, params[key].toString());
    }
  });

  const response = await fetch(apiUrl(`/api/invoices?${queryParams}`));
  if (!response.ok) throw new Error('Failed to fetch invoices');
  return response.json();
}

export default function InvoiceList() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>({});
  const [searchInputRef, setSearchInputRef] = useState<HTMLInputElement | null>(null);
  const [quickViewInvoiceId, setQuickViewInvoiceId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['invoices', page, statusFilter, searchQuery, advancedFilters],
    queryFn: () =>
      fetchInvoices({
        page,
        limit: 20,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery || undefined,
        ...advancedFilters,
      }),
  });

  const invoices: Invoice[] = data?.data || [];
  const meta = data?.meta;

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      ...commonShortcuts.newLoad,
      action: () => {
        window.location.href = '/dashboard/invoices/generate';
      },
    },
    {
      ...commonShortcuts.search,
      action: () => {
        searchInputRef?.focus();
      },
    },
    {
      ...commonShortcuts.refresh,
      action: () => {
        refetch();
      },
    },
  ]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">
            Manage invoices and payments
          </p>
        </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => {
            const exportData = invoices.map((invoice) => ({
              'Invoice Number': invoice.invoiceNumber,
              'Customer': invoice.customer.name,
              'Invoice Date': formatDateForExport(invoice.invoiceDate),
              'Due Date': formatDateForExport(invoice.dueDate),
              'Status': invoice.status,
              'Subtotal': formatCurrencyForExport(invoice.subtotal),
              'Tax': formatCurrencyForExport(invoice.tax),
              'Total': formatCurrencyForExport(invoice.total),
              'Paid Amount': formatCurrencyForExport(invoice.paidAmount || 0),
              'Balance': formatCurrencyForExport(invoice.total - (invoice.paidAmount || 0)),
            }));
            exportToCSV(
              exportData,
              ['Invoice Number', 'Customer', 'Invoice Date', 'Due Date', 'Status', 'Subtotal', 'Tax', 'Total', 'Paid Amount', 'Balance'],
              `invoices-export-${new Date().toISOString().split('T')[0]}.csv`
            );
          }}
          disabled={invoices.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
        <Link href="/dashboard/invoices/aging">
          <Button variant="outline">
            Aging Report
          </Button>
        </Link>
        <Link href="/dashboard/invoices/generate">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Generate Invoice
          </Button>
        </Link>
      </div>
      </div>

      <InvoiceListStats filters={{ ...advancedFilters, status: statusFilter, search: searchQuery }} />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={setSearchInputRef}
            placeholder="Search by invoice number or customer... (Ctrl+K)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.keys(statusColors).map((status) => (
              <SelectItem key={status} value={status}>
                {formatStatus(status as InvoiceStatus)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 flex-wrap">
          <AdvancedFilters
            filters={[
              { field: 'customerId', label: 'Customer ID', type: 'text' },
              { field: 'invoiceDate', label: 'Invoice Date', type: 'date' },
              { field: 'dueDate', label: 'Due Date', type: 'date' },
              { field: 'minTotal', label: 'Min Total', type: 'number' },
            ]}
            onApply={(filters) => {
              setAdvancedFilters(filters);
              setPage(1);
            }}
            onClear={() => {
              setAdvancedFilters({});
              setPage(1);
            }}
          />
          <SavedFilters
            entityType="invoices"
            currentFilters={{ ...advancedFilters, status: statusFilter, search: searchQuery }}
            onApplyFilter={(filters) => {
              const { status, search, ...rest } = filters;
              if (status) setStatusFilter(status);
              if (search) setSearchQuery(search);
              setAdvancedFilters(rest);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-8">Loading invoices...</div>
      ) : error ? (
        <div className="text-center py-8 text-destructive">
          Error loading invoices. Please try again.
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">No invoices found</p>
          <p className="text-muted-foreground mb-4">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Generate your first invoice from completed loads'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <Link href="/dashboard/invoices/generate">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Generate Invoice
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead>Tax</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      <button
                        onClick={() => setQuickViewInvoiceId(invoice.id)}
                        className="text-primary hover:underline text-left"
                      >
                        {invoice.invoiceNumber}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{invoice.customer.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {invoice.customer.customerNumber}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell>{formatCurrency(invoice.subtotal)}</TableCell>
                    <TableCell>{formatCurrency(invoice.tax)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(invoice.total)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColors[invoice.status as InvoiceStatus]}
                      >
                        {formatStatus(invoice.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/invoices/${invoice.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((page - 1) * 20) + 1} to{' '}
                {Math.min(page * 20, meta.total)} of {meta.total} invoices
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= meta.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <InvoiceQuickView
        invoiceId={quickViewInvoiceId}
        open={!!quickViewInvoiceId}
        onOpenChange={(open) => {
          if (!open) setQuickViewInvoiceId(null);
        }}
      />
    </div>
  );
}


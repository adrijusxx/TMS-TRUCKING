'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { FileText, Plus, Search, Filter, Download, Upload, Settings2, Package } from 'lucide-react';
import { exportToCSV, formatDateForExport, formatCurrencyForExport } from '@/lib/export';
import { formatCurrency, formatDate, apiUrl } from '@/lib/utils';
import { InvoiceStatus } from '@prisma/client';
import { getAgingInfo } from '@/lib/utils/aging';
import AdvancedFilters from '@/components/filters/AdvancedFilters';
import SavedFilters from '@/components/filters/SavedFilters';
import InvoiceListStats from '@/components/invoices/InvoiceListStats';
import InvoiceQuickView from '@/components/invoices/InvoiceQuickView';
import InvoiceImportDialog from '@/components/invoices/InvoiceImportDialog';
import CreateBatchForm from '@/components/batches/CreateBatchForm';
import { Checkbox } from '@/components/ui/checkbox';
import { useKeyboardShortcuts, commonShortcuts } from '@/lib/hooks/useKeyboardShortcuts';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Invoice {
  id: string;
  invoiceNumber: string;
  loadId?: string | null;
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
  mcNumber?: string | null;
  subStatus?: string | null;
  reconciliationStatus?: string;
  invoiceNote?: string | null;
  paymentNote?: string | null;
}

const statusColors: Record<InvoiceStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 border-gray-200',
  SENT: 'bg-blue-100 text-blue-800 border-blue-200',
  PARTIAL: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PAID: 'bg-green-100 text-green-800 border-green-200',
  OVERDUE: 'bg-red-100 text-red-800 border-red-200',
  CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200',
  INVOICED: 'bg-purple-100 text-purple-800 border-purple-200',
  POSTED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
};

function formatStatus(status: InvoiceStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

async function fetchInvoices(params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  mc?: string;
  [key: string]: any;
}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.status) queryParams.set('status', params.status);
  if (params.search) queryParams.set('search', params.search);
  if (params.mc) queryParams.set('mc', params.mc); // Pass MC view mode
  
  // Add advanced filters
  Object.keys(params).forEach((key) => {
    if (!['page', 'limit', 'status', 'search', 'mc'].includes(key) && params[key]) {
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
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [createBatchDialogOpen, setCreateBatchDialogOpen] = useState(false);
  
  // Get MC view mode from URL (set by CompanySwitcher)
  const searchParamsObj = useSearchParams();
  const mcViewMode = searchParamsObj?.get('mc') || null;
  
  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    checkbox: true,
    invoiceId: true,
    loadId: true,
    mcNumber: true,
    date: true,
    invoiceStatus: true,
    subStatus: true,
    agingDays: true,
    agingStatus: true,
    accrual: true,
    paid: true,
    balanceDue: true,
    reconciliation: true,
    invoiceNote: true,
    paymentNote: true,
    actions: true,
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['invoices', page, statusFilter, searchQuery, advancedFilters, mcViewMode],
    queryFn: () =>
      fetchInvoices({
        page,
        limit: 20,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery || undefined,
        mc: mcViewMode || undefined, // Pass MC view mode to API (from CompanySwitcher)
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
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">
            Manage invoices and payments
          </p>
        </div>
      <div className="flex gap-2">
        {selectedInvoiceIds.length > 0 && (
          <Button
            variant="default"
            onClick={() => setCreateBatchDialogOpen(true)}
          >
            <Package className="h-4 w-4 mr-2" />
            Create Batch ({selectedInvoiceIds.length})
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => setImportDialogOpen(true)}
        >
          <Upload className="h-4 w-4 mr-2" />
          Import
        </Button>
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Settings2 className="h-4 w-4 mr-2" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={visibleColumns.checkbox}
              onCheckedChange={(checked) =>
                setVisibleColumns({ ...visibleColumns, checkbox: checked })
              }
            >
              Checkbox
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.invoiceId}
              onCheckedChange={(checked) =>
                setVisibleColumns({ ...visibleColumns, invoiceId: checked })
              }
            >
              Invoice ID
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.loadId}
              onCheckedChange={(checked) =>
                setVisibleColumns({ ...visibleColumns, loadId: checked })
              }
            >
              Load ID
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.mcNumber}
              onCheckedChange={(checked) =>
                setVisibleColumns({ ...visibleColumns, mcNumber: checked })
              }
            >
              MC Number
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.date}
              onCheckedChange={(checked) =>
                setVisibleColumns({ ...visibleColumns, date: checked })
              }
            >
              Date
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.invoiceStatus}
              onCheckedChange={(checked) =>
                setVisibleColumns({ ...visibleColumns, invoiceStatus: checked })
              }
            >
              Invoice Status
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.subStatus}
              onCheckedChange={(checked) =>
                setVisibleColumns({ ...visibleColumns, subStatus: checked })
              }
            >
              Sub Status
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.agingDays}
              onCheckedChange={(checked) =>
                setVisibleColumns({ ...visibleColumns, agingDays: checked })
              }
            >
              Aging Days
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.agingStatus}
              onCheckedChange={(checked) =>
                setVisibleColumns({ ...visibleColumns, agingStatus: checked })
              }
            >
              Aging Status
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.accrual}
              onCheckedChange={(checked) =>
                setVisibleColumns({ ...visibleColumns, accrual: checked })
              }
            >
              Accrual
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.paid}
              onCheckedChange={(checked) =>
                setVisibleColumns({ ...visibleColumns, paid: checked })
              }
            >
              Paid
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.balanceDue}
              onCheckedChange={(checked) =>
                setVisibleColumns({ ...visibleColumns, balanceDue: checked })
              }
            >
              Balance Due
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.reconciliation}
              onCheckedChange={(checked) =>
                setVisibleColumns({ ...visibleColumns, reconciliation: checked })
              }
            >
              Reconciliation
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.invoiceNote}
              onCheckedChange={(checked) =>
                setVisibleColumns({ ...visibleColumns, invoiceNote: checked })
              }
            >
              Invoice Note
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.paymentNote}
              onCheckedChange={(checked) =>
                setVisibleColumns({ ...visibleColumns, paymentNote: checked })
              }
            >
              Payment Note
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
      <div className="flex flex-col sm:flex-row gap-3">
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
                  {visibleColumns.checkbox && (
                    <TableHead>
                      <Checkbox
                        checked={invoices.length > 0 && invoices.every((inv) => selectedInvoiceIds.includes(inv.id))}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            // Select all non-PAID invoices on current page
                            const selectableIds = invoices
                              .filter((inv) => inv.status !== 'PAID')
                              .map((inv) => inv.id);
                            setSelectedInvoiceIds([...selectedInvoiceIds, ...selectableIds.filter((id) => !selectedInvoiceIds.includes(id))]);
                          } else {
                            // Deselect all invoices on current page
                            const currentPageIds = invoices.map((inv) => inv.id);
                            setSelectedInvoiceIds(selectedInvoiceIds.filter((id) => !currentPageIds.includes(id)));
                          }
                        }}
                      />
                    </TableHead>
                  )}
                  {visibleColumns.invoiceId && <TableHead>Invoice ID</TableHead>}
                  {visibleColumns.loadId && <TableHead>Load ID</TableHead>}
                  {visibleColumns.mcNumber && <TableHead>MC number</TableHead>}
                  {visibleColumns.date && <TableHead>Date</TableHead>}
                  {visibleColumns.invoiceStatus && <TableHead>Invoice status</TableHead>}
                  {visibleColumns.subStatus && <TableHead>Sub status</TableHead>}
                  {visibleColumns.agingDays && <TableHead>Aging days</TableHead>}
                  {visibleColumns.agingStatus && <TableHead>Aging status</TableHead>}
                  {visibleColumns.accrual && <TableHead>Accrual</TableHead>}
                  {visibleColumns.paid && <TableHead>Paid</TableHead>}
                  {visibleColumns.balanceDue && (
                    <TableHead className="text-right">Balance due</TableHead>
                  )}
                  {visibleColumns.reconciliation && <TableHead>Reconciliation</TableHead>}
                  {visibleColumns.invoiceNote && <TableHead>Invoice note</TableHead>}
                  {visibleColumns.paymentNote && <TableHead>Payment note</TableHead>}
                  {visibleColumns.actions && (
                    <TableHead className="text-right">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => {
                  const aging = getAgingInfo(invoice.dueDate);
                  const balance = invoice.total - (invoice.paidAmount || 0);
                  return (
                    <TableRow key={invoice.id}>
                      {visibleColumns.checkbox && (
                        <TableCell>
                          <Checkbox
                            checked={selectedInvoiceIds.includes(invoice.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedInvoiceIds([...selectedInvoiceIds, invoice.id]);
                              } else {
                                setSelectedInvoiceIds(selectedInvoiceIds.filter((id) => id !== invoice.id));
                              }
                            }}
                            disabled={invoice.status === 'PAID'} // Can't batch PAID invoices
                          />
                        </TableCell>
                      )}
                      {visibleColumns.invoiceId && (
                        <TableCell className="font-medium">
                          <button
                            onClick={() => setQuickViewInvoiceId(invoice.id)}
                            className="text-primary hover:underline text-left"
                          >
                            {invoice.invoiceNumber}
                          </button>
                        </TableCell>
                      )}
                      {visibleColumns.loadId && (
                        <TableCell>{invoice.loadId || '-'}</TableCell>
                      )}
                      {visibleColumns.mcNumber && (
                        <TableCell>{invoice.mcNumber || invoice.customer.name}</TableCell>
                      )}
                      {visibleColumns.date && (
                        <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                      )}
                      {visibleColumns.invoiceStatus && (
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={statusColors[invoice.status as InvoiceStatus]}
                          >
                            {formatStatus(invoice.status)}
                          </Badge>
                        </TableCell>
                      )}
                      {visibleColumns.subStatus && (
                        <TableCell>{invoice.subStatus || '/'}</TableCell>
                      )}
                      {visibleColumns.agingDays && (
                        <TableCell>{aging.daysPastDue}</TableCell>
                      )}
                      {visibleColumns.agingStatus && (
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              aging.agingStatus === 'NOT_OVERDUE'
                                ? 'bg-green-100 text-green-800 border-green-200'
                                : 'bg-red-100 text-red-800 border-red-200'
                            }
                          >
                            {aging.agingStatus === 'NOT_OVERDUE' ? 'NOT OVERDUE' : aging.agingStatus}
                          </Badge>
                        </TableCell>
                      )}
                      {visibleColumns.accrual && (
                        <TableCell>{formatCurrency(invoice.total)}</TableCell>
                      )}
                      {visibleColumns.paid && (
                        <TableCell>{formatCurrency(invoice.paidAmount || 0)}</TableCell>
                      )}
                      {visibleColumns.balanceDue && (
                        <TableCell className="text-right font-medium">
                          {formatCurrency(balance)}
                        </TableCell>
                      )}
                      {visibleColumns.reconciliation && (
                        <TableCell>
                          {invoice.reconciliationStatus === 'NOT_RECONCILED' ? (
                            <span className="text-red-600">Not reconciled</span>
                          ) : invoice.reconciliationStatus === 'FULLY_RECONCILED' ? (
                            <span className="text-green-600">Fully reconciled</span>
                          ) : (
                            <span className="text-yellow-600">Partially reconciled</span>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.invoiceNote && (
                        <TableCell>{invoice.invoiceNote || '-'}</TableCell>
                      )}
                      {visibleColumns.paymentNote && (
                        <TableCell>{invoice.paymentNote || '-'}</TableCell>
                      )}
                      {visibleColumns.actions && (
                        <TableCell className="text-right">
                          <Link href={`/dashboard/invoices/${invoice.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
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

      <InvoiceImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />

      <CreateBatchForm
        open={createBatchDialogOpen}
        onOpenChange={(open) => {
          setCreateBatchDialogOpen(open);
          if (!open) {
            setSelectedInvoiceIds([]); // Clear selection when dialog closes
          }
        }}
        preselectedInvoiceIds={selectedInvoiceIds}
      />
    </div>
  );
}


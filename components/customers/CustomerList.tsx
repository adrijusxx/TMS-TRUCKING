'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Plus, Search, Upload } from 'lucide-react';
import ImportButton from '@/components/import-export/ImportButton';
import ExportDialog from '@/components/import-export/ExportDialog';
import BulkActionBar from '@/components/import-export/BulkActionBar';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency, apiUrl } from '@/lib/utils';
import { CustomerType } from '@prisma/client';
import { usePermissions } from '@/hooks/usePermissions';
import AdvancedFilters from '@/components/filters/AdvancedFilters';
import SavedFilters from '@/components/filters/SavedFilters';
import CustomerListStats from '@/components/customers/CustomerListStats';
import CustomerQuickView from '@/components/customers/CustomerQuickView';
import { useKeyboardShortcuts, commonShortcuts } from '@/lib/hooks/useKeyboardShortcuts';

interface Customer {
  id: string;
  customerNumber: string;
  name: string;
  type: CustomerType;
  city: string;
  state: string;
  phone: string;
  email: string;
  paymentTerms: number;
  totalLoads: number;
  totalRevenue: number;
}

function formatCustomerType(type: CustomerType): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

async function fetchCustomers(params: {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: any;
}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.search) queryParams.set('search', params.search);
  
  // Add advanced filters
  Object.keys(params).forEach((key) => {
    if (!['page', 'limit', 'search'].includes(key) && params[key]) {
      queryParams.set(key, params[key].toString());
    }
  });

  const response = await fetch(apiUrl(`/api/customers?${queryParams}`));
  if (!response.ok) throw new Error('Failed to fetch customers');
  return response.json();
}

export default function CustomerList() {
  const { can } = usePermissions();
  const searchParams = useSearchParams();
  // MC state is managed via cookies, not URL params
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>({});
  const [searchInputRef, setSearchInputRef] = useState<HTMLInputElement | null>(null);
  const [quickViewCustomerId, setQuickViewCustomerId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['customers', page, searchQuery, advancedFilters],
    queryFn: () =>
      fetchCustomers({
        page,
        limit: 20,
        search: searchQuery || undefined,
        // MC filtering handled server-side via cookies
        ...advancedFilters,
      }),
  });

  const customers: Customer[] = data?.data || [];
  const meta = data?.meta;

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      ...commonShortcuts.newLoad,
      action: () => {
        window.location.href = '/dashboard/customers/new';
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
          <p className="text-muted-foreground">
            Manage your customer relationships
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ImportButton entityType="customers" />
          <ExportDialog entityType="customers" />
          {can('customers.create') && (
            <Link href="/dashboard/customers/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Customer
              </Button>
            </Link>
          )}
        </div>
      </div>

      <CustomerListStats filters={{ ...advancedFilters, search: searchQuery }} />

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={setSearchInputRef}
            placeholder="Search by name, customer number, or email... (Ctrl+K)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <AdvancedFilters
            filters={[
              { field: 'type', label: 'Customer Type', type: 'select', options: [
                { value: 'DIRECT', label: 'Direct' },
                { value: 'BROKER', label: 'Broker' },
              ]},
              { field: 'state', label: 'State', type: 'text' },
              { field: 'city', label: 'City', type: 'text' },
              { field: 'minRevenue', label: 'Min Revenue', type: 'number' },
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
            entityType="customers"
            currentFilters={{ ...advancedFilters, search: searchQuery }}
            onApplyFilter={(filters) => {
              const { search, ...rest } = filters;
              if (search) setSearchQuery(search);
              setAdvancedFilters(rest);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-8">Loading customers...</div>
      ) : error ? (
        <div className="text-center py-8 text-destructive">
          Error loading customers. Please try again.
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">No customers found</p>
          <p className="text-muted-foreground mb-4">
            {searchQuery
              ? 'Try adjusting your search'
              : 'Get started by adding your first customer'}
          </p>
          {!searchQuery && can('customers.create') && (
            <Link href="/dashboard/customers/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
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
                  <TableHead>Customer #</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Payment Terms</TableHead>
                  <TableHead>Total Loads</TableHead>
                  <TableHead className="text-right">Total Revenue</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">
                      <button
                        onClick={() => setQuickViewCustomerId(customer.id)}
                        className="text-primary hover:underline text-left"
                      >
                        {customer.customerNumber}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {customer.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {formatCustomerType(customer.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {customer.city}, {customer.state}
                      </div>
                    </TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{customer.paymentTerms} days</TableCell>
                    <TableCell>{customer.totalLoads}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(customer.totalRevenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/customers/${customer.id}`}>
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
                {Math.min(page * 20, meta.total)} of {meta.total} customers
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

      <CustomerQuickView
        customerId={quickViewCustomerId}
        open={!!quickViewCustomerId}
        onOpenChange={(open) => {
          if (!open) setQuickViewCustomerId(null);
        }}
      />
    </div>
  );
}


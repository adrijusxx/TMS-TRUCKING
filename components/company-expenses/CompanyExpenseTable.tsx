'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Search, Filter, RefreshCw, ExternalLink, ChevronLeft, ChevronRight,
  ArrowUp, ArrowDown, ArrowUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { PaymentInstrumentBadge } from './PaymentInstrumentBadge';
import { ExpenseReceiptCell } from './ExpenseReceiptCell';
import { apiUrl, cn, formatCurrency } from '@/lib/utils';
import type { UnifiedExpenseEntry, FeedSource } from '@/app/api/company-expenses/feed/route';

const DEPARTMENTS = [
  { value: '_all', label: 'All Departments' },
  { value: 'OPERATIONS', label: 'Operations' },
  { value: 'FLEET', label: 'Fleet' },
  { value: 'RECRUITING', label: 'Recruiting' },
  { value: 'DISPATCH', label: 'Dispatch' },
  { value: 'SAFETY', label: 'Safety' },
  { value: 'ACCOUNTING', label: 'Accounting' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'OTHER', label: 'Other' },
];

const SOURCES = [
  { value: '_all', label: 'All Sources' },
  { value: 'COMPANY_EXPENSE', label: 'Company Expenses' },
  { value: 'BREAKDOWN_PAYMENT', label: 'Breakdown / Fuel' },
  { value: 'LOAD_EXPENSE', label: 'Load Expenses' },
];

const APPROVAL_STATUSES = [
  { value: '_all', label: 'Any Status' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

const RECEIPT_STATUSES = [
  { value: '_all', label: 'Any Receipt' },
  { value: 'true', label: 'Has Receipt' },
  { value: 'false', label: 'Missing Receipt' },
];

const SOURCE_COLORS: Record<FeedSource, string> = {
  COMPANY_EXPENSE: 'info',
  BREAKDOWN_PAYMENT: 'warning',
  LOAD_EXPENSE: 'neutral',
} as const;

const SOURCE_LABELS: Record<FeedSource, string> = {
  COMPANY_EXPENSE: 'Company',
  BREAKDOWN_PAYMENT: 'Breakdown',
  LOAD_EXPENSE: 'Load Exp.',
};

const APPROVAL_COLORS: Record<string, 'success' | 'warning' | 'error'> = {
  APPROVED: 'success',
  PENDING: 'warning',
  REJECTED: 'error',
};

interface Filters {
  search: string;
  source: string;
  department: string;
  approvalStatus: string;
  dateFrom: string;
  dateTo: string;
  instrumentId: string;
  hasReceipt: string;
}

const defaultFilters: Filters = {
  search: '',
  source: '',
  department: '',
  approvalStatus: '',
  dateFrom: '',
  dateTo: '',
  instrumentId: '',
  hasReceipt: '',
};

const PAGE_SIZE = 50;

interface SortState {
  field: string;
  dir: 'asc' | 'desc';
}

function SortHead({
  field, label, sort, onSort, className,
}: {
  field: string;
  label: string;
  sort: SortState;
  onSort: (f: string) => void;
  className?: string;
}) {
  const isActive = sort.field === field;
  const Icon = !isActive ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <TableHead
      className={cn('cursor-pointer select-none text-xs', className)}
      onClick={() => onSort(field)}
    >
      <span className="flex items-center gap-1 hover:text-foreground transition-colors">
        {label}
        <Icon className={cn('h-3 w-3 shrink-0', isActive ? 'text-foreground' : 'text-muted-foreground/40')} />
      </span>
    </TableHead>
  );
}

export function CompanyExpenseTable() {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [sort, setSort] = useState<SortState>({ field: 'date', dir: 'desc' });

  const handleSearchChange = (value: string) => {
    setFilters((f) => ({ ...f, search: value }));
    if (searchTimer) clearTimeout(searchTimer);
    const timer = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
    setSearchTimer(timer);
  };

  const setFilter = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  }, []);

  const handleSort = useCallback((field: string) => {
    setSort((s) => s.field === field
      ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' }
      : { field, dir: 'desc' });
    setPage(1);
  }, []);

  const { data: instrumentsData } = useQuery<{ data: Array<{ id: string; name: string; lastFour: string | null; color: string | null }> }>({
    queryKey: ['payment-instruments-list'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/payment-instruments?limit=200'));
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    staleTime: 60_000,
  });
  const instruments = instrumentsData?.data ?? [];

  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      'company-expenses-feed',
      debouncedSearch, filters.source, filters.department, filters.approvalStatus,
      filters.dateFrom, filters.dateTo, filters.instrumentId, filters.hasReceipt,
      sort.field, sort.dir, page,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        sortBy: sort.field,
        sortOrder: sort.dir,
      });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (filters.source) params.set('source', filters.source);
      if (filters.department) params.set('department', filters.department);
      if (filters.approvalStatus) params.set('approvalStatus', filters.approvalStatus);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);
      if (filters.instrumentId) params.set('instrumentId', filters.instrumentId);
      if (filters.hasReceipt) params.set('hasReceipt', filters.hasReceipt);
      const res = await fetch(apiUrl(`/api/company-expenses/feed?${params}`));
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      return json as { data: UnifiedExpenseEntry[]; meta: { total: number; totalPages: number } };
    },
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const entries = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = data?.meta.totalPages ?? 1;

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-3">
      {/* Filter bar — row 1 */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search expenses..."
            className="pl-8 h-8 text-sm"
          />
        </div>

        <Select value={filters.source || '_all'} onValueChange={(v) => setFilter('source', v === '_all' ? '' : v)}>
          <SelectTrigger className="h-8 text-xs w-40">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            {SOURCES.map((s) => (
              <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.department || '_all'} onValueChange={(v) => setFilter('department', v === '_all' ? '' : v)}>
          <SelectTrigger className="h-8 text-xs w-40">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            {DEPARTMENTS.map((d) => (
              <SelectItem key={d.value} value={d.value} className="text-xs">{d.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.approvalStatus || '_all'} onValueChange={(v) => setFilter('approvalStatus', v === '_all' ? '' : v)}>
          <SelectTrigger className="h-8 text-xs w-36">
            <SelectValue placeholder="Any Status" />
          </SelectTrigger>
          <SelectContent>
            {APPROVAL_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.instrumentId || '_all'} onValueChange={(v) => setFilter('instrumentId', v === '_all' ? '' : v)}>
          <SelectTrigger className="h-8 text-xs w-44">
            <SelectValue placeholder="All Cards" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all" className="text-xs">All Cards</SelectItem>
            {instruments.map((inst) => (
              <SelectItem key={inst.id} value={inst.id} className="text-xs">
                {inst.name}{inst.lastFour ? ` ···${inst.lastFour}` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.hasReceipt || '_all'} onValueChange={(v) => setFilter('hasReceipt', v === '_all' ? '' : v)}>
          <SelectTrigger className="h-8 text-xs w-36">
            <SelectValue placeholder="Any Receipt" />
          </SelectTrigger>
          <SelectContent>
            {RECEIPT_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1.5">
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilter('dateFrom', e.target.value)}
            className="h-8 text-xs w-36"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilter('dateTo', e.target.value)}
            className="h-8 text-xs w-36"
          />
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setFilters(defaultFilters); setDebouncedSearch(''); setPage(1); }}
            className="h-8 text-xs gap-1"
          >
            <Filter className="h-3 w-3" />
            Clear
          </Button>
        )}

        <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto" onClick={() => refetch()}>
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="h-9">
              <SortHead field="date" label="Date" sort={sort} onSort={handleSort} className="w-28" />
              <TableHead className="text-xs w-28">Ref #</TableHead>
              <SortHead field="description" label="Description" sort={sort} onSort={handleSort} />
              <SortHead field="category" label="Category" sort={sort} onSort={handleSort} className="w-32" />
              <SortHead field="department" label="Department" sort={sort} onSort={handleSort} className="w-32" />
              <TableHead className="text-xs w-40">Card / Account</TableHead>
              <TableHead className="text-xs w-24">Vendor</TableHead>
              <TableHead className="text-xs w-20">Status</TableHead>
              <TableHead className="text-xs w-16">Source</TableHead>
              <TableHead className="text-xs w-20">Receipt</TableHead>
              <SortHead field="amount" label="Amount" sort={sort} onSort={handleSort} className="w-24 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 11 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : entries.length === 0
              ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center text-sm text-muted-foreground py-12">
                      No expenses found.{hasActiveFilters && ' Try clearing filters.'}
                    </TableCell>
                  </TableRow>
                )
              : entries.map((entry) => (
                  <TableRow key={`${entry.source}-${entry.id}`} className="h-10">
                    <TableCell className="text-xs py-1.5">
                      {format(new Date(entry.date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-xs py-1.5 font-mono text-muted-foreground">
                      {entry.expenseNumber}
                    </TableCell>
                    <TableCell className="text-xs py-1.5 max-w-[200px]">
                      <div className="truncate font-medium">{entry.description}</div>
                      {entry.linkedReference && (
                        <div className="text-muted-foreground flex items-center gap-1">
                          <ExternalLink className="h-2.5 w-2.5" />
                          {entry.linkedReference}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs py-1.5">
                      <span className="inline-flex items-center gap-1">
                        {entry.categoryColor && (
                          <span
                            className="h-2 w-2 rounded-full shrink-0 inline-block"
                            style={{ backgroundColor: entry.categoryColor }}
                          />
                        )}
                        <span className="truncate max-w-[100px]">{entry.category}</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-xs py-1.5">
                      {entry.department ? (
                        <span className="text-muted-foreground">{entry.department}</span>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="py-1.5">
                      {entry.paymentInstrument ? (
                        <PaymentInstrumentBadge
                          name={entry.paymentInstrument.name}
                          lastFour={entry.paymentInstrument.lastFour}
                          color={entry.paymentInstrument.color}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs py-1.5 max-w-[80px]">
                      <span className="truncate block text-muted-foreground">{entry.vendor ?? '—'}</span>
                    </TableCell>
                    <TableCell className="py-1.5">
                      {entry.approvalStatus ? (
                        <Badge
                          variant={APPROVAL_COLORS[entry.approvalStatus] ?? 'neutral'}
                          size="xs"
                        >
                          {entry.approvalStatus}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-1.5">
                      <Badge
                        variant={(SOURCE_COLORS[entry.source] as any) ?? 'neutral'}
                        size="xs"
                      >
                        {SOURCE_LABELS[entry.source]}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-1.5">
                      <ExpenseReceiptCell
                        id={entry.id}
                        source={entry.source}
                        receiptUrl={entry.receiptUrl}
                      />
                    </TableCell>
                    <TableCell className="text-xs py-1.5 text-right font-medium">
                      {formatCurrency(entry.amount)}
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{total} total records</span>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span>Page {page} of {totalPages}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

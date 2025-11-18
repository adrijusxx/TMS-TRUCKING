'use client';

import { useState } from 'react';
import Link from 'next/link';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DollarSign, Search, Filter } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { SettlementStatus } from '@prisma/client';

interface Settlement {
  id: string;
  settlementNumber: string;
  driver: {
    user: {
      firstName: string;
      lastName: string;
    };
    driverNumber: string;
  };
  periodStart: string;
  periodEnd: string;
  grossPay: number;
  deductions: number;
  advances: number;
  netPay: number;
  status: SettlementStatus;
}

const statusColors: Record<SettlementStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  APPROVED: 'bg-blue-100 text-blue-800 border-blue-200',
  PAID: 'bg-green-100 text-green-800 border-green-200',
  DISPUTED: 'bg-red-100 text-red-800 border-red-200',
};

function formatStatus(status: SettlementStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

async function fetchSettlements(params: {
  page?: number;
  limit?: number;
  driverId?: string;
  status?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.driverId) queryParams.set('driverId', params.driverId);
  if (params.status) queryParams.set('status', params.status);

  const response = await fetch(`/api/settlements?${queryParams}`);
  if (!response.ok) throw new Error('Failed to fetch settlements');
  return response.json();
}

export default function SettlementList() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['settlements', page, statusFilter],
    queryFn: () =>
      fetchSettlements({
        page,
        limit: 20,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      }),
  });

  const settlements: Settlement[] = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Settlements</h1>
          <p className="text-muted-foreground">
            Driver pay settlements and statements
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
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
                {formatStatus(status as SettlementStatus)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-8">Loading settlements...</div>
      ) : error ? (
        <div className="text-center py-8 text-destructive">
          Error loading settlements. Please try again.
        </div>
      ) : settlements.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">No settlements found</p>
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Settlement #</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Gross Pay</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Advances</TableHead>
                  <TableHead className="text-right">Net Pay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settlements.map((settlement) => (
                  <TableRow key={settlement.id}>
                    <TableCell className="font-medium">
                      {settlement.settlementNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {settlement.driver.user.firstName}{' '}
                          {settlement.driver.user.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {settlement.driver.driverNumber}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDate(settlement.periodStart)} -{' '}
                      {formatDate(settlement.periodEnd)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(settlement.grossPay)}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      -{formatCurrency(settlement.deductions)}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      -{formatCurrency(settlement.advances)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      {formatCurrency(settlement.netPay)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColors[settlement.status]}
                      >
                        {formatStatus(settlement.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/settlements/${settlement.id}`}>
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
                {Math.min(page * 20, meta.total)} of {meta.total} settlements
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
    </div>
  );
}


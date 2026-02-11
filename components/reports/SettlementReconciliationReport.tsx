'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { formatCurrency, formatDate } from '@/lib/utils';
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns';
import { Loader2, Search, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ReportRow {
    id: string;
    loadNumber: string;
    date: string;
    customer: string;
    driver: string;
    billedAmount: number;
    settledAmount: number;
    expenses: number;
    netProfit: number;
    margin: number;
    status: string;
    invoiceNumber: string;
}

export function SettlementReconciliationReport() {
    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
    const [customerFilter, setCustomerFilter] = useState('');
    const [driverFilter, setDriverFilter] = useState('');

    const { data, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['settlement-reconciliation', startDate, endDate, customerFilter, driverFilter],
        queryFn: async () => {
            const params = new URLSearchParams({
                startDate,
                endDate,
                ...(customerFilter ? { customerId: customerFilter } : {}), // Typically strictly filtering by ID needs a selector, for now we might filter client side or implement ID lookup
                // For now, let's assume the API handles basic filtering or we filter purely by date and let the user search in table
            });
            const res = await fetch(`/api/reports/reconciliation?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch report');
            const json = await res.json();
            return json.data as ReportRow[];
        },
    });

    const columns: ColumnDef<ReportRow>[] = [
        {
            accessorKey: 'loadNumber',
            header: 'Load #',
            cell: ({ row }) => <span className="font-medium">{row.original.loadNumber}</span>,
        },
        {
            accessorKey: 'date',
            header: 'Date',
            cell: ({ row }) => formatDate(row.original.date),
        },
        {
            accessorKey: 'customer',
            header: 'Customer',
        },
        {
            accessorKey: 'driver',
            header: 'Driver',
        },
        {
            accessorKey: 'billedAmount',
            header: () => <div className="text-right">Billed</div>,
            cell: ({ row }) => <div className="text-right font-medium">{formatCurrency(row.original.billedAmount)}</div>,
        },
        {
            accessorKey: 'settledAmount',
            header: () => <div className="text-right">Driver Pay</div>,
            cell: ({ row }) => <div className="text-right">{formatCurrency(row.original.settledAmount)}</div>,
        },
        {
            accessorKey: 'expenses',
            header: () => <div className="text-right">Expenses</div>,
            cell: ({ row }) => <div className="text-right text-muted-foreground">{formatCurrency(row.original.expenses)}</div>,
        },
        {
            accessorKey: 'netProfit',
            header: () => <div className="text-right">Net Profit</div>,
            cell: ({ row }) => {
                const profit = row.original.netProfit;
                return (
                    <div className={`text-right font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(profit)}
                    </div>
                );
            },
        },
        {
            accessorKey: 'margin',
            header: () => <div className="text-right">Margin</div>,
            cell: ({ row }) => {
                const margin = row.original.margin;
                return (
                    <div className="text-right">
                        <Badge variant={margin < 10 ? 'destructive' : margin < 20 ? 'secondary' : 'outline'}>
                            {margin.toFixed(1)}%
                        </Badge>
                    </div>
                );
            },
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => <Badge variant="outline" className="text-[10px]">{row.original.status}</Badge>,
        },
    ];

    // Calculate Totals
    const totals = (data || []).reduce(
        (acc, row) => ({
            revenue: acc.revenue + row.billedAmount,
            settled: acc.settled + row.settledAmount,
            expenses: acc.expenses + row.expenses,
            profit: acc.profit + row.netProfit,
        }),
        { revenue: 0, settled: 0, expenses: 0, profit: 0 }
    );

    const totalMargin = totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0;

    return (
        <div className="space-y-6">
            {/* Filters */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        Report Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-[160px]" />
                        </div>
                        <div className="space-y-2">
                            <Label>End Date</Label>
                            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-[160px]" />
                        </div>
                        <div className="flex-1" />
                        <Button variant="outline" onClick={() => refetch()} disabled={isLoading || isRefetching}>
                            {(isLoading || isRefetching) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Refresh Data
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{formatCurrency(totals.revenue)}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Driver Pay</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{formatCurrency(totals.settled)}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle></CardHeader>
                    <CardContent><div className={`text-2xl font-bold ${totals.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(totals.profit)}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Avg Margin</CardTitle></CardHeader>
                    <CardContent><div className={`text-2xl font-bold ${totalMargin >= 15 ? 'text-green-600' : 'text-orange-500'}`}>{totalMargin.toFixed(1)}%</div></CardContent>
                </Card>
            </div>

            {/* Data Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Detailed Reconciliation</CardTitle>
                </CardHeader>
                <CardContent>
                    <DataTable
                        columns={columns}
                        data={data || []}
                        filterKey="loadNumber"
                    />
                </CardContent>
            </Card>
        </div>
    );
}

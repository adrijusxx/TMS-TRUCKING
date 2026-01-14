'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Download, Calendar, TrendingUp, Users, DollarSign } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { apiUrl, formatCurrency } from '@/lib/utils';

interface ReportSummary {
    totalGrossPay: number;
    totalDeductions: number;
    totalAdvances: number;
    totalNetPay: number;
    settlementCount: number;
    driverCount: number;
    byDriverType: {
        type: string;
        count: number;
        totalPay: number;
    }[];
    byPeriod: {
        period: string;
        grossPay: number;
        netPay: number;
        count: number;
    }[];
}

/**
 * SalaryReportTab - Summary report view of all settlements
 * Provides aggregated statistics and breakdown by driver type
 */
export default function SalaryReportTab() {
    const [period, setPeriod] = React.useState('current');

    // Calculate date range based on selected period
    const dateRange = React.useMemo(() => {
        const now = new Date();
        switch (period) {
            case 'current':
                return { start: startOfMonth(now), end: endOfMonth(now) };
            case 'last':
                const lastMonth = subMonths(now, 1);
                return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
            case 'quarter':
                return { start: subMonths(now, 3), end: now };
            case 'year':
                return { start: subMonths(now, 12), end: now };
            default:
                return { start: startOfMonth(now), end: endOfMonth(now) };
        }
    }, [period]);

    // Fetch settlement data for report
    const { data: report, isLoading } = useQuery({
        queryKey: ['salary-report', period],
        queryFn: async () => {
            const params = new URLSearchParams({
                periodStart: dateRange.start.toISOString(),
                periodEnd: dateRange.end.toISOString(),
                limit: '500',
            });
            const response = await fetch(apiUrl(`/api/settlements?${params}`));
            if (!response.ok) throw new Error('Failed to fetch settlements');
            const result = await response.json();
            return calculateReportSummary(result.data || []);
        },
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-[180px]">
                            <Calendar className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="current">Current Month</SelectItem>
                            <SelectItem value="last">Last Month</SelectItem>
                            <SelectItem value="quarter">Last 3 Months</SelectItem>
                            <SelectItem value="year">Last 12 Months</SelectItem>
                        </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">
                        {format(dateRange.start, 'MMM d, yyyy')} - {format(dateRange.end, 'MMM d, yyyy')}
                    </span>
                </div>
                <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <SummaryCard
                    title="Total Gross Pay"
                    value={report?.totalGrossPay}
                    icon={DollarSign}
                    isLoading={isLoading}
                    format="currency"
                />
                <SummaryCard
                    title="Total Net Pay"
                    value={report?.totalNetPay}
                    icon={TrendingUp}
                    isLoading={isLoading}
                    format="currency"
                />
                <SummaryCard
                    title="Settlements"
                    value={report?.settlementCount}
                    icon={Users}
                    isLoading={isLoading}
                    format="number"
                />
                <SummaryCard
                    title="Active Drivers"
                    value={report?.driverCount}
                    icon={Users}
                    isLoading={isLoading}
                    format="number"
                />
            </div>

            {/* Breakdown by Driver Type */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium">Breakdown by Driver Type</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Driver Type</TableHead>
                                <TableHead className="text-center">Drivers</TableHead>
                                <TableHead className="text-right">Total Pay</TableHead>
                                <TableHead className="text-right">Avg per Driver</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                [...Array(3)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : report?.byDriverType && report.byDriverType.length > 0 ? (
                                report.byDriverType.map((row) => (
                                    <TableRow key={row.type}>
                                        <TableCell className="font-medium">{formatDriverType(row.type)}</TableCell>
                                        <TableCell className="text-center">{row.count}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(row.totalPay)}</TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(row.count > 0 ? row.totalPay / row.count : 0)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                                        No data available for selected period
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Deductions Summary */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium">Deductions & Advances Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="p-4 border rounded-lg">
                            <div className="text-sm text-muted-foreground">Total Deductions</div>
                            <div className="text-2xl font-semibold text-destructive">
                                {isLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(report?.totalDeductions || 0)}
                            </div>
                        </div>
                        <div className="p-4 border rounded-lg">
                            <div className="text-sm text-muted-foreground">Total Advances</div>
                            <div className="text-2xl font-semibold text-orange-500">
                                {isLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(report?.totalAdvances || 0)}
                            </div>
                        </div>
                        <div className="p-4 border rounded-lg">
                            <div className="text-sm text-muted-foreground">Net Payout</div>
                            <div className="text-2xl font-semibold text-green-600">
                                {isLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(report?.totalNetPay || 0)}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

/** Summary card component */
function SummaryCard({
    title,
    value,
    icon: Icon,
    isLoading,
    format: formatType,
}: {
    title: string;
    value?: number;
    icon: React.ComponentType<{ className?: string }>;
    isLoading: boolean;
    format: 'currency' | 'number';
}) {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-sm text-muted-foreground">{title}</div>
                        <div className="text-2xl font-bold">
                            {isLoading ? (
                                <Skeleton className="h-8 w-24" />
                            ) : formatType === 'currency' ? (
                                formatCurrency(value || 0)
                            ) : (
                                (value || 0).toLocaleString()
                            )}
                        </div>
                    </div>
                    <Icon className="h-8 w-8 text-muted-foreground/50" />
                </div>
            </CardContent>
        </Card>
    );
}

/** Format driver type for display */
function formatDriverType(type: string): string {
    const typeMap: Record<string, string> = {
        COMPANY: 'Company Driver',
        OWNER_OPERATOR: 'Owner Operator',
        LEASE: 'Lease Driver',
    };
    return typeMap[type] || type;
}

/** Calculate report summary from settlements */
function calculateReportSummary(settlements: any[]): ReportSummary {
    const driverSet = new Set<string>();
    const byTypeMap = new Map<string, { count: number; totalPay: number }>();

    let totalGrossPay = 0;
    let totalDeductions = 0;
    let totalAdvances = 0;
    let totalNetPay = 0;

    settlements.forEach((s) => {
        driverSet.add(s.driverId);
        totalGrossPay += s.grossPay || 0;
        totalDeductions += s.deductions || 0;
        totalAdvances += s.advances || 0;
        totalNetPay += s.netPay || 0;

        const driverType = s.driver?.type || 'UNKNOWN';
        if (!byTypeMap.has(driverType)) {
            byTypeMap.set(driverType, { count: 0, totalPay: 0 });
        }
        const typeData = byTypeMap.get(driverType)!;
        typeData.count += 1;
        typeData.totalPay += s.netPay || 0;
    });

    return {
        totalGrossPay,
        totalDeductions,
        totalAdvances,
        totalNetPay,
        settlementCount: settlements.length,
        driverCount: driverSet.size,
        byDriverType: Array.from(byTypeMap.entries()).map(([type, data]) => ({
            type,
            count: data.count,
            totalPay: data.totalPay,
        })),
        byPeriod: [],
    };
}

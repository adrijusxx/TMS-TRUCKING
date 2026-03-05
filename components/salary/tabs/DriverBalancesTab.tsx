'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { SortableHeader } from '@/components/ui/sortable-header';
import { useReactTable, getCoreRowModel, getSortedRowModel, type SortingState, type ColumnDef } from '@tanstack/react-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    RefreshCw,
    Download,
    DollarSign,
    AlertTriangle,
    CheckCircle,
    Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { apiUrl, formatCurrency } from '@/lib/utils';
import { exportToCSV } from '@/lib/export';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface DriverAdvance {
    id: string;
    advanceNumber: string;
    driver: {
        id: string;
        driverNumber: string;
        user: {
            firstName: string;
            lastName: string;
        };
    };
    amount: number;
    requestDate: string;
    approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    approvedAt: string | null;
    loadId: string | null;
    notes: string | null;
}

interface DriverBalance {
    driverId: string;
    driverName: string;
    driverNumber: string;
    pendingAdvances: number;
    approvedAdvances: number;
    negativeBalance: number;
    totalOwed: number;
}

/**
 * DriverBalancesTab - Shows driver advance requests and balance tracking
 * Uses existing DriverAdvance and DriverNegativeBalance models
 */
export default function DriverBalancesTab() {
    const queryClient = useQueryClient();
    const [view, setView] = React.useState<'advances' | 'balances'>('advances');

    // Fetch driver advances with negative balances
    const { data: advancesData, isLoading: loadingAdvances } = useQuery({
        queryKey: ['driver-advances'],
        queryFn: async () => {
            const response = await fetch(apiUrl('/api/advances?limit=100&includeNegativeBalance=true'));
            if (!response.ok) throw new Error('Failed to fetch advances');
            return response.json();
        },
    });

    const advances = (advancesData?.data || []) as DriverAdvance[];
    const negativeBalanceMap = React.useMemo(() => {
        const map = new Map<string, number>();
        ((advancesData?.negativeBalances || []) as { driverId: string; amount: number }[]).forEach(
            (nb) => map.set(nb.driverId, nb.amount)
        );
        return map;
    }, [advancesData?.negativeBalances]);

    // Calculate driver balances from advances + negative balances
    const driverBalances = React.useMemo(() => {
        if (!advances.length) return [];

        const balanceMap = new Map<string, DriverBalance>();

        advances.forEach((adv) => {
            const driverId = adv.driver.id;
            if (!balanceMap.has(driverId)) {
                balanceMap.set(driverId, {
                    driverId,
                    driverName: `${adv.driver.user.firstName} ${adv.driver.user.lastName}`,
                    driverNumber: adv.driver.driverNumber,
                    pendingAdvances: 0,
                    approvedAdvances: 0,
                    negativeBalance: negativeBalanceMap.get(driverId) || 0,
                    totalOwed: 0,
                });
            }

            const balance = balanceMap.get(driverId)!;
            if (adv.approvalStatus === 'PENDING') {
                balance.pendingAdvances += adv.amount;
            } else if (adv.approvalStatus === 'APPROVED') {
                balance.approvedAdvances += adv.amount;
            }
            balance.totalOwed = balance.approvedAdvances + balance.negativeBalance;
        });

        return Array.from(balanceMap.values()).sort((a, b) => b.totalOwed - a.totalOwed);
    }, [advances, negativeBalanceMap]);

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['driver-advances'] });
        toast.success('Data refreshed');
    };

    // Summary stats
    const stats = React.useMemo(() => {
        if (!advances.length) return { pending: 0, approved: 0, total: 0, count: 0 };
        return advances.reduce(
            (acc, adv) => {
                if (adv.approvalStatus === 'PENDING') acc.pending += adv.amount;
                if (adv.approvalStatus === 'APPROVED') acc.approved += adv.amount;
                acc.total += adv.amount;
                acc.count += 1;
                return acc;
            },
            { pending: 0, approved: 0, total: 0, count: 0 }
        );
    }, [advances]);

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <StatCard
                    title="Pending Advances"
                    value={stats.pending}
                    icon={Clock}
                    isLoading={loadingAdvances}
                    variant="warning"
                />
                <StatCard
                    title="Approved Advances"
                    value={stats.approved}
                    icon={CheckCircle}
                    isLoading={loadingAdvances}
                    variant="success"
                />
                <StatCard
                    title="Total Outstanding"
                    value={stats.total}
                    icon={DollarSign}
                    isLoading={loadingAdvances}
                    variant="default"
                />
                <StatCard
                    title="Active Requests"
                    value={stats.count}
                    icon={AlertTriangle}
                    isLoading={loadingAdvances}
                    variant="default"
                    isCount
                />
            </div>

            {/* View Toggle */}
            <Tabs value={view} onValueChange={(v) => setView(v as 'advances' | 'balances')}>
                <div className="flex items-center justify-between">
                    <TabsList>
                        <TabsTrigger value="advances">Advance Requests</TabsTrigger>
                        <TabsTrigger value="balances">Driver Balances</TabsTrigger>
                    </TabsList>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleRefresh}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => {
                            if (view === 'advances' && advances.length) {
                                exportToCSV(
                                    advances.map((a) => ({
                                        'Advance #': a.advanceNumber || '',
                                        Driver: `${a.driver.user.firstName} ${a.driver.user.lastName}`,
                                        'Driver #': a.driver.driverNumber,
                                        Amount: a.amount,
                                        'Request Date': a.requestDate ? format(new Date(a.requestDate), 'MM/dd/yyyy') : '',
                                        Status: a.approvalStatus,
                                        Notes: a.notes || '',
                                    })),
                                    ['Advance #', 'Driver', 'Driver #', 'Amount', 'Request Date', 'Status', 'Notes'],
                                    'driver-advances.csv'
                                );
                            } else if (view === 'balances' && driverBalances.length) {
                                exportToCSV(
                                    driverBalances.map((b) => ({
                                        Driver: b.driverName,
                                        'Driver #': b.driverNumber,
                                        'Pending Advances': b.pendingAdvances,
                                        'Approved Advances': b.approvedAdvances,
                                        'Negative Balance': b.negativeBalance,
                                        'Total Owed': b.totalOwed,
                                    })),
                                    ['Driver', 'Driver #', 'Pending Advances', 'Approved Advances', 'Negative Balance', 'Total Owed'],
                                    'driver-balances.csv'
                                );
                            }
                        }}>
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </div>

                <TabsContent value="advances" className="mt-4">
                    <AdvancesTable advances={advances} isLoading={loadingAdvances} />
                </TabsContent>

                <TabsContent value="balances" className="mt-4">
                    <BalancesTable balances={driverBalances} isLoading={loadingAdvances} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

/** Stat card component */
function StatCard({
    title,
    value,
    icon: Icon,
    isLoading,
    variant = 'default',
    isCount = false,
}: {
    title: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    isLoading: boolean;
    variant?: 'default' | 'success' | 'warning';
    isCount?: boolean;
}) {
    const colorClass = {
        default: 'text-foreground',
        success: 'text-green-600',
        warning: 'text-orange-500',
    }[variant];

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-sm text-muted-foreground">{title}</div>
                        <div className={`text-2xl font-bold ${colorClass}`}>
                            {isLoading ? (
                                <Skeleton className="h-8 w-24" />
                            ) : isCount ? (
                                value.toLocaleString()
                            ) : (
                                formatCurrency(value)
                            )}
                        </div>
                    </div>
                    <Icon className="h-8 w-8 text-muted-foreground/50" />
                </div>
            </CardContent>
        </Card>
    );
}

/** Advances table component */
function AdvancesTable({
    advances,
    isLoading,
}: {
    advances?: DriverAdvance[];
    isLoading: boolean;
}) {
    const [sorting, setSorting] = React.useState<SortingState>([]);

    const enrichedAdvances = React.useMemo(() => (advances || []).map(a => ({
        ...a,
        driverName: `${a.driver.user.firstName} ${a.driver.user.lastName}`,
        driverNumber: a.driver.driverNumber,
    })), [advances]);

    const columns = React.useMemo<ColumnDef<any>[]>(() => [
        { accessorKey: 'advanceNumber', header: 'Advance #' },
        { accessorKey: 'driverName', header: 'Driver' },
        { accessorKey: 'driverNumber', header: 'Driver #' },
        { accessorKey: 'amount', header: 'Amount' },
        { accessorKey: 'requestDate', header: 'Request Date' },
        { accessorKey: 'approvalStatus', header: 'Status' },
        { accessorKey: 'approvedAt', header: 'Approved Date' },
        { accessorKey: 'notes', header: 'Notes' },
    ], []);

    const table = useReactTable({
        data: enrichedAdvances,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    return (
        <div className="border rounded-lg overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        <SortableHeader column={table.getColumn('advanceNumber')!}>Advance #</SortableHeader>
                        <SortableHeader column={table.getColumn('driverName')!}>Driver</SortableHeader>
                        <SortableHeader column={table.getColumn('driverNumber')!}>Driver #</SortableHeader>
                        <SortableHeader column={table.getColumn('amount')!} className="text-right">Amount</SortableHeader>
                        <SortableHeader column={table.getColumn('requestDate')!}>Request Date</SortableHeader>
                        <SortableHeader column={table.getColumn('approvalStatus')!}>Status</SortableHeader>
                        <SortableHeader column={table.getColumn('approvedAt')!}>Approved Date</SortableHeader>
                        <SortableHeader column={table.getColumn('notes')!}>Notes</SortableHeader>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        [...Array(5)].map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            </TableRow>
                        ))
                    ) : advances && advances.length > 0 ? (
                        table.getRowModel().rows.map((row) => {
                            const adv = row.original;
                            return (
                                <TableRow key={adv.id} className="hover:bg-muted/50">
                                    <TableCell className="font-medium">{adv.advanceNumber || '-'}</TableCell>
                                    <TableCell>
                                        {adv.driver.user.firstName} {adv.driver.user.lastName}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {adv.driver.driverNumber}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(adv.amount)}
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(adv.requestDate), 'MMM d, yyyy')}
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={adv.approvalStatus} />
                                    </TableCell>
                                    <TableCell>
                                        {adv.approvedAt ? format(new Date(adv.approvedAt), 'MMM d, yyyy') : '-'}
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate">
                                        {adv.notes || '-'}
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    ) : (
                        <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                No advance requests found
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

/** Balances table component */
function BalancesTable({
    balances,
    isLoading,
}: {
    balances: DriverBalance[];
    isLoading: boolean;
}) {
    const [sorting, setSorting] = React.useState<SortingState>([]);

    const columns = React.useMemo<ColumnDef<DriverBalance>[]>(() => [
        { accessorKey: 'driverName', header: 'Driver' },
        { accessorKey: 'driverNumber', header: 'Driver #' },
        { accessorKey: 'pendingAdvances', header: 'Pending Advances' },
        { accessorKey: 'approvedAdvances', header: 'Approved Advances' },
        { accessorKey: 'negativeBalance', header: 'Negative Balance' },
        { accessorKey: 'totalOwed', header: 'Total Owed' },
    ], []);

    const table = useReactTable({
        data: balances,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    return (
        <div className="border rounded-lg overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        <SortableHeader column={table.getColumn('driverName')!}>Driver</SortableHeader>
                        <SortableHeader column={table.getColumn('driverNumber')!}>Driver #</SortableHeader>
                        <SortableHeader column={table.getColumn('pendingAdvances')!} className="text-right">Pending Advances</SortableHeader>
                        <SortableHeader column={table.getColumn('approvedAdvances')!} className="text-right">Approved Advances</SortableHeader>
                        <SortableHeader column={table.getColumn('negativeBalance')!} className="text-right">Negative Balance</SortableHeader>
                        <SortableHeader column={table.getColumn('totalOwed')!} className="text-right">Total Owed</SortableHeader>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        [...Array(5)].map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                            </TableRow>
                        ))
                    ) : balances.length > 0 ? (
                        table.getRowModel().rows.map((row) => {
                            const balance = row.original;
                            return (
                                <TableRow key={balance.driverId} className="hover:bg-muted/50">
                                    <TableCell className="font-medium">{balance.driverName}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {balance.driverNumber}
                                    </TableCell>
                                    <TableCell className="text-right text-orange-500">
                                        {formatCurrency(balance.pendingAdvances)}
                                    </TableCell>
                                    <TableCell className="text-right text-green-600">
                                        {formatCurrency(balance.approvedAdvances)}
                                    </TableCell>
                                    <TableCell className="text-right text-destructive">
                                        {formatCurrency(balance.negativeBalance)}
                                    </TableCell>
                                    <TableCell className="text-right font-bold">
                                        {formatCurrency(balance.totalOwed)}
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                No driver balances to display
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

/** Status badge component */
function StatusBadge({ status }: { status: 'PENDING' | 'APPROVED' | 'REJECTED' }) {
    const variants: Record<string, { class: string; label: string }> = {
        PENDING: { class: 'bg-orange-500 hover:bg-orange-600 text-white', label: 'Pending' },
        APPROVED: { class: 'bg-green-500 hover:bg-green-600 text-white', label: 'Approved' },
        REJECTED: { class: 'bg-red-500 hover:bg-red-600 text-white', label: 'Rejected' },
    };
    const variant = variants[status] || variants.PENDING;

    return (
        <Badge className={variant.class}>
            {variant.label}
        </Badge>
    );
}

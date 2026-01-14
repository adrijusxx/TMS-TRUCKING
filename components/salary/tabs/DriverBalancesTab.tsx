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
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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

    // Fetch driver advances
    const { data: advances, isLoading: loadingAdvances } = useQuery({
        queryKey: ['driver-advances'],
        queryFn: async () => {
            const response = await fetch(apiUrl('/api/advances/driver?limit=100'));
            if (!response.ok) throw new Error('Failed to fetch advances');
            const result = await response.json();
            return (result.data || []) as DriverAdvance[];
        },
    });

    // Calculate driver balances from advances
    const driverBalances = React.useMemo(() => {
        if (!advances) return [];

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
                    negativeBalance: 0,
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
    }, [advances]);

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['driver-advances'] });
        toast.success('Data refreshed');
    };

    // Summary stats
    const stats = React.useMemo(() => {
        if (!advances) return { pending: 0, approved: 0, total: 0, count: 0 };
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
                        <Button variant="outline" size="sm">
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
    return (
        <div className="border rounded-lg overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        <TableHead>Advance #</TableHead>
                        <TableHead>Driver</TableHead>
                        <TableHead>Driver #</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Request Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Approved Date</TableHead>
                        <TableHead>Notes</TableHead>
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
                        advances.map((adv) => (
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
                        ))
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
    return (
        <div className="border rounded-lg overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        <TableHead>Driver</TableHead>
                        <TableHead>Driver #</TableHead>
                        <TableHead className="text-right">Pending Advances</TableHead>
                        <TableHead className="text-right">Approved Advances</TableHead>
                        <TableHead className="text-right">Negative Balance</TableHead>
                        <TableHead className="text-right">Total Owed</TableHead>
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
                        balances.map((balance) => (
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
                        ))
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

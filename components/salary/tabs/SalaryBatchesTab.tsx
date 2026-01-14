'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Filter,
    Plus,
    Trash2,
    RefreshCw,
    Download,
    Columns,
    ChevronDown,
    MoreHorizontal,
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, getWeek } from 'date-fns';
import { apiUrl, formatCurrency } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';

interface SalaryBatch {
    id: string;
    batchNumber: string;
    postStatus: 'POSTED' | 'UNPOSTED';
    createdBy: {
        firstName: string;
        lastName: string;
    };
    createdAt: string;
    checkDate: string | null;
    periodStart: string;
    periodEnd: string;
    settlementCount: number;
    totalAmount: number;
    payCompany: string | null;
    notes: string | null;
    weekNumber: number;
}

/**
 * SalaryBatchesTab - Displays settlement batches grouped by pay period
 * Main view matching the datatruck Salary batches design
 */
export default function SalaryBatchesTab() {
    const { can } = usePermissions();
    const queryClient = useQueryClient();
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

    // Fetch settlements grouped as batches
    const { data: batches, isLoading, error } = useQuery({
        queryKey: ['salary-batches'],
        queryFn: async () => {
            const response = await fetch(apiUrl('/api/settlements?limit=100'));
            if (!response.ok) throw new Error('Failed to fetch settlements');
            const result = await response.json();

            // Group settlements by week into virtual batches
            return groupSettlementsIntoBatches(result.data || []);
        },
    });

    const toggleSelectAll = () => {
        if (!batches) return;
        if (selectedIds.size === batches.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(batches.map((b) => b.id)));
        }
    };

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['salary-batches'] });
        toast.success('Data refreshed');
    };

    if (error) {
        return (
            <div className="text-center py-8 text-destructive">
                Failed to load salary batches. Please try again.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                </Button>

                {can('settlements.create') && (
                    <Button size="sm" className="bg-primary">
                        <Plus className="h-4 w-4 mr-2" />
                        Create new batch
                    </Button>
                )}

                {selectedIds.size > 0 && (
                    <>
                        <Button variant="outline" size="sm" className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    Change status
                                    <ChevronDown className="h-4 w-4 ml-2" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem>Mark as Posted</DropdownMenuItem>
                                <DropdownMenuItem>Mark as Unposted</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </>
                )}

                <div className="flex-1" />

                <Button variant="outline" size="sm" onClick={handleRefresh}>
                    <RefreshCw className="h-4 w-4" />
                </Button>

                <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                </Button>

                <Button variant="outline" size="sm">
                    <Columns className="h-4 w-4 mr-2" />
                    Columns
                </Button>
            </div>

            {/* Selection info */}
            {selectedIds.size > 0 && (
                <div className="text-sm text-muted-foreground">
                    {selectedIds.size} batch(es) selected
                </div>
            )}

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="w-10">
                                <Checkbox
                                    checked={batches && batches.length > 0 && selectedIds.size === batches.length}
                                    onCheckedChange={toggleSelectAll}
                                />
                            </TableHead>
                            <TableHead className="font-medium">Batch ID</TableHead>
                            <TableHead className="font-medium">Post status</TableHead>
                            <TableHead className="font-medium">Created by</TableHead>
                            <TableHead className="font-medium">Created date</TableHead>
                            <TableHead className="font-medium">Check date</TableHead>
                            <TableHead className="font-medium">Period</TableHead>
                            <TableHead className="font-medium text-center">Settlements</TableHead>
                            <TableHead className="font-medium text-right">Amount</TableHead>
                            <TableHead className="font-medium">Pay company</TableHead>
                            <TableHead className="font-medium">Notes</TableHead>
                            <TableHead className="font-medium">Start date</TableHead>
                            <TableHead className="font-medium">End date</TableHead>
                            <TableHead className="font-medium text-center">Week #</TableHead>
                            <TableHead className="w-10" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                                </TableRow>
                            ))
                        ) : batches && batches.length > 0 ? (
                            batches.map((batch) => (
                                <TableRow
                                    key={batch.id}
                                    className="hover:bg-muted/50 cursor-pointer"
                                >
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                            checked={selectedIds.has(batch.id)}
                                            onCheckedChange={() => toggleSelect(batch.id)}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium text-primary">
                                        {batch.batchNumber}
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={batch.postStatus} />
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {batch.createdBy.firstName} {batch.createdBy.lastName}
                                    </TableCell>
                                    <TableCell>{format(new Date(batch.createdAt), 'MMM d, yyyy')}</TableCell>
                                    <TableCell>
                                        {batch.checkDate ? format(new Date(batch.checkDate), 'MMM d, yyyy') : '-'}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {format(new Date(batch.periodStart), 'MMM d, yyyy')} - {format(new Date(batch.periodEnd), 'MMM d, yyyy')}
                                    </TableCell>
                                    <TableCell className="text-center">{batch.settlementCount}</TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(batch.totalAmount)}
                                    </TableCell>
                                    <TableCell>{batch.payCompany || '-'}</TableCell>
                                    <TableCell className="max-w-[150px] truncate">{batch.notes || '-'}</TableCell>
                                    <TableCell>{format(new Date(batch.periodStart), 'M/d/yy')}</TableCell>
                                    <TableCell>{format(new Date(batch.periodEnd), 'M/d/yy')}</TableCell>
                                    <TableCell className="text-center">{batch.weekNumber}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>View details</DropdownMenuItem>
                                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                                <DropdownMenuItem>Export PDF</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={15} className="h-24 text-center text-muted-foreground">
                                    No salary batches found. Create your first batch to get started.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Footer */}
            {batches && batches.length > 0 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div>
                        Batch total count: {batches.length} · Sum: {formatCurrency(batches.reduce((sum, b) => sum + b.totalAmount, 0))}
                    </div>
                    <div className="flex items-center gap-2">
                        Rows per page: 20
                    </div>
                </div>
            )}
        </div>
    );
}

/** Status badge component */
function StatusBadge({ status }: { status: 'POSTED' | 'UNPOSTED' }) {
    return (
        <Badge
            variant={status === 'POSTED' ? 'default' : 'secondary'}
            className={
                status === 'POSTED'
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
            }
        >
            {status}
        </Badge>
    );
}

/** Group settlements into virtual batches by week */
function groupSettlementsIntoBatches(settlements: any[]): SalaryBatch[] {
    const batchMap = new Map<string, SalaryBatch>();

    settlements.forEach((settlement) => {
        const periodStart = new Date(settlement.periodStart);
        const weekStart = startOfWeek(periodStart, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(periodStart, { weekStartsOn: 1 });
        const weekNum = getWeek(periodStart, { weekStartsOn: 1 });
        const batchKey = `${weekStart.toISOString()}-${weekEnd.toISOString()}`;

        if (!batchMap.has(batchKey)) {
            batchMap.set(batchKey, {
                id: `batch-${batchKey}`,
                batchNumber: `SB-${format(weekStart, 'yyyyMMdd')}`,
                postStatus: settlement.status === 'PAID' ? 'POSTED' : 'UNPOSTED',
                createdBy: {
                    firstName: 'System',
                    lastName: 'Generated',
                },
                createdAt: settlement.createdAt,
                checkDate: settlement.paidDate || null,
                periodStart: weekStart.toISOString(),
                periodEnd: weekEnd.toISOString(),
                settlementCount: 0,
                totalAmount: 0,
                payCompany: null,
                notes: null,
                weekNumber: weekNum,
            });
        }

        const batch = batchMap.get(batchKey)!;
        batch.settlementCount += 1;
        batch.totalAmount += settlement.netPay || 0;

        // If any settlement in batch is not PAID, mark batch as UNPOSTED
        if (settlement.status !== 'PAID') {
            batch.postStatus = 'UNPOSTED';
        }
    });

    return Array.from(batchMap.values()).sort(
        (a, b) => new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime()
    );
}

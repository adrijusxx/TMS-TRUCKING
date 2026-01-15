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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Filter,
    Plus,
    Trash2,
    RefreshCw,
    Download,
    Columns,
    ChevronDown,
    MoreHorizontal,
    Loader2,
} from 'lucide-react';
import { format, getWeek, subWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { apiUrl, formatCurrency } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface SalaryBatch {
    id: string;
    batchNumber: string;
    status: 'OPEN' | 'POSTED' | 'ARCHIVED';
    createdById: string;
    createdBy: {
        firstName: string;
        lastName: string;
    };
    createdAt: string;
    postedAt: string | null;
    periodStart: string;
    periodEnd: string;
    settlementCount: number;
    totalAmount: number;
    notes: string | null;
}

export default function SalaryBatchesTab() {
    const { can } = usePermissions();
    const queryClient = useQueryClient();
    const router = useRouter();
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

    // Create Batch Dialog State
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);
    const [createPeriodStart, setCreatePeriodStart] = React.useState(() => {
        const lastWeek = subWeeks(new Date(), 1);
        const start = startOfWeek(lastWeek, { weekStartsOn: 1 });
        return format(start, 'yyyy-MM-dd');
    });
    const [createPeriodEnd, setCreatePeriodEnd] = React.useState(() => {
        const lastWeek = subWeeks(new Date(), 1);
        const end = endOfWeek(lastWeek, { weekStartsOn: 1 });
        return format(end, 'yyyy-MM-dd');
    });
    const [isCreating, setIsCreating] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const handleDelete = async (ids: string[]) => {
        if (!confirm('Are you sure you want to delete these batches? This will remove all associated settlements.')) return;

        setIsDeleting(true);
        try {
            await Promise.all(ids.map(id =>
                fetch(apiUrl(`/api/salary-batches/${id}`), { method: 'DELETE' })
            ));

            toast.success('Batches deleted');
            setSelectedIds(new Set());
            queryClient.invalidateQueries({ queryKey: ['salary-batches'] });
        } catch (error) {
            toast.error('Failed to delete');
        } finally {
            setIsDeleting(false);
        }
    };


    const { data: batches, isLoading, error } = useQuery<SalaryBatch[]>({
        queryKey: ['salary-batches'],
        queryFn: async () => {
            const response = await fetch(apiUrl('/api/salary-batches'));
            if (!response.ok) throw new Error('Failed to fetch batches');
            const result = await response.json();
            return result.data || [];
        },
    });

    const handleCreateBatch = async () => {
        if (!createPeriodStart || !createPeriodEnd) {
            toast.error('Please select both start and end dates');
            return;
        }

        try {
            setIsCreating(true);
            const response = await fetch(apiUrl('/api/salary-batches'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    periodStart: new Date(createPeriodStart).toISOString(),
                    periodEnd: new Date(createPeriodEnd).toISOString(),
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Failed to create batch');
            }

            const result = await response.json();

            toast.success(`Batch ${result.data?.batchNumber} created with ${result.meta?.settlementsCreated} settlements`);
            setIsCreateOpen(false);
            setCreatePeriodStart('');
            setCreatePeriodEnd('');
            queryClient.invalidateQueries({ queryKey: ['salary-batches'] });
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsCreating(false);
        }
    };

    const toggleSelectAll = () => {
        if (!batches) return;
        if (selectedIds.size === batches.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(batches.map((b) => b.id)));
        }
    };

    const toggleSelect = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
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

    const navigateToBatch = (id: string) => {
        router.push(`/dashboard/accounting/salary/batches/${id}`);
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
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="bg-primary">
                                <Plus className="h-4 w-4 mr-2" />
                                Create new batch
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create Salary Batch</DialogTitle>
                                <DialogDescription>
                                    Select the date range for this batch. The system will auto-generate draft settlements for all active drivers with delivered loads in this period.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Period Start</Label>
                                        <Input
                                            type="date"
                                            value={createPeriodStart}
                                            onChange={(e) => setCreatePeriodStart(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Period End</Label>
                                        <Input
                                            type="date"
                                            value={createPeriodEnd}
                                            onChange={(e) => setCreatePeriodEnd(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreateBatch} disabled={isCreating}>
                                    {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Draft Batch
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}

                {selectedIds.size > 0 && (
                    <>
                        <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDelete(Array.from(selectedIds))} disabled={isDeleting}>
                            {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            Delete
                        </Button>
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
            </div>

            {/* Selection info */}
            {selectedIds.size > 0 && (
                <div className="text-sm text-muted-foreground">
                    {selectedIds.size} batch(es) selected
                </div>
            )}

            {/* Table */}
            <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="w-10">
                                <Checkbox
                                    checked={batches && batches.length > 0 && selectedIds.size === batches.length}
                                    onCheckedChange={toggleSelectAll}
                                />
                            </TableHead>
                            <TableHead className="font-medium">Batch #</TableHead>
                            <TableHead className="font-medium">Status</TableHead>
                            <TableHead className="font-medium">Created by</TableHead>
                            <TableHead className="font-medium">Created date</TableHead>
                            <TableHead className="font-medium">Period</TableHead>
                            <TableHead className="font-medium text-center">Settlements</TableHead>
                            <TableHead className="font-medium text-right">Amount</TableHead>
                            <TableHead className="font-medium">Notes</TableHead>
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
                                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                                </TableRow>
                            ))
                        ) : batches && batches.length > 0 ? (
                            batches.map((batch) => (
                                <TableRow
                                    key={batch.id}
                                    className="hover:bg-muted/50 cursor-pointer"
                                    onClick={() => navigateToBatch(batch.id)}
                                >
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                            checked={selectedIds.has(batch.id)}
                                            onCheckedChange={(c) => toggleSelect(batch.id, { stopPropagation: () => { } } as any)}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium text-primary">
                                        {batch.batchNumber}
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={batch.status} />
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {batch.createdBy?.firstName} {batch.createdBy?.lastName}
                                    </TableCell>
                                    <TableCell>{format(new Date(batch.createdAt), 'MMM d, yyyy')}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {format(new Date(batch.periodStart), 'MMM d, yyyy')} - {format(new Date(batch.periodEnd), 'MMM d, yyyy')}
                                    </TableCell>
                                    <TableCell className="text-center">{batch.settlementCount}</TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(batch.totalAmount)}
                                    </TableCell>
                                    <TableCell className="max-w-[150px] truncate">{batch.notes || '-'}</TableCell>
                                    <TableCell className="text-center">
                                        {getWeek(new Date(batch.periodStart))}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => navigateToBatch(batch.id)}>View details</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete([batch.id]); }}>Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
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
                        Batch count: {batches.length} · Total: {formatCurrency(batches.reduce((sum, b) => sum + b.totalAmount, 0))}
                    </div>
                </div>
            )}
        </div>
    );
}

/** Status badge component */
function StatusBadge({ status }: { status: 'OPEN' | 'POSTED' | 'ARCHIVED' }) {
    let variant: 'default' | 'secondary' | 'outline' = 'secondary';
    let className = 'bg-gray-500 text-white';

    if (status === 'POSTED') {
        variant = 'default';
        className = 'bg-green-500 hover:bg-green-600 text-white';
    } else if (status === 'OPEN') {
        variant = 'secondary';
        className = 'bg-blue-500 hover:bg-blue-600 text-white';
    }

    return (
        <Badge variant={variant} className={className}>
            {status}
        </Badge>
    );
}

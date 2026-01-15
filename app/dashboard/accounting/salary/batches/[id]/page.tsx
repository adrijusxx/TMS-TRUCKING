'use client';

import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Download,
    Loader2,
    CheckCircle,
    Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { apiUrl, formatCurrency } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import SettlementSheet from '@/components/settlements/SettlementSheet';

export default function SalaryBatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params);
    const router = useRouter();
    const queryClient = useQueryClient();
    const { can } = usePermissions();

    const [isPosting, setIsPosting] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [showPostDialog, setShowPostDialog] = React.useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
    const [selectedSettlementId, setSelectedSettlementId] = React.useState<string | null>(null);
    const [sheetOpen, setSheetOpen] = React.useState(false);

    const { data: batch, isLoading, error } = useQuery({
        queryKey: ['salary-batch', id],
        queryFn: async () => {
            const res = await fetch(apiUrl(`/api/salary-batches/${id}`));
            if (!res.ok) throw new Error('Failed to load batch');
            const data = await res.json();
            return data.data;
        },
    });

    const handlePostBatch = async () => {
        try {
            setIsPosting(true);
            const res = await fetch(apiUrl(`/api/salary-batches/${id}`), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'POSTED' }),
            });

            if (!res.ok) throw new Error('Failed to post batch');

            toast.success('Batch posted successfully');
            setShowPostDialog(false);
            queryClient.invalidateQueries({ queryKey: ['salary-batch', id] });
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsPosting(false);
        }
    };

    const handleDeleteBatch = async () => {
        try {
            setIsDeleting(true);
            const res = await fetch(apiUrl(`/api/salary-batches/${id}`), {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to delete batch');

            toast.success('Batch deleted');
            router.push('/dashboard/accounting/salary');
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsDeleting(false);
        }
    };

    if (error) {
        return <div className="p-8 text-center text-destructive">Failed to load batch details.</div>;
    }

    if (isLoading) {
        return <BatchDetailSkeleton />;
    }

    if (!batch) return null;

    return (
        <div className="space-y-6 max-h-[calc(100vh-4rem)] overflow-y-auto p-4 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-3">
                            {batch.batchNumber}
                            <StatusBadge status={batch.status} />
                        </h1>
                        <p className="text-muted-foreground">
                            {format(new Date(batch.periodStart), 'MMM d, yyyy')} - {format(new Date(batch.periodEnd), 'MMM d, yyyy')}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {batch.status === 'OPEN' && can('settlements.create') && (
                        <>
                            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                                <DialogTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Batch
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Delete Batch?</DialogTitle>
                                        <DialogDescription>
                                            This will permanently delete the batch and all generated settlements inside it. This action cannot be undone.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
                                        <Button variant="destructive" onClick={handleDeleteBatch} disabled={isDeleting}>
                                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete Confirm'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
                                <DialogTrigger asChild>
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Post Batch
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Post Salary Batch?</DialogTitle>
                                        <DialogDescription>
                                            Posting this batch will lock all settlements and make them visible to drivers. Ensure you have reviewed all drafts.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setShowPostDialog(false)}>Cancel</Button>
                                        <Button onClick={handlePostBatch} disabled={isPosting}>
                                            {isPosting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post Now'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </>
                    )}

                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export Report
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(batch.totalAmount)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Settlements</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{batch.settlementCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Created By</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold truncate">
                            {batch.createdBy?.firstName} {batch.createdBy?.lastName}
                        </div>
                        <p className="text-xs text-muted-foreground">{format(new Date(batch.createdAt), 'PP p')}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Settlements Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Settlements</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Settlement #</TableHead>
                                <TableHead>Driver</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Gross Pay</TableHead>
                                <TableHead className="text-right">Deductions</TableHead>
                                <TableHead className="text-right">Net Pay</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {batch.settlements?.map((settlement: any) => (
                                <TableRow key={settlement.id}>
                                    <TableCell className="font-mono">{settlement.settlementNumber}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">
                                                {settlement.driver?.user?.firstName} {settlement.driver?.user?.lastName}
                                            </span>
                                            <span className="text-xs text-muted-foreground">{settlement.driver?.driverNumber}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{settlement.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">{formatCurrency(settlement.grossPay)}</TableCell>
                                    <TableCell className="text-right text-destructive">-{formatCurrency(settlement.deductions)}</TableCell>
                                    <TableCell className="text-right font-bold text-green-600">{formatCurrency(settlement.netPay)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => { setSelectedSettlementId(settlement.id); setSheetOpen(true); }}>
                                            Details
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <SettlementSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                settlementId={selectedSettlementId}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['salary-batch', id] });
                }}
            />
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    let variant: 'default' | 'secondary' | 'outline' = 'secondary';
    let className = 'bg-gray-500 text-white ml-2';

    if (status === 'POSTED') {
        variant = 'default';
        className = 'bg-green-500 hover:bg-green-600 text-white ml-2';
    } else if (status === 'OPEN') {
        variant = 'secondary';
        className = 'bg-blue-500 hover:bg-blue-600 text-white ml-2';
    }

    return (
        <Badge variant={variant} className={className}>
            {status}
        </Badge>
    );
}

function BatchDetailSkeleton() {
    return (
        <div className="space-y-6 p-8">
            <div className="flex items-center gap-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-48" />
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
            </div>
            <Skeleton className="h-[400px]" />
        </div>
    );
}

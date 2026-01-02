'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    DeletableEntity,
    searchDeletableItems,
    hardDeleteItems
} from '@/app/actions/super-admin/cleanup';
import McNumberSelector from '@/components/mc-numbers/McNumberSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2, AlertTriangle, Search } from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface CleanupClientProps {
    companies: { id: string; name: string; dotNumber: string }[];
}

export default function CleanupClient({ companies }: CleanupClientProps) {
    const [companyId, setCompanyId] = useState<string>('');
    const [mcNumberId, setMcNumberId] = useState<string>('');
    const [entityType, setEntityType] = useState<DeletableEntity>('loads');
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(1);
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmInput, setConfirmInput] = useState('');

    const queryClient = useQueryClient();

    // Fetch Data
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['cleanup-items', companyId, mcNumberId, entityType, search, page],
        queryFn: () => searchDeletableItems({
            companyId: companyId || undefined,
            mcNumberId: mcNumberId || undefined,
            entityType,
            search,
            page
        }),
        enabled: !!companyId, // Only fetch if company is selected (safety)
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async () => {
            const ids = Array.from(selectedIds);
            return hardDeleteItems(entityType, ids);
        },
        onSuccess: (result) => {
            if (result.success) {
                toast.success(result.message);
                setSelectedIds(new Set());
                setShowConfirm(false);
                setConfirmInput('');
                refetch();
            } else {
                toast.error(`Error: ${(result as any).error || (result as any).message}`);
            }
        },
        onError: (err) => {
            toast.error('Failed to delete items');
            console.error(err);
        }
    });

    const handleSelectAll = (checked: boolean) => {
        if (checked && data?.data) {
            const newSelected = new Set(selectedIds);
            data.data.forEach((item: any) => newSelected.add(item.id));
            setSelectedIds(newSelected);
        } else if (!checked && data?.data) {
            const newSelected = new Set(selectedIds);
            data.data.forEach((item: any) => newSelected.delete(item.id));
            setSelectedIds(newSelected);
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        const newSelected = new Set(selectedIds);
        if (checked) newSelected.add(id);
        else newSelected.delete(id);
        setSelectedIds(newSelected);
    };

    const handleDeleteClick = () => {
        if (selectedIds.size === 0) return;
        setShowConfirm(true);
    };

    const isAllSelected = (data?.data?.length ?? 0) > 0 && data?.data?.every((item: any) => selectedIds.has(item.id));

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-lg border shadow-sm">
                <div className="space-y-2">
                    <Label>Select Company</Label>
                    <Select value={companyId} onValueChange={setCompanyId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Company" />
                        </SelectTrigger>
                        <SelectContent>
                            {companies.map(c => (
                                <SelectItem key={c.id} value={c.id}>
                                    {c.name} ({c.dotNumber})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <McNumberSelector
                        companyId={companyId}
                        value={mcNumberId}
                        onValueChange={setMcNumberId}
                        label="MC Number (Optional)"
                        disabled={!companyId}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Entity Type</Label>
                    <Select value={entityType} onValueChange={(v: DeletableEntity) => {
                        setEntityType(v);
                        setSelectedIds(new Set());
                        setPage(1);
                    }}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="loads">Loads</SelectItem>
                            <SelectItem value="drivers">Drivers</SelectItem>
                            <SelectItem value="trucks">Trucks</SelectItem>
                            <SelectItem value="trailers">Trailers</SelectItem>
                            <SelectItem value="users">Users</SelectItem>
                            <SelectItem value="invoices">Invoices</SelectItem>
                            <SelectItem value="settlements">Settlements</SelectItem>
                            <SelectItem value="batches">Batches</SelectItem>
                            <SelectItem value="customers">Customers</SelectItem>
                            <SelectItem value="vendors">Vendors</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Search</Label>
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={`Search ${entityType}...`}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-lg border shadow-sm">
                <div className="p-4 flex items-center justify-between border-b bg-gray-50">
                    <div className="flex items-center gap-2">
                        <h2 className="font-semibold text-lg capitalize">{entityType} List</h2>
                        {data?.total ? <Badge variant="secondary">{data.total} total</Badge> : null}
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedIds.size > 0 && (
                            <Button
                                variant="destructive"
                                onClick={handleDeleteClick}
                                className="gap-2"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete Selected ({selectedIds.size})
                            </Button>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="relative min-h-[400px]">
                    {!companyId ? (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                            Please select a company to view data
                        </div>
                    ) : isLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : data?.data?.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                            No records found
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">
                                        <Checkbox
                                            checked={isAllSelected}
                                            onCheckedChange={handleSelectAll}
                                        />
                                    </TableHead>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Identifier</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created At</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.data?.map((item: any) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedIds.has(item.id)}
                                                onCheckedChange={(checked) => handleSelectOne(item.id, checked as boolean)}
                                            />
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-muted-foreground">{item.id}</TableCell>
                                        <TableCell className="font-medium">
                                            {entityType === 'loads' && item.loadNumber}
                                            {entityType === 'drivers' && `${item.driverNumber} (${item.user?.firstName} ${item.user?.lastName})`}
                                            {entityType === 'trucks' && item.truckNumber}
                                            {entityType === 'trailers' && item.trailerNumber}
                                            {entityType === 'users' && `${item.firstName} ${item.lastName} (${item.email})`}
                                            {entityType === 'invoices' && item.invoiceNumber}
                                            {entityType === 'settlements' && item.settlementNumber}
                                            {entityType === 'batches' && item.batchNumber}
                                            {entityType === 'customers' && item.name}
                                            {entityType === 'vendors' && item.name}
                                        </TableCell>
                                        <TableCell>
                                            {item.status ? (
                                                <Badge variant="outline">{String(item.status)}</Badge>
                                            ) : item.postStatus ? (
                                                <Badge variant="outline">{String(item.postStatus)}</Badge>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>

                {/* Pagination (Simple) */}
                {(data?.total ?? 0) > 50 && (
                    <div className="p-4 border-t flex justify-end gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={(data?.data?.length ?? 0) < 50}
                            onClick={() => setPage(p => p + 1)}
                        >
                            Next
                        </Button>
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
                <DialogContent className="border-red-500 border-2">
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            CONFIRM HARD DELETE
                        </DialogTitle>
                        <DialogDescription className="text-base text-gray-900 font-medium pt-2">
                            You are about to PERMANENTLY delete {selectedIds.size} records.
                            <br />
                            This action CANNOT be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        <p className="text-sm text-red-600 bg-red-50 p-3 rounded">
                            Warning: This will perform a hard delete on the database.
                            Any related data relying on these records could be affected or deleted if cascading is enabled.
                        </p>

                        <div className="space-y-2">
                            <Label>Type "DELETE" to confirm:</Label>
                            <Input
                                value={confirmInput}
                                onChange={(e) => setConfirmInput(e.target.value)}
                                placeholder="DELETE"
                                className="border-red-300 focus:border-red-500"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowConfirm(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            disabled={confirmInput !== 'DELETE' || deleteMutation.isPending}
                            onClick={() => deleteMutation.mutate()}
                        >
                            {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            YES, DELETE PERMANENTLY
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

'use client';

import { useQuery } from '@tanstack/react-query';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, formatCurrency, apiUrl } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Wrench, Plus, History, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import MaintenanceForm from './MaintenanceForm';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface MaintenanceHistorySheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    truckId: string;
    truckNumber: string;
}

export default function MaintenanceHistorySheet({
    open,
    onOpenChange,
    truckId,
    truckNumber,
}: MaintenanceHistorySheetProps) {
    const [isCreating, setIsCreating] = useState(false);
    const [editingRecord, setEditingRecord] = useState<any>(null);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['maintenanceHistory', truckId],
        queryFn: async () => {
            const response = await fetch(apiUrl(`/api/maintenance?truckId=${truckId}`));
            if (!response.ok) throw new Error('Failed to fetch history');
            return response.json();
        },
        enabled: !!truckId && open,
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(apiUrl(`/api/maintenance/${id}`), {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete record');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenanceHistory', truckId] });
            queryClient.invalidateQueries({ queryKey: ['maintenanceSchedules'] });
            toast.success('Record deleted');
        },
        onError: (err: any) => toast.error(err.message),
    });

    const records = data?.data || [];

    return (
        <Sheet open={open} onOpenChange={(val) => {
            onOpenChange(val);
            if (!val) {
                setIsCreating(false);
                setEditingRecord(null);
            }
        }}>
            <SheetContent className="sm:max-w-xl flex flex-col p-0">
                <SheetHeader className="p-6 pb-2">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="flex items-center gap-2">
                            {isCreating || editingRecord ? (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                        setIsCreating(false);
                                        setEditingRecord(null);
                                    }}
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            ) : (
                                <History className="h-5 w-5 text-primary" />
                            )}
                            {isCreating ? 'New Maintenance' : editingRecord ? 'Edit Maintenance' : `Maintenance History: #${truckNumber}`}
                        </SheetTitle>
                        {!isCreating && !editingRecord && (
                            <Button size="sm" onClick={() => setIsCreating(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Record
                            </Button>
                        )}
                    </div>
                    <SheetDescription>
                        {isCreating
                            ? 'Fill in the details for the new maintenance record.'
                            : editingRecord
                                ? 'Update the maintenance record details below.'
                                : `Viewing the complete service history for truck #${truckNumber}.`}
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="flex-1">
                    {isCreating || editingRecord ? (
                        <div className="p-1">
                            <MaintenanceForm
                                id={editingRecord?.id}
                                initialData={editingRecord || { truckId }}
                                onSuccess={() => {
                                    setIsCreating(false);
                                    setEditingRecord(null);
                                    queryClient.invalidateQueries({ queryKey: ['maintenanceHistory', truckId] });
                                }}
                                onCancel={() => {
                                    setIsCreating(false);
                                    setEditingRecord(null);
                                }}
                            />
                        </div>
                    ) : (
                        <div className="p-6 pt-2">
                            {isLoading ? (
                                <div className="py-8 text-center text-muted-foreground">Loading history...</div>
                            ) : records.length === 0 ? (
                                <div className="py-12 text-center text-muted-foreground">
                                    <Wrench className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                    <p>No records found for this truck.</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Cost</TableHead>
                                            <TableHead>Odometer</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {records.map((record: any) => (
                                            <TableRow key={record.id}>
                                                <TableCell className="whitespace-nowrap font-medium">
                                                    {formatDate(record.date)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-[10px] uppercase">
                                                        {record.type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{formatCurrency(record.cost)}</TableCell>
                                                <TableCell className="text-xs">
                                                    {record.odometer.toLocaleString()} mi
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7"
                                                            onClick={() => setEditingRecord(record)}
                                                        >
                                                            <Edit className="h-3.5 w-3.5" />
                                                        </Button>

                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Delete Record?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Are you sure you want to delete this maintenance record for truck #{truckNumber}? This action cannot be undone.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => deleteMutation.mutate(record.id)}
                                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                    >
                                                                        Delete
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    )}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}

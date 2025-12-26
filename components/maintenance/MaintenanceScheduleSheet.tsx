'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';
import { Loader2, Calendar, TrendingUp, Clock, Trash2 } from 'lucide-react';
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

interface MaintenanceScheduleSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    truckId: string;
    initialData?: any;
}

export default function MaintenanceScheduleSheet({
    open,
    onOpenChange,
    truckId,
    initialData,
}: MaintenanceScheduleSheetProps) {
    const queryClient = useQueryClient();
    const isEditing = !!initialData?.isCustom;

    const [formData, setFormData] = useState({
        maintenanceType: 'PM_A',
        intervalMiles: 0,
        intervalMonths: 0,
    });

    useEffect(() => {
        if (open && initialData) {
            setFormData({
                maintenanceType: initialData.maintenanceType || 'PM_A',
                intervalMiles: initialData.intervalMiles || 0,
                intervalMonths: initialData.intervalMonths || 0,
            });
        } else if (open) {
            setFormData({
                maintenanceType: 'PM_A',
                intervalMiles: 0,
                intervalMonths: 0,
            });
        }
    }, [open, initialData]);

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            const url = isEditing
                ? apiUrl(`/api/fleet/maintenance/schedules/${initialData.id}`)
                : apiUrl('/api/fleet/maintenance/schedules');
            const method = isEditing ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, truckId }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Failed to save schedule');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenanceSchedules'] });
            toast.success(isEditing ? 'Schedule updated' : 'Custom schedule created');
            onOpenChange(false);
        },
        onError: (error: any) => {
            toast.error(error.message);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            if (!initialData?.id) return;
            const response = await fetch(apiUrl(`/api/fleet/maintenance/schedules/${initialData.id}`), {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete schedule');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenanceSchedules'] });
            toast.success('Custom schedule removed');
            onOpenChange(false);
        },
        onError: (error: any) => {
            toast.error(error.message);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md flex flex-col p-0">
                <SheetHeader className="p-6 pb-2">
                    <SheetTitle className="flex items-center gap-2 text-xl">
                        <Calendar className="h-5 w-5 text-primary" />
                        {isEditing ? 'Edit Schedule' : 'Create Custom Schedule'}
                    </SheetTitle>
                    <SheetDescription>
                        Set custom maintenance intervals for this truck. Leaving a value at 0 will disable that interval trigger.
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                    <div className="flex-1 p-6 space-y-6">
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="type">Maintenance Type</Label>
                                <Select
                                    value={formData.maintenanceType}
                                    onValueChange={(val) => setFormData({ ...formData, maintenanceType: val })}
                                    disabled={isEditing}
                                >
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PM_A">PM_A (Standard)</SelectItem>
                                        <SelectItem value="PM_B">PM_B (Standard)</SelectItem>
                                        <SelectItem value="TIRES">Tires</SelectItem>
                                        <SelectItem value="REPAIR">Repair</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="miles" className="flex items-center gap-2">
                                        <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                                        Miles
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="miles"
                                            type="number"
                                            value={formData.intervalMiles}
                                            onChange={(e) => setFormData({ ...formData, intervalMiles: parseInt(e.target.value) || 0 })}
                                            placeholder="15000"
                                            className="h-11 pr-12"
                                        />
                                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-muted-foreground text-xs font-semibold uppercase">
                                            mi
                                        </div>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="months" className="flex items-center gap-2">
                                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                        Months
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="months"
                                            type="number"
                                            value={formData.intervalMonths}
                                            onChange={(e) => setFormData({ ...formData, intervalMonths: parseInt(e.target.value) || 0 })}
                                            placeholder="6"
                                            className="h-11 pr-12"
                                        />
                                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-muted-foreground text-xs font-semibold uppercase">
                                            mos
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {isEditing && (
                            <div className="pt-4 border-t">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/20"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete Custom Schedule
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Remove Custom Schedule?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will delete your custom intervals and revert to the company default for this service type.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => deleteMutation.mutate()}
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                                Remove
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        )}
                    </div>

                    <div className="p-6 pt-2 border-t bg-muted/20 flex items-center justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={mutation.isPending} className="px-8">
                            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? 'Save Changes' : 'Create Schedule'}
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}

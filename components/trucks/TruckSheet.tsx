'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import CreateTruckForm from './CreateTruckForm';
import EditTruckForm from './EditTruckForm';
import TruckDetail from './TruckDetail';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '@/lib/utils';
import { Loader2, Truck, Plus } from 'lucide-react';

type SheetMode = 'create' | 'edit' | 'view';

interface TruckSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: SheetMode;
    truckId?: string | null;
    onSuccess?: (truckId?: string) => void;
}

async function fetchTruck(id: string) {
    const response = await fetch(apiUrl(`/api/trucks/${id}`));
    if (!response.ok) throw new Error('Failed to fetch truck');
    return response.json();
}

export default function TruckSheet({ open, onOpenChange, mode, truckId, onSuccess }: TruckSheetProps) {
    const queryClient = useQueryClient();

    const { data: truckData, isLoading: isLoadingTruck } = useQuery({
        queryKey: ['truck', truckId],
        queryFn: () => fetchTruck(truckId as string),
        enabled: !!truckId && (mode === 'edit' || mode === 'view') && open,
    });

    const truck = truckData?.data;

    const handleSuccess = (id?: string) => {
        onOpenChange(false);
        queryClient.invalidateQueries({ queryKey: ['trucks'] });
        if (onSuccess) onSuccess(id);
    };

    const getTitle = () => {
        if (mode === 'create') return 'Create New Truck';
        return `Truck #${truck?.truckNumber || ''}`;
    };

    const getDescription = () => {
        if (mode === 'create') return 'Fill in the details to add a new truck to your fleet.';
        return 'View and edit truck specifications and compliance details.';
    };

    const getIcon = () => {
        if (mode === 'create') return <Plus className="h-5 w-5 text-primary" />;
        return <Truck className="h-5 w-5 text-primary" />;
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl overflow-y-auto p-0 border-l border-border/50 bg-background/95 backdrop-blur-sm"
            >
                <SheetHeader className="px-6 py-4 border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur-sm z-20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            {getIcon()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <SheetTitle className="text-base font-semibold">{getTitle()}</SheetTitle>
                            <SheetDescription className="text-xs mt-0.5">{getDescription()}</SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="p-6">
                    {mode === 'create' && (
                        <CreateTruckForm
                            onSuccess={handleSuccess}
                            onCancel={() => onOpenChange(false)}
                            isSheet={true}
                        />
                    )}

                    {(mode === 'edit' || mode === 'view') && (
                        <>
                            {isLoadingTruck ? (
                                <div className="flex h-32 items-center justify-center">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : truck ? (
                                <EditTruckForm
                                    truck={truck}
                                    onSuccess={() => handleSuccess(truck.id)}
                                    onCancel={() => onOpenChange(false)}
                                />
                            ) : (
                                <div className="text-center text-muted-foreground py-8">Truck not found</div>
                            )}
                        </>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

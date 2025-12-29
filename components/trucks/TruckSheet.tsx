'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import CreateTruckForm from './CreateTruckForm';
import EditTruckForm from './EditTruckForm';
import TruckDetail from './TruckDetail';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

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

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl overflow-y-auto">
                <SheetHeader className="mb-4">
                    <SheetTitle>{getTitle()}</SheetTitle>
                    <SheetDescription>{getDescription()}</SheetDescription>
                </SheetHeader>

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
                            <div className="flex h-full items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : truck ? (
                            <EditTruckForm
                                truck={truck}
                                onSuccess={() => handleSuccess(truck.id)}
                                onCancel={() => onOpenChange(false)}
                            />
                        ) : (
                            <div className="text-center text-muted-foreground">Truck not found</div>
                        )}
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}

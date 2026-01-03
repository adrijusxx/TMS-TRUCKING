'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import CreateLoadForm from './CreateLoadForm';
import LoadDetail from './LoadDetail'; // Reuse existing detail view as unified view/edit
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

type SheetMode = 'create' | 'edit' | 'view';

interface LoadSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: SheetMode;
    loadId?: string | null;
    initialData?: any;
}

async function fetchLoadWithDetails(id: string) {
    const response = await fetch(apiUrl(`/api/loads/${id}`));
    if (!response.ok) throw new Error('Failed to fetch load');
    return response.json();
}

async function fetchAvailableDrivers() {
    const response = await fetch(apiUrl('/api/drivers?status=AVAILABLE&limit=100'));
    if (!response.ok) throw new Error('Failed to fetch drivers');
    return response.json();
}

async function fetchAvailableTrucks() {
    const response = await fetch(apiUrl('/api/trucks?status=AVAILABLE&limit=100'));
    if (!response.ok) throw new Error('Failed to fetch trucks');
    return response.json();
}

export default function LoadSheet({ open, onOpenChange, mode, loadId, initialData }: LoadSheetProps) {
    const queryClient = useQueryClient();

    // Data fetching for Edit/View modes
    const { data: loadData, isLoading: isLoadingLoad } = useQuery({
        queryKey: ['load', loadId],
        queryFn: () => fetchLoadWithDetails(loadId!),
        enabled: !!loadId && (mode === 'edit' || mode === 'view') && open,
    });

    const { data: driversData } = useQuery({
        queryKey: ['available-drivers'],
        queryFn: fetchAvailableDrivers,
        enabled: open && (mode === 'edit' || mode === 'view'),
    });

    const { data: trucksData } = useQuery({
        queryKey: ['available-trucks'],
        queryFn: fetchAvailableTrucks,
        enabled: open && (mode === 'edit' || mode === 'view'),
    });

    const load = loadData?.data;
    const availableDrivers = driversData?.data || [];
    const availableTrucks = trucksData?.data || [];

    const handleSuccess = () => {
        onOpenChange(false);
        queryClient.invalidateQueries({ queryKey: ['loads'] });
    };

    const getTitle = () => {
        if (mode === 'create') return 'Create New Load';
        return `Load: ${load?.loadNumber || ''}`;
    };

    const getDescription = () => {
        if (mode === 'create') return 'Fill in the details to create a new load.';
        return 'View and manage load details, route, and financials.';
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl overflow-y-auto">
                <SheetHeader className="mb-4">
                    <SheetTitle>{getTitle()}</SheetTitle>
                    <SheetDescription>{getDescription()}</SheetDescription>
                </SheetHeader>

                {mode === 'create' && (
                    <CreateLoadForm
                        onSuccess={handleSuccess}
                        onCancel={() => onOpenChange(false)}
                        isSheet={true}
                        initialData={initialData}
                    />
                )}

                {(mode === 'edit' || mode === 'view') && (
                    <>
                        {isLoadingLoad ? (
                            <div className="flex h-full items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : load ? (
                            <LoadDetail
                                load={load}
                                availableDrivers={availableDrivers}
                                availableTrucks={availableTrucks}
                                onSuccess={handleSuccess}
                                onCancel={() => onOpenChange(false)}
                                isSheet={true}
                            />
                        ) : (
                            <div className="text-center text-muted-foreground">Load not found</div>
                        )}
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}

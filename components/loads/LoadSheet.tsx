'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import CreateLoadForm from './CreateLoadForm';
import LoadDetail from './LoadDetail'; // Reuse existing detail view as unified view/edit
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '@/lib/utils';
import { Loader2, Package, Plus } from 'lucide-react';
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

    const getIcon = () => {
        if (mode === 'create') return <Plus className="h-5 w-5 text-primary" />;
        return <Package className="h-5 w-5 text-primary" />;
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-5xl overflow-y-auto p-0 border-l border-border/50 bg-background/95 backdrop-blur-sm"
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
                                <div className="flex h-32 items-center justify-center">
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
                                <div className="text-center text-muted-foreground py-8">Load not found</div>
                            )}
                        </>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

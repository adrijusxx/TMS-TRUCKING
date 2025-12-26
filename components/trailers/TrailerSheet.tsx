'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import CreateTrailerForm from './CreateTrailerForm';
import EditTrailerForm from './EditTrailerForm';
import TrailerDetail from './TrailerDetail';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

type SheetMode = 'create' | 'edit' | 'view';

interface TrailerSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: SheetMode;
    trailerId?: string | null;
    onSuccess?: (trailerId?: string) => void;
}

async function fetchTrailer(id: string) {
    const response = await fetch(apiUrl(`/api/trailers/${id}`));
    if (!response.ok) throw new Error('Failed to fetch trailer');
    return response.json();
}

export default function TrailerSheet({ open, onOpenChange, mode, trailerId, onSuccess }: TrailerSheetProps) {
    const queryClient = useQueryClient();

    const { data: trailerData, isLoading: isLoadingTrailer } = useQuery({
        queryKey: ['trailer', trailerId],
        queryFn: () => fetchTrailer(trailerId as string),
        enabled: !!trailerId && (mode === 'edit' || mode === 'view') && open,
    });

    const trailer = trailerData?.data;

    const handleSuccess = (id?: string) => {
        onOpenChange(false);
        queryClient.invalidateQueries({ queryKey: ['trailers'] });
        if (onSuccess) onSuccess(id);
    };

    const getTitle = () => {
        if (mode === 'create') return 'Create New Trailer';
        return `Trailer #${trailer?.trailerNumber || ''}`;
    };

    const getDescription = () => {
        if (mode === 'create') return 'Fill in the details to add a new trailer to your fleet.';
        return 'View and edit trailer specifications and status.';
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl overflow-y-auto">
                <SheetHeader className="mb-4">
                    <SheetTitle>{getTitle()}</SheetTitle>
                    <SheetDescription>{getDescription()}</SheetDescription>
                </SheetHeader>

                {mode === 'create' && (
                    <CreateTrailerForm
                        onSuccess={handleSuccess}
                        onCancel={() => onOpenChange(false)}
                        isSheet={true}
                    />
                )}

                {(mode === 'edit' || mode === 'view') && (
                    <>
                        {isLoadingTrailer ? (
                            <div className="flex h-full items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : trailer ? (
                            <EditTrailerForm
                                trailer={trailer}
                                onSuccess={() => handleSuccess(trailer.id)}
                                onCancel={() => onOpenChange(false)}
                            />
                        ) : (
                            <div className="text-center text-muted-foreground">Trailer not found</div>
                        )}
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}

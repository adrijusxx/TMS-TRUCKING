'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import CreateTrailerForm from './CreateTrailerForm';
import EditTrailerForm from './EditTrailerForm';
import TrailerDetail from './TrailerDetail';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '@/lib/utils';
import { Loader2, Container, Plus } from 'lucide-react';

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

    const getIcon = () => {
        if (mode === 'create') return <Plus className="h-5 w-5 text-primary" />;
        return <Container className="h-5 w-5 text-primary" />;
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
                        <CreateTrailerForm
                            onSuccess={handleSuccess}
                            onCancel={() => onOpenChange(false)}
                            isSheet={true}
                        />
                    )}

                    {(mode === 'edit' || mode === 'view') && (
                        <>
                            {isLoadingTrailer ? (
                                <div className="flex h-32 items-center justify-center">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : trailer ? (
                                <EditTrailerForm
                                    trailer={trailer}
                                    onSuccess={() => handleSuccess(trailer.id)}
                                    onCancel={() => onOpenChange(false)}
                                />
                            ) : (
                                <div className="text-center text-muted-foreground py-8">Trailer not found</div>
                            )}
                        </>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

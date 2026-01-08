'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import SettlementDetail from './SettlementDetail';
import { useQuery } from '@tanstack/react-query';
import { apiUrl } from '@/lib/utils';
import { Loader2, FileText } from 'lucide-react';

interface SettlementSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    settlementId: string | null;
    onSuccess?: () => void;
}

export default function SettlementSheet({ open, onOpenChange, settlementId, onSuccess }: SettlementSheetProps) {

    // We don't need to fetch here if SettlementDetail fetches on its own,
    // but looking at SettlementDetail usage in [id]/page.tsx, it takes settlementId.
    // It's likely SettlementDetail handles the fetching.

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                // Settlements can be wide, so we make it wider
                className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-4xl xl:max-w-5xl overflow-y-auto p-0 border-l border-border/50 bg-background/95 backdrop-blur-sm"
            >
                <SheetHeader className="px-6 py-4 border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur-sm z-20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <SheetTitle>Settlement Details</SheetTitle>
                            <SheetDescription>View and manage settlement information</SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="p-6">
                    {settlementId ? (
                        <SettlementDetail settlementId={settlementId} />
                    ) : (
                        <div className="flex h-32 items-center justify-center text-muted-foreground">
                            No settlement selected
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

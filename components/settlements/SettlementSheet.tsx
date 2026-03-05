'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import SettlementDetail from './SettlementDetail';
import DriverSheet from '@/components/drivers/DriverSheet';
import { FileText } from 'lucide-react';

interface SettlementSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    settlementId: string | null;
    onSuccess?: () => void;
    /** Ordered list of settlement IDs in the batch for prev/next navigation */
    batchSettlementIds?: string[];
    /** Called when user navigates to a different settlement via < > arrows */
    onSettlementChange?: (id: string) => void;
}

export default function SettlementSheet({ open, onOpenChange, settlementId, onSuccess, batchSettlementIds, onSettlementChange }: SettlementSheetProps) {
    const [driverSheetOpen, setDriverSheetOpen] = useState(false);
    const [editingDriverId, setEditingDriverId] = useState<string | null>(null);

    const handleOpenDriver = (driverId: string) => {
        setEditingDriverId(driverId);
        onOpenChange(false);
        setDriverSheetOpen(true);
    };

    const handleDriverSheetClose = (isOpen: boolean) => {
        setDriverSheetOpen(isOpen);
        if (!isOpen) {
            onOpenChange(true);
            setEditingDriverId(null);
        }
    };

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent
                    side="right"
                    className="w-full sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-[80vw] xl:max-w-7xl overflow-y-auto p-0 border-l border-border/50 bg-background/95 backdrop-blur-sm"
                >
                    <SheetHeader className="px-6 py-3 border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur-sm z-20">
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

                    <div className="p-4">
                        {settlementId ? (
                            <SettlementDetail
                                settlementId={settlementId}
                                onOpenDriver={handleOpenDriver}
                                batchSettlementIds={batchSettlementIds}
                                onSettlementChange={onSettlementChange}
                            />
                        ) : (
                            <div className="flex h-32 items-center justify-center text-muted-foreground">
                                No settlement selected
                            </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            <DriverSheet
                open={driverSheetOpen}
                onOpenChange={handleDriverSheetClose}
                mode="edit"
                driverId={editingDriverId}
            />
        </>
    );
}

'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import CreateDriverForm from './CreateDriverForm';
import DriverExpandedEdit from './DriverExpandedEdit';
import { useQueryClient } from '@tanstack/react-query';

type SheetMode = 'create' | 'edit' | 'view';

interface DriverSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: SheetMode;
    driverId?: string | null;
    onSuccess?: (driverId?: string) => void;
}

export default function DriverSheet({ open, onOpenChange, mode, driverId, onSuccess }: DriverSheetProps) {
    const queryClient = useQueryClient();

    const handleSuccess = (id?: string) => {
        onOpenChange(false);
        queryClient.invalidateQueries({ queryKey: ['drivers'] });
        if (onSuccess) onSuccess(id);
    };

    const getTitle = () => {
        if (mode === 'create') return 'Create New Driver';
        return mode === 'edit' ? 'Edit Driver' : 'Driver Details';
    };

    const getDescription = () => {
        if (mode === 'create') return 'Fill in the details to create a new driver account.';
        return 'View or update driver information and compliance details.';
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl overflow-y-auto">
                <SheetHeader className="mb-4">
                    <SheetTitle>{getTitle()}</SheetTitle>
                    <SheetDescription>{getDescription()}</SheetDescription>
                </SheetHeader>

                {mode === 'create' && (
                    <CreateDriverForm
                        onSuccess={handleSuccess}
                        onCancel={() => onOpenChange(false)}
                        isSheet={true}
                    />
                )}

                {(mode === 'edit' || mode === 'view') && driverId && (
                    <DriverExpandedEdit
                        driverId={driverId}
                        onSave={handleSuccess}
                        onCancel={() => onOpenChange(false)}
                    />
                )}
            </SheetContent>
        </Sheet>
    );
}

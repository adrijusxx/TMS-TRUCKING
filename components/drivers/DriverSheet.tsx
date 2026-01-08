'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import CreateDriverForm from './CreateDriverForm';
import DriverExpandedEdit from './DriverExpandedEdit';
import { useQueryClient } from '@tanstack/react-query';
import { User, UserPlus } from 'lucide-react';

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

    const getIcon = () => {
        if (mode === 'create') return <UserPlus className="h-5 w-5 text-primary" />;
        return <User className="h-5 w-5 text-primary" />;
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-[85vw] md:max-w-4xl lg:max-w-5xl xl:max-w-6xl overflow-y-auto p-0 border-l border-border/50 bg-background/95 backdrop-blur-sm"
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
                </div>
            </SheetContent>
        </Sheet>
    );
}

'use client';

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import MaintenanceForm from './MaintenanceForm';
import { Wrench } from 'lucide-react';

interface MaintenanceSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    id?: string;
    initialData?: any;
}

export default function MaintenanceSheet({
    open,
    onOpenChange,
    id,
    initialData,
}: MaintenanceSheetProps) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl flex flex-col p-0 border-none">
                <SheetHeader className="p-6 pb-2">
                    <SheetTitle className="flex items-center gap-2">
                        <Wrench className="h-5 w-5 text-primary" />
                        {id ? 'Edit Maintenance Record' : 'New Maintenance Record'}
                    </SheetTitle>
                    <SheetDescription>
                        {id
                            ? 'Update the details of this service record.'
                            : 'Record a new maintenance service performed on a vehicle.'}
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto">
                    <MaintenanceForm
                        id={id}
                        initialData={initialData}
                        onSuccess={() => onOpenChange(false)}
                        onCancel={() => onOpenChange(false)}
                    />
                </div>
            </SheetContent>
        </Sheet>
    );
}

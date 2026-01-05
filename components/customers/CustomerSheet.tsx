'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import CreateCustomerForm from './CreateCustomerForm';
import EditCustomerForm from './EditCustomerForm';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '@/lib/utils';
import { Loader2, Building2, Plus } from 'lucide-react';

type SheetMode = 'create' | 'edit' | 'view';

interface CustomerSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: SheetMode;
    customerId?: string | null;
    onSuccess?: (customerId?: string) => void;
}

async function fetchCustomer(id: string) {
    const response = await fetch(apiUrl(`/api/customers/${id}`));
    if (!response.ok) throw new Error('Failed to fetch customer');
    return response.json();
}

export default function CustomerSheet({ open, onOpenChange, mode, customerId, onSuccess }: CustomerSheetProps) {
    const queryClient = useQueryClient();

    // Data fetching for Edit mode
    const { data: customerData, isLoading: isLoadingCustomer } = useQuery({
        queryKey: ['customer', customerId],
        queryFn: () => fetchCustomer(customerId as string),
        enabled: !!customerId && mode === 'edit' && open,
    });

    const customer = customerData?.data;

    const handleSuccess = (id?: string) => {
        onOpenChange(false);
        queryClient.invalidateQueries({ queryKey: ['customers'] });
        if (onSuccess) onSuccess(id);
    };

    const getTitle = () => {
        if (mode === 'create') return 'Create New Customer';
        return `Customer: ${customer?.name || ''} `;
    };

    const getDescription = () => {
        if (mode === 'create') return 'Add a new customer to your database.';
        return 'View and manage customer details, billing, and history.';
    };

    const getIcon = () => {
        if (mode === 'create') return <Plus className="h-5 w-5 text-primary" />;
        return <Building2 className="h-5 w-5 text-primary" />;
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
                        <CreateCustomerForm
                            onSuccess={handleSuccess}
                            onCancel={() => onOpenChange(false)}
                            isSheet={true}
                        />
                    )}

                    {(mode === 'edit' || mode === 'view') && (
                        <>
                            {isLoadingCustomer ? (
                                <div className="flex h-32 items-center justify-center">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : customer ? (
                                <EditCustomerForm
                                    customer={customer}
                                    onSuccess={() => handleSuccess(customer.id)}
                                    onCancel={() => onOpenChange(false)}
                                />
                            ) : (
                                <div className="text-center text-muted-foreground py-8">Customer not found</div>
                            )}
                        </>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

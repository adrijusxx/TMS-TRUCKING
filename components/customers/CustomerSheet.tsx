'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import CreateCustomerForm from './CreateCustomerForm';
import EditCustomerForm from './EditCustomerForm';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

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

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl overflow-y-auto">
                <SheetHeader className="mb-4">
                    <SheetTitle>{getTitle()}</SheetTitle>
                    <SheetDescription>{getDescription()}</SheetDescription>
                </SheetHeader>

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
                            <div className="flex h-full items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : customer ? (
                            <EditCustomerForm
                                customer={customer}
                                onSuccess={() => handleSuccess(customer.id)}
                                onCancel={() => onOpenChange(false)}
                            />
                        ) : (
                            <div className="text-center text-muted-foreground">Customer not found</div>
                        )}
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}

'use client';

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import InvoiceDetail from './InvoiceDetail';
import { useQuery } from '@tanstack/react-query';
import { apiUrl } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface InvoiceSheetProps {
    invoiceId: string | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function InvoiceSheet({ invoiceId, isOpen, onClose }: InvoiceSheetProps) {
    const { data: invoiceData, isLoading } = useQuery({
        queryKey: ['invoice', invoiceId],
        queryFn: async () => {
            if (!invoiceId) return null;
            const response = await fetch(apiUrl(`/api/invoices/${invoiceId}`));
            if (!response.ok) throw new Error('Failed to fetch invoice');
            const result = await response.json();
            return result.data;
        },
        enabled: !!invoiceId && isOpen,
    });

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-full sm:max-w-4xl overflow-y-auto">
                <SheetHeader className="pb-4">
                    <SheetTitle>Invoice Details</SheetTitle>
                </SheetHeader>

                {isLoading ? (
                    <div className="flex h-full items-center justify-center min-h-[400px]">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : invoiceData ? (
                    <InvoiceDetail invoice={invoiceData} isSheet />
                ) : invoiceId ? (
                    <div className="flex h-full items-center justify-center min-h-[400px] text-red-500">
                        Failed to load invoice details
                    </div>
                ) : null}
            </SheetContent>
        </Sheet>
    );
}

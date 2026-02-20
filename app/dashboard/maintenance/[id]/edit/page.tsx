'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import MaintenanceForm from '@/components/maintenance/MaintenanceForm';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { apiUrl } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export default function EditMaintenancePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params);

    const { data, isLoading, error } = useQuery({
        queryKey: ['maintenance', id],
        queryFn: async () => {
            const response = await fetch(apiUrl(`/api/maintenance/${id}`));
            if (!response.ok) throw new Error('Failed to fetch maintenance record');
            return response.json();
        },
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !data?.success) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <p className="text-destructive font-semibold">Error</p>
                    <p className="text-muted-foreground">Could not load the maintenance record</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Breadcrumb
                items={[
                    { label: 'Maintenance', href: '/dashboard/maintenance' },
                    { label: `Edit Record ${data.data.maintenanceNumber ? `#${data.data.maintenanceNumber}` : ''}` },
                ]}
            />
            <div className="space-y-6">
                <MaintenanceForm id={id} initialData={data.data} />
            </div>
        </>
    );
}

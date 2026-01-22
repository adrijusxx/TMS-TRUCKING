import { Suspense } from 'react';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import LeadListClient from '@/components/crm/LeadListClient';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
    title: 'Recruitment Pipeline | TMS',
    description: 'Manage driver recruitment leads and pipeline',
};

function LeadListSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-32" />
            </div>
            <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
        </div>
    );
}

export default async function CRMPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Recruitment Pipeline</h1>
                    <p className="text-muted-foreground">
                        Manage driver recruitment leads and track the hiring pipeline
                    </p>
                </div>
            </div>

            <Suspense fallback={<LeadListSkeleton />}>
                <LeadListClient />
            </Suspense>
        </div>
    );
}

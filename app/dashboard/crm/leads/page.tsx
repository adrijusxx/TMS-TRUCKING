import { Suspense } from 'react';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import LeadListClient from '@/components/crm/LeadListClient';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
    title: 'Recruiting Leads | TMS',
    description: 'Manage driver recruiting leads and pipeline',
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

export default async function LeadsPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    return (
        <div className="space-y-4">
            <Suspense fallback={<LeadListSkeleton />}>
                <LeadListClient />
            </Suspense>
        </div>
    );
}

import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LeadListClient from '@/components/crm/LeadListClient';
import { Skeleton } from '@/components/ui/skeleton';
import { APP_NAME } from '@/lib/config/branding';

export const metadata = {
    title: `Recruiting Leads | ${APP_NAME}`,
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

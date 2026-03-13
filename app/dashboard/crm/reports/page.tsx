import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import RecruitingReports from '@/components/crm/reports/RecruitingReports';
import { Skeleton } from '@/components/ui/skeleton';
import { APP_NAME } from '@/lib/config/branding';

export const metadata = {
    title: `Reports | Recruiting | ${APP_NAME}`,
    description: 'Recruiting analytics and performance reports',
};

export default async function ReportsPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    return (
        <div className="space-y-4">
<Suspense fallback={<Skeleton className="h-64 w-full" />}>
                <RecruitingReports />
            </Suspense>
        </div>
    );
}

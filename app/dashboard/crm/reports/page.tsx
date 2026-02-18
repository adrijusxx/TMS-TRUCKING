import { Suspense } from 'react';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import CRMHeaderNav from '@/components/crm/CRMHeaderNav';
import RecruitingReports from '@/components/crm/reports/RecruitingReports';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
    title: 'Reports | Recruiting | TMS',
    description: 'Recruiting analytics and performance reports',
};

export default async function ReportsPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    return (
        <div className="space-y-4">
            <CRMHeaderNav />
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Recruiting Reports</h1>
                <p className="text-muted-foreground">
                    Analytics on source ROI, conversion funnel, time-in-stage, and recruiter performance
                </p>
            </div>

            <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                <RecruitingReports />
            </Suspense>
        </div>
    );
}

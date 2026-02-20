import { Suspense } from 'react';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import RecruitingDashboard from '@/components/crm/dashboard/RecruitingDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { DepartmentDashboard } from '@/components/layout/DepartmentDashboard';

export const metadata = {
  title: 'Recruiting Dashboard | TMS',
  description: 'Driver recruiting dashboard and pipeline overview',
};

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

export default async function CRMPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <>
      <Breadcrumb items={[{ label: 'Recruiting', href: '/dashboard/crm' }]} />
      <DepartmentDashboard
        title="Recruiting Dashboard"
        description="Overview of the driver recruiting pipeline and hiring metrics"
      >
        <Suspense fallback={<DashboardSkeleton />}>
          <RecruitingDashboard />
        </Suspense>
      </DepartmentDashboard>
    </>
  );
}

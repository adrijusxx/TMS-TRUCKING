import { Suspense } from 'react';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { DepartmentDashboard } from '@/components/layout/DepartmentDashboard';
import HRDashboardContent from '@/components/hr/HRDashboardContent';
import { SubscriptionGate } from '@/components/saas/SubscriptionGate';

export default function HRDashboardPage() {
  return (
    <SubscriptionGate module={"HR" as any}>
      <Breadcrumb items={[{ label: 'HR Department', href: '/dashboard/hr' }]} />
      <DepartmentDashboard
        title="Human Resources Dashboard"
        description="Driver performance, settlements, retention, and bonuses"
      >
        <Suspense fallback={null}>
          <HRDashboardContent />
        </Suspense>
      </DepartmentDashboard>
    </SubscriptionGate>
  );
}

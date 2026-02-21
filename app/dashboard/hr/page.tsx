import { Breadcrumb } from '@/components/ui/breadcrumb';
import { DepartmentDashboard } from '@/components/layout/DepartmentDashboard';
import { HRDashboardMetrics } from '@/components/hr/HRDashboardMetrics';
import HRDashboardTabs from '@/components/hr/HRDashboardTabs';

import { SubscriptionGate } from '@/components/saas/SubscriptionGate';

export default function HRDashboardPage() {
  return (
    <SubscriptionGate module={"HR" as any}>
      <Breadcrumb items={[{ label: 'HR Department', href: '/dashboard/hr' }]} />
      <DepartmentDashboard
        title="Human Resources Dashboard"
        description="Driver performance, settlements, retention, and bonuses"
      >
        {/* Key Metrics */}
        <HRDashboardMetrics />

        {/* Tabs for different sections */}
        <HRDashboardTabs />
      </DepartmentDashboard>
    </SubscriptionGate>
  );
}

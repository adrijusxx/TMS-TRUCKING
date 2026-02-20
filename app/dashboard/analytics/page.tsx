
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import AnalyticsNavigationCards from '@/components/analytics/AnalyticsNavigationCards';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { DepartmentDashboard } from '@/components/layout/DepartmentDashboard';
import { SubscriptionGate } from '@/components/saas/SubscriptionGate';

export default function AnalyticsPage() {
  return (
    <SubscriptionGate module="ACCOUNTING">
      <Breadcrumb items={[
        { label: 'Analytics & Reports', href: '/dashboard/analytics' }
      ]} />
      <DepartmentDashboard
        title="Analytics Overview"
        description="Central hub for financial performance, fleet efficiency, and operational insights."
      >
        <AnalyticsNavigationCards />

        <div className="pt-4 border-t">
          <h2 className="text-lg font-semibold mb-4">Performance Dashboard</h2>
          <AnalyticsDashboard />
        </div>
      </DepartmentDashboard>
    </SubscriptionGate>
  );
}


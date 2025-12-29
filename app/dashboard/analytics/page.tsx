
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { SubscriptionGate } from '@/components/saas/SubscriptionGate';

export default function AnalyticsPage() {
  return (
    <SubscriptionGate module="ACCOUNTING">
      <Breadcrumb items={[
        { label: 'Analytics & Reports', href: '/dashboard/analytics' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Reports</h1>
        </div>
        <AnalyticsDashboard />
      </div>
    </SubscriptionGate>
  );
}


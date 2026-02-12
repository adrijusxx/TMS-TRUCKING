
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import AnalyticsNavigationCards from '@/components/analytics/AnalyticsNavigationCards';
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
          <h1 className="text-3xl font-bold tracking-tight">Analytics Overview</h1>
          <p className="text-muted-foreground mt-2">
            Central hub for financial performance, fleet efficiency, and operational insights.
          </p>
        </div>

        <AnalyticsNavigationCards />

        <div className="pt-4 border-t">
          <h2 className="text-lg font-semibold mb-4">Performance Dashboard</h2>
          <AnalyticsDashboard />
        </div>
      </div>
    </SubscriptionGate>
  );
}


import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function AnalyticsPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Analytics & Reports', href: '/dashboard/analytics' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Reports</h1>
        </div>
        <AnalyticsDashboard />
      </div>
    </>
  );
}


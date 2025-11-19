import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function AnalyticsPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Analytics & Reports', href: '/dashboard/analytics' }
      ]} />
      <AnalyticsDashboard />
    </>
  );
}


import DriverPerformanceScorecard from '@/components/analytics/DriverPerformanceScorecard';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function DriverPerformancePage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Analytics & Reports', href: '/dashboard/analytics' },
        { label: 'Driver Performance' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Driver Performance Analytics</h1>
        </div>
        <DriverPerformanceScorecard />
      </div>
    </>
  );
}


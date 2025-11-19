import DriverPerformanceScorecard from '@/components/analytics/DriverPerformanceScorecard';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function DriverPerformancePage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Analytics & Reports', href: '/dashboard/analytics' },
        { label: 'Driver Performance' }
      ]} />
      <DriverPerformanceScorecard />
    </>
  );
}


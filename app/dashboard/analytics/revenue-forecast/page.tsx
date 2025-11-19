import RevenueForecast from '@/components/analytics/RevenueForecast';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function RevenueForecastPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Analytics & Reports', href: '/dashboard/analytics' },
        { label: 'Revenue Forecast' }
      ]} />
      <RevenueForecast />
    </>
  );
}


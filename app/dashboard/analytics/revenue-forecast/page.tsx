import RevenueForecast from '@/components/analytics/RevenueForecast';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function RevenueForecastPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Analytics & Reports', href: '/dashboard/analytics' },
        { label: 'Revenue Forecast' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Revenue Forecast</h1>
        </div>
        <RevenueForecast />
      </div>
    </>
  );
}


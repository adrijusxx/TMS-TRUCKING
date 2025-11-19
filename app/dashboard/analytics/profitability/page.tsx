import ProfitabilityAnalysis from '@/components/analytics/ProfitabilityAnalysis';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function ProfitabilityPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Analytics & Reports', href: '/dashboard/analytics' },
        { label: 'Profitability Analysis' }
      ]} />
      <ProfitabilityAnalysis />
    </>
  );
}


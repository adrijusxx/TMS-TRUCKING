import ProfitabilityAnalysis from '@/components/analytics/ProfitabilityAnalysis';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function ProfitabilityPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Analytics & Reports', href: '/dashboard/analytics' },
        { label: 'Profitability Analysis' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Profitability Analysis</h1>
        </div>
        <ProfitabilityAnalysis />
      </div>
    </>
  );
}


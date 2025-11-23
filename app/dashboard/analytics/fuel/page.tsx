import FuelCostAnalysis from '@/components/analytics/FuelCostAnalysis';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function FuelAnalysisPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Analytics & Reports', href: '/dashboard/analytics' },
        { label: 'Fuel Analysis' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Fuel Cost Analysis</h1>
        </div>
        <FuelCostAnalysis />
      </div>
    </>
  );
}


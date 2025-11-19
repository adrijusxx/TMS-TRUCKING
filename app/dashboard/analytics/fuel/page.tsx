import FuelCostAnalysis from '@/components/analytics/FuelCostAnalysis';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function FuelAnalysisPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Analytics & Reports', href: '/dashboard/analytics' },
        { label: 'Fuel Analysis' }
      ]} />
      <FuelCostAnalysis />
    </>
  );
}


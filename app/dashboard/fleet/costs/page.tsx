import BreakdownCostTracking from '@/components/fleet/BreakdownCostTracking';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function BreakdownCostsPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Fleet Department', href: '/dashboard/fleet' },
          { label: 'Cost Tracking' },
        ]}
      />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Fleet Cost Tracking</h1>
        </div>
        <BreakdownCostTracking />
      </div>
    </>
  );
}


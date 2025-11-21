import BreakdownCostTracking from '@/components/fleet/BreakdownCostTracking';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function BreakdownCostsPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Fleet Department', href: '/dashboard/fleet/breakdowns' },
          { label: 'Cost Tracking', href: '/dashboard/fleet/costs' },
        ]}
      />
      <BreakdownCostTracking />
    </>
  );
}


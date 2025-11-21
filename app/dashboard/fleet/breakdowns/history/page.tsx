import BreakdownHistory from '@/components/fleet/BreakdownHistory';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function BreakdownHistoryPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Fleet Department', href: '/dashboard/fleet/breakdowns' },
          { label: 'Breakdown History', href: '/dashboard/fleet/breakdowns/history' },
        ]}
      />
      <BreakdownHistory />
    </>
  );
}


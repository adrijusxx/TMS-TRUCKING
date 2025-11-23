import BreakdownHistory from '@/components/fleet/BreakdownHistory';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function BreakdownHistoryPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Fleet Department', href: '/dashboard/fleet' },
          { label: 'Breakdowns', href: '/dashboard/fleet/breakdowns' },
          { label: 'History' },
        ]}
      />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Breakdown History</h1>
        </div>
        <BreakdownHistory />
      </div>
    </>
  );
}


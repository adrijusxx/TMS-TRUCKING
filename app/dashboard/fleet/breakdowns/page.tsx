import ActiveBreakdownsDashboard from '@/components/fleet/ActiveBreakdownsDashboard';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function FleetBreakdownsPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Fleet Department', href: '/dashboard/fleet/breakdowns' },
        ]}
      />
      <ActiveBreakdownsDashboard />
    </>
  );
}


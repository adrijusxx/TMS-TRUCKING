import FleetReports from '@/components/fleet/FleetReports';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function FleetReportsPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Fleet Department', href: '/dashboard/fleet/breakdowns' },
          { label: 'Reports & Analytics', href: '/dashboard/fleet/reports' },
        ]}
      />
      <FleetReports />
    </>
  );
}


import FleetInspections from '@/components/fleet/FleetInspections';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function FleetInspectionsPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Fleet Department', href: '/dashboard/fleet/breakdowns' },
          { label: 'Inspections', href: '/dashboard/fleet/inspections' },
        ]}
      />
      <FleetInspections />
    </>
  );
}


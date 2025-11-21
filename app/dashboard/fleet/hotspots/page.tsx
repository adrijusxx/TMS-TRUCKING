import BreakdownHotspots from '@/components/fleet/BreakdownHotspots';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function BreakdownHotspotsPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Fleet Department', href: '/dashboard/fleet/breakdowns' },
          { label: 'Breakdown Hotspots', href: '/dashboard/fleet/hotspots' },
        ]}
      />
      <BreakdownHotspots />
    </>
  );
}


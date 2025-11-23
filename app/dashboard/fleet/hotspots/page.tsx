import BreakdownHotspots from '@/components/fleet/BreakdownHotspots';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function BreakdownHotspotsPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Fleet Department', href: '/dashboard/fleet' },
          { label: 'Breakdown Hotspots' },
        ]}
      />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Breakdown Hotspots</h1>
        </div>
        <BreakdownHotspots />
      </div>
    </>
  );
}


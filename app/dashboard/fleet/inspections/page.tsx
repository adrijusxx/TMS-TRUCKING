import FleetInspections from '@/components/fleet/FleetInspections';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function FleetInspectionsPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Fleet Department', href: '/dashboard/fleet' },
          { label: 'Inspections' },
        ]}
      />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Fleet Inspections</h1>
        </div>
        <FleetInspections />
      </div>
    </>
  );
}


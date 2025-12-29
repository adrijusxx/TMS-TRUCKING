import FleetReports from '@/components/fleet/FleetReports';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function FleetReportsPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Fleet Department', href: '/dashboard/fleet' },
          { label: 'Reports & Analytics' },
        ]}
      />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Fleet Reports & Analytics</h1>
        </div>
        <FleetReports />
      </div>
    </>
  );
}


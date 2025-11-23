import FleetBoard from '@/components/fleet/FleetBoard';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function FleetDashboardPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Fleet Department', href: '/dashboard/fleet' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Fleet Department</h1>
        </div>
        <FleetBoard />
      </div>
    </>
  );
}


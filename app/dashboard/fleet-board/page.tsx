import { Breadcrumb } from '@/components/ui/breadcrumb';
import FleetBoard from '@/components/fleet/FleetBoard';

export default function FleetBoardPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Fleet Board', href: '/dashboard/fleet-board' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Fleet Board</h1>
        </div>
        <FleetBoard />
      </div>
    </>
  );
}

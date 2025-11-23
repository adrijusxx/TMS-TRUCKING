import OnCallSchedule from '@/components/fleet/OnCallSchedule';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function OnCallSchedulePage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Fleet Department', href: '/dashboard/fleet' },
          { label: 'On-Call Schedule' },
        ]}
      />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">On-Call Schedule</h1>
        </div>
        <OnCallSchedule />
      </div>
    </>
  );
}


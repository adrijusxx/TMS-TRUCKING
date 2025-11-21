import OnCallSchedule from '@/components/fleet/OnCallSchedule';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function OnCallSchedulePage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Fleet Department', href: '/dashboard/fleet/breakdowns' },
          { label: 'On-Call Schedule', href: '/dashboard/fleet/on-call' },
        ]}
      />
      <OnCallSchedule />
    </>
  );
}


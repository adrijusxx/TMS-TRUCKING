import PreventiveMaintenance from '@/components/fleet/PreventiveMaintenance';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function PreventiveMaintenancePage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Fleet Department', href: '/dashboard/fleet/breakdowns' },
          { label: 'Preventive Maintenance', href: '/dashboard/fleet/maintenance' },
        ]}
      />
      <PreventiveMaintenance />
    </>
  );
}


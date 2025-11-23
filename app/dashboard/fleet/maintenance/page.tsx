import PreventiveMaintenance from '@/components/fleet/PreventiveMaintenance';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function PreventiveMaintenancePage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Fleet Department', href: '/dashboard/fleet' },
          { label: 'Preventive Maintenance' },
        ]}
      />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Preventive Maintenance</h1>
        </div>
        <PreventiveMaintenance />
      </div>
    </>
  );
}


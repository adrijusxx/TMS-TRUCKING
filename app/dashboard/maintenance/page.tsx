import { Breadcrumb } from '@/components/ui/breadcrumb';
import MaintenanceList from '@/components/maintenance/MaintenanceList';

export default function MaintenancePage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Maintenance', href: '/dashboard/maintenance' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Maintenance</h1>
        </div>
        <MaintenanceList />
      </div>
    </>
  );
}

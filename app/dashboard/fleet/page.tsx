import FleetDepartmentDashboard from '@/components/fleet/FleetDepartmentDashboard';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function FleetDashboardPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Fleet Department', href: '/dashboard/fleet' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fleet Department Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage active breakdown cases, track communications, and monitor fleet performance
          </p>
        </div>
        <FleetDepartmentDashboard />
      </div>
    </>
  );
}


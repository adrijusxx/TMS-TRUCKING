import FleetDashboard from '@/components/fleet/FleetDashboard';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function FleetDashboardPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Fleet Department', href: '/dashboard/fleet' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Fleet Department Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive overview of your fleet operations, maintenance, and performance metrics
          </p>
        </div>
        <FleetDashboard />
      </div>
    </>
  );
}


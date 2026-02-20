import FleetUtilizationDashboard from '@/components/analytics/FleetUtilizationDashboard';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function FleetUtilizationPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Analytics & Reports', href: '/dashboard/analytics' },
        { label: 'Fleet Utilization' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Fleet Utilization</h1>
          <p className="text-muted-foreground mt-2">
            Track equipment and driver utilization rates, dormant assets, and idle time trends.
          </p>
        </div>
        <FleetUtilizationDashboard />
      </div>
    </>
  );
}

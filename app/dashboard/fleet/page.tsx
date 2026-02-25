import FleetDepartmentDashboard from '@/components/fleet/FleetDepartmentDashboard';
import { PageTransition } from '@/components/ui/page-transition';
import { SubscriptionGate } from '@/components/saas/SubscriptionGate';

export default async function FleetDashboardPage() {
  return (
    <SubscriptionGate module="FLEET">
      <PageTransition>
        <FleetDepartmentDashboard />
      </PageTransition>
    </SubscriptionGate>
  );
}


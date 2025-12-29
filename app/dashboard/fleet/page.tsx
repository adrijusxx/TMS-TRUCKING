import FleetDepartmentDashboard from '@/components/fleet/FleetDepartmentDashboard';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Metadata } from 'next';
import { SubscriptionGate } from '@/components/saas/SubscriptionGate';

interface FleetDashboardPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function FleetDashboardPage({ searchParams }: FleetDashboardPageProps) {
  const { tab: tabParam } = await searchParams;
  const tab = tabParam || 'overview';

  const tabTitles: Record<string, string> = {
    overview: 'Fleet Department Dashboard',
    breakdowns: 'All Breakdowns',
    analytics: 'Fleet Analytics',
    team: 'Team & Assignments',
  };

  const tabDescriptions: Record<string, string> = {
    overview: 'Manage active breakdown cases, track communications, and monitor fleet performance',
    breakdowns: 'View and manage all breakdown cases with advanced filtering and search',
    analytics: 'Analyze breakdown trends, costs, and hotspots to improve fleet performance',
    team: 'Manage on-call schedule and team assignments for breakdown response',
  };


  return (
    <SubscriptionGate module="FLEET">
      <Breadcrumb items={[{ label: 'Fleet Department', href: '/dashboard/fleet' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{tabTitles[tab] || tabTitles.overview}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {tabDescriptions[tab] || tabDescriptions.overview}
          </p>
        </div>
        <FleetDepartmentDashboard />
      </div>
    </SubscriptionGate>
  );
}


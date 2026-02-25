import { Suspense } from 'react';
import { PageTransition } from '@/components/ui/page-transition';
import FleetMonitoringTab from '@/components/fleet/monitoring/FleetMonitoringTab';
import { Card, CardContent } from '@/components/ui/card';

function MonitoringFallback() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="h-16 animate-pulse bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-8">
          <div className="h-64 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function HRMonitoringPage() {
  return (
    <PageTransition>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">HR Monitoring</h1>
          <p className="text-muted-foreground">
            Track idle drivers, dormant equipment, and home time across your fleet.
          </p>
        </div>
        <Suspense fallback={<MonitoringFallback />}>
          <FleetMonitoringTab />
        </Suspense>
      </div>
    </PageTransition>
  );
}

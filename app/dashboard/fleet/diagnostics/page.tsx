import { Metadata } from 'next';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { DiagnosticsDashboard } from '@/components/fleet/diagnostics/DiagnosticsDashboard';

export const metadata: Metadata = {
  title: 'Fleet Diagnostics | Fleet Management',
  description: 'Monitor and analyze vehicle fault codes and diagnostics',
};

export default function FleetDiagnosticsPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Fleet', href: '/dashboard/fleet' },
          { label: 'Diagnostics' },
        ]}
      />
      <DiagnosticsDashboard />
    </>
  );
}


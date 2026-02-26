import { Metadata } from 'next';
import { DiagnosticsDashboard } from '@/components/fleet/diagnostics/DiagnosticsDashboard';

export const metadata: Metadata = {
  title: 'Fleet Diagnostics | Fleet Management',
  description: 'Monitor and analyze vehicle fault codes and diagnostics',
};

export default function FleetDiagnosticsPage() {
  return (
    <DiagnosticsDashboard />
  );
}


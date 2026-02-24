'use client';

import { useSearchParams } from 'next/navigation';
import { HRDashboardMetrics } from '@/components/hr/HRDashboardMetrics';
import { DriverPerformanceMetrics } from '@/components/hr/DriverPerformanceMetrics';
import { SettlementSummary } from '@/components/hr/SettlementSummary';
import { DriverRetention } from '@/components/hr/DriverRetention';
import { BonusCalculations } from '@/components/hr/BonusCalculations';
import FleetMonitoringTab from '@/components/fleet/monitoring/FleetMonitoringTab';

export default function HRDashboardContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');

  // Default view (no tab param) shows overview with metrics
  if (!tab) {
    return (
      <div className="space-y-6">
        <HRDashboardMetrics />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tab === 'performance' && <DriverPerformanceMetrics />}
      {tab === 'settlements' && <SettlementSummary />}
      {tab === 'retention' && <DriverRetention />}
      {tab === 'bonuses' && <BonusCalculations />}
      {tab === 'monitoring' && <FleetMonitoringTab />}
    </div>
  );
}

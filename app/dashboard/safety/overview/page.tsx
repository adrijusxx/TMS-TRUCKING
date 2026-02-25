import { DepartmentDashboard } from '@/components/layout/DepartmentDashboard';
import SafetyOverviewTab from '@/components/safety/overview/SafetyOverviewTab';

export default function SafetyOverviewPage() {
  return (
    <DepartmentDashboard
      title="Safety Department"
      description="Safety overview — KPIs, compliance rates, and department metrics"
    >
      <SafetyOverviewTab />
    </DepartmentDashboard>
  );
}

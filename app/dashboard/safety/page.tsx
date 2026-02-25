import { DepartmentDashboard } from '@/components/layout/DepartmentDashboard';
import SafetyTasksTab from '@/components/safety/tasks/SafetyTasksTab';

export default function SafetyPageRoute() {
  return (
    <DepartmentDashboard
      title="Safety Department"
      description="Safety tasks, inspections, claims, and compliance"
    >
      <SafetyTasksTab />
    </DepartmentDashboard>
  );
}

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { DepartmentDashboard } from '@/components/layout/DepartmentDashboard';
import SafetyDepartmentDashboard from '@/components/safety/SafetyDepartmentDashboard';

export default function SafetyPageRoute() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Safety Department', href: '/dashboard/safety' }]} />
      <DepartmentDashboard
        title="Safety Department"
        description="Safety tasks, inspections, claims, and compliance"
      >
        <SafetyDepartmentDashboard />
      </DepartmentDashboard>
    </>
  );
}

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { DepartmentDashboard } from '@/components/layout/DepartmentDashboard';
import SafetyDashboard from '@/components/safety/dashboard/SafetyDashboard';

export default function SafetyPageRoute() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Safety Department', href: '/dashboard/safety' }]} />
      <DepartmentDashboard
        title="Safety Department"
        description="Compliance tracking, fleet safety, incidents, and training"
      >
        <SafetyDashboard />
      </DepartmentDashboard>
    </>
  );
}

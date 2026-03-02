import { DepartmentDashboard } from '@/components/layout/DepartmentDashboard';
import AccidentsTab from '@/components/safety/accidents/AccidentsTab';

export default function SafetyPageRoute() {
  return (
    <DepartmentDashboard
      title="Safety Department"
      description="Accidents, claims, inspections, and compliance"
    >
      <AccidentsTab />
    </DepartmentDashboard>
  );
}

import { DepartmentDashboard } from '@/components/layout/DepartmentDashboard';
import InspectionsTab from '@/components/safety/inspections/InspectionsTab';

export default function SafetyInspectionsPage() {
  return (
    <DepartmentDashboard
      title="Safety Department"
      description="Safety inspections — DOT, roadside, and compliance records"
    >
      <InspectionsTab />
    </DepartmentDashboard>
  );
}

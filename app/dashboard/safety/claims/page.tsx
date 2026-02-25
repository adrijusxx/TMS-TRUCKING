import { DepartmentDashboard } from '@/components/layout/DepartmentDashboard';
import ClaimsTab from '@/components/safety/claims/ClaimsTab';

export default function SafetyClaimsPage() {
  return (
    <DepartmentDashboard
      title="Safety Department"
      description="Insurance claims and incident tracking"
    >
      <ClaimsTab />
    </DepartmentDashboard>
  );
}

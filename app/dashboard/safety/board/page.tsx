import { DepartmentDashboard } from '@/components/layout/DepartmentDashboard';
import SafetyBoardTab from '@/components/safety/board/SafetyBoardTab';

export default function SafetyBoardPage() {
  return (
    <DepartmentDashboard
      title="Safety Department"
      description="Safety board — visual overview of safety tasks and status"
    >
      <SafetyBoardTab />
    </DepartmentDashboard>
  );
}

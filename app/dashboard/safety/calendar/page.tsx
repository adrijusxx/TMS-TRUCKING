import { DepartmentDashboard } from '@/components/layout/DepartmentDashboard';
import SafetyCalendarTab from '@/components/safety/calendar/SafetyCalendarTab';

export default function SafetyCalendarPage() {
  return (
    <DepartmentDashboard
      title="Safety Department"
      description="Safety calendar — deadlines, renewals, and compliance dates"
    >
      <SafetyCalendarTab />
    </DepartmentDashboard>
  );
}

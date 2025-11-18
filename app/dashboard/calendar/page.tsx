import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadCalendar from '@/components/calendar/LoadCalendar';

export default function CalendarPage() {
  return (
    <DashboardLayout>
      <LoadCalendar />
    </DashboardLayout>
  );
}

import { Breadcrumb } from '@/components/ui/breadcrumb';
import LoadCalendar from '@/components/calendar/LoadCalendar';

export default function CalendarPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Calendar', href: '/dashboard/calendar' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
        </div>
        <LoadCalendar />
      </div>
    </>
  );
}

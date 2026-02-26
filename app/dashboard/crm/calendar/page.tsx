import { auth } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import FollowUpCalendar from '@/components/crm/FollowUpCalendar';

export const metadata = {
    title: 'Follow-Up Calendar | Recruiting | TMS',
    description: 'Calendar view of scheduled lead follow-ups',
};

export default async function CalendarPage() {
    const session = await auth();
    if (!session?.user) redirect('/login');

    return (
        <div className="space-y-4">
            <FollowUpCalendar />
        </div>
    );
}

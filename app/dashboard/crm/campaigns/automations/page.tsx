import { auth } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import AutomationRuleList from '@/components/crm/campaigns/AutomationRuleList';

export const metadata = {
    title: 'Automations | CRM',
    description: 'Automated SMS and Email rules for lead events',
};

export default async function AutomationsPage() {
    const session = await auth();
    if (!session?.user) redirect('/login');

    return (
        <AutomationRuleList />
    );
}

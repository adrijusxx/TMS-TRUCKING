import { auth } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import CampaignList from '@/components/crm/campaigns/CampaignList';

export const metadata = {
    title: 'Campaigns | CRM',
    description: 'SMS and Email campaign management',
};

export default async function CampaignsPage() {
    const session = await auth();
    if (!session?.user) redirect('/login');

    return (
        <CampaignList />
    );
}

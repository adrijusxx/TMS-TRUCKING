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
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
                <p className="text-muted-foreground">
                    Create and manage SMS &amp; email campaigns for your leads
                </p>
            </div>
            <CampaignList />
        </div>
    );
}

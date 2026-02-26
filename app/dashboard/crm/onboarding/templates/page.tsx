import { auth } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import OnboardingTemplateEditor from '@/components/crm/onboarding/OnboardingTemplateEditor';

export const metadata = {
    title: 'Onboarding Templates | TMS',
    description: 'Customize onboarding steps for new hires',
};

export default async function OnboardingTemplatesPage() {
    const session = await auth();
    if (!session?.user) redirect('/login');

    return (
        <OnboardingTemplateEditor />
    );
}

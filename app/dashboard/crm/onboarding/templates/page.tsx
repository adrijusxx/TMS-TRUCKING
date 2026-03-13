import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import OnboardingTemplateEditor from '@/components/crm/onboarding/OnboardingTemplateEditor';
import { APP_NAME } from '@/lib/config/branding';

export const metadata = {
    title: `Onboarding Templates | ${APP_NAME}`,
    description: 'Customize onboarding steps for new hires',
};

export default async function OnboardingTemplatesPage() {
    const session = await auth();
    if (!session?.user) redirect('/login');

    return (
        <OnboardingTemplateEditor />
    );
}

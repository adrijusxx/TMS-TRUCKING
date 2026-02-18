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
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Onboarding Templates</h1>
                <p className="text-muted-foreground">
                    Create and manage custom onboarding checklists for different driver types.
                </p>
            </div>
            <OnboardingTemplateEditor />
        </div>
    );
}

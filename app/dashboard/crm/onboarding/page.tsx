import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import OnboardingList from '@/components/crm/onboarding/OnboardingList';
import { Skeleton } from '@/components/ui/skeleton';
import { APP_NAME } from '@/lib/config/branding';

export const metadata = {
    title: `Onboarding | Recruiting | ${APP_NAME}`,
    description: 'Track new driver onboarding progress',
};

export default async function OnboardingPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    return (
        <div className="space-y-4">
<Suspense fallback={<Skeleton className="h-64 w-full" />}>
                <OnboardingList />
            </Suspense>
        </div>
    );
}

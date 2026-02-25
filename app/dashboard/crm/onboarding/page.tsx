import { Suspense } from 'react';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import OnboardingList from '@/components/crm/onboarding/OnboardingList';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
    title: 'Onboarding | Recruiting | TMS',
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

import { Suspense } from 'react';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import CRMHeaderNav from '@/components/crm/CRMHeaderNav';
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
            <CRMHeaderNav />
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Onboarding</h1>
                <p className="text-muted-foreground">
                    Track new driver onboarding checklists and step completion
                </p>
            </div>

            <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                <OnboardingList />
            </Suspense>
        </div>
    );
}

import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import CrmSettingsList from '@/components/crm/CrmSettingsList';
import ApplicationUrlConfig from '@/components/crm/ApplicationUrlConfig';
import CrmSettingsTabs from '@/components/crm/settings/CrmSettingsTabs';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
    title: 'Recruiting Settings | TMS',
    description: 'Configure recruiting integrations and settings',
};

async function IntegrationSettings() {
    const session = await auth();
    if (!session?.user) return null;

    const mcIds = session.user.role === 'SUPER_ADMIN'
        ? undefined
        : session.user.mcAccess;

    const whereClause = session.user.role === 'SUPER_ADMIN'
        ? {}
        : { id: { in: mcIds } };

    const mcNumbers = await prisma.mcNumber.findMany({
        where: {
            ...whereClause,
            companyId: session.user.companyId,
        },
        include: { crmIntegrations: true },
        orderBy: { number: 'asc' },
    });

    const company = await prisma.company.findUnique({
        where: { id: session.user.companyId },
        select: { slug: true },
    });

    return (
        <>
            <ApplicationUrlConfig currentSlug={company?.slug || null} />
            <CrmSettingsList mcNumbers={mcNumbers} />
        </>
    );
}

export default async function SettingsPage() {
    const session = await auth();
    if (!session?.user) {
        redirect('/login');
    }

    return (
        <div className="space-y-4">
            <Suspense fallback={
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full max-w-xl" />
                    <Skeleton className="h-48 w-full" />
                </div>
            }>
                <CrmSettingsTabs
                    integrationSlot={
                        <Suspense fallback={<Skeleton className="h-48 w-full" />}>
                            <IntegrationSettings />
                        </Suspense>
                    }
                />
            </Suspense>
        </div>
    );
}

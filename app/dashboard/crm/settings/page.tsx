import { Suspense } from 'react';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import CrmSettingsList from '@/components/crm/CrmSettingsList';
import ApplicationUrlConfig from '@/components/crm/ApplicationUrlConfig';
import SLAConfigEditor from '@/components/crm/settings/SLAConfigEditor';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
    title: 'Recruiting Settings | TMS',
    description: 'Configure recruiting integrations and settings',
};

async function SettingsData() {
    const session = await auth();
    if (!session?.user) return null;

    // Fetch MC numbers user has access to
    // If admin, all. If not, only assigned.
    const mcIds = session.user.role === 'SUPER_ADMIN'
        ? undefined // undefined means all for now, or we fetch all IDs
        : session.user.mcAccess;

    // Since we want to display settings per MC, let's fetch MCs with their integrations
    const whereClause = session.user.role === 'SUPER_ADMIN'
        ? {}
        : { id: { in: mcIds } };

    const mcNumbers = await prisma.mcNumber.findMany({
        where: {
            ...whereClause,
            // companyId filter for ADMIN role in strict multi-tenant
            companyId: session.user.companyId
        },
        include: {
            crmIntegrations: true
        },
        orderBy: {
            number: 'asc'
        }
    });

    const company = await prisma.company.findUnique({
        where: { id: session.user.companyId },
        select: { slug: true },
    });

    return (
        <>
            <ApplicationUrlConfig currentSlug={company?.slug || null} />
            <SLAConfigEditor />
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
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Recruiting Settings</h1>
                <p className="text-muted-foreground">
                    Manage integrations and lead sources per MC Number
                </p>
            </div>

            <Suspense fallback={<div className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>}>
                <SettingsData />
            </Suspense>
        </div>
    );
}

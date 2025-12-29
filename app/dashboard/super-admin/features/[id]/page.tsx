import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import FeatureManageClient from './FeatureManageClient';

export default async function FeatureManagePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const session = await auth();

    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
        notFound();
    }

    const company = await prisma.company.findUnique({
        where: { id },
        include: {
            subscription: {
                include: {
                    addOns: true,
                },
            },
        },
    });

    if (!company) {
        notFound();
    }

    return (
        <div className="p-6">
            <FeatureManageClient
                company={JSON.parse(JSON.stringify(company))}
                subscription={JSON.parse(JSON.stringify(company.subscription))}
            />
        </div>
    );
}

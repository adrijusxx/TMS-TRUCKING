import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import CompanyDetailClient from './CompanyDetailClient';

export default async function CompanyDetailPage({
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
            mcNumbers: true,
            users: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                },
            },
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

    // Ensure subscription exists (create if missing for some reason)
    let subscription = company.subscription;
    if (!subscription) {
        subscription = await prisma.subscription.create({
            data: {
                companyId: company.id,
                planId: 'free',
                status: 'FREE',
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 10)),
            },
            include: {
                addOns: true,
            },
        });
    }

    return (
        <div className="p-6">
            <CompanyDetailClient
                company={JSON.parse(JSON.stringify(company))}
                subscription={JSON.parse(JSON.stringify(subscription))}
            />
        </div>
    );
}

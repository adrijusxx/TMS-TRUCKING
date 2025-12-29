import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import UserDetailClient from './UserDetailClient';

export default async function UserDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const session = await auth();

    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
        notFound();
    }

    const [user, companies] = await Promise.all([
        prisma.user.findUnique({
            where: { id },
            include: {
                company: {
                    include: {
                        mcNumbers: true,
                    }
                },
            },
        }),
        prisma.company.findMany({
            where: { deletedAt: null },
            select: { id: true, name: true, dotNumber: true },
            orderBy: { name: 'asc' },
        })
    ]);

    if (!user) {
        notFound();
    }

    return (
        <div className="p-6">
            <UserDetailClient
                user={JSON.parse(JSON.stringify(user))}
                companies={JSON.parse(JSON.stringify(companies))}
            />
        </div>
    );
}

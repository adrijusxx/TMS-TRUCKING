import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import NewUserClient from './NewUserClient';

export default async function NewUserPage() {
    const session = await auth();

    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
        notFound();
    }

    const companies = await prisma.company.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true, dotNumber: true },
        orderBy: { name: 'asc' },
    });

    return (
        <div className="p-6">
            <NewUserClient companies={JSON.parse(JSON.stringify(companies))} />
        </div>
    );
}

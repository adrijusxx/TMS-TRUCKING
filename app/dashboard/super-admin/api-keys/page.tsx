import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ApiKeyManagementClient from './ApiKeyManagementClient';

export default async function ApiKeyManagementPage() {
    const session = await auth();

    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
        return (<div>Unauthorized</div>);
    }

    const [companies, mcNumbers] = await Promise.all([
        prisma.company.findMany({
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
        }),
        prisma.mcNumber.findMany({
            select: { id: true, number: true, companyName: true },
            orderBy: { number: 'asc' },
        })
    ]);

    return (
        <div className="p-6">
            <ApiKeyManagementClient
                companies={JSON.parse(JSON.stringify(companies))}
                mcNumbers={JSON.parse(JSON.stringify(mcNumbers))}
            />
        </div>
    );
}

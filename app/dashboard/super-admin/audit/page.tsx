import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AuditLogClient from './AuditLogClient';

export default async function AuditLogPage() {
    const session = await auth();

    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
        return (<div>Unauthorized</div>);
    }

    // Fetch initial audit logs
    const [logs, totalCount] = await Promise.all([
        prisma.auditLog.findMany({
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        }),
        prisma.auditLog.count()
    ]);

    return (
        <div className="p-6">
            <AuditLogClient
                initialLogs={JSON.parse(JSON.stringify(logs))}
                totalCount={totalCount}
            />
        </div>
    );
}

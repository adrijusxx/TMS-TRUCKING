import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { IntegrationCredentialsManager } from '@/components/settings/IntegrationCredentialsManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { hasPermission } from '@/lib/permissions';

export default async function IntegrationsPage() {
    const session = await auth();

    if (!session?.user?.companyId) {
        redirect('/login');
    }

    if (!hasPermission(session.user.role as any, 'settings.view')) {
        redirect('/dashboard');
    }

    // Fetch MC numbers for the company
    const mcNumbers = await prisma.mcNumber.findMany({
        where: {
            companyId: session.user.companyId,
            deletedAt: null,
        },
        select: {
            id: true,
            number: true,
            companyName: true,
        },
        orderBy: { isDefault: 'desc' },
    });

    // Map companyName to name for the component
    const mcNumbersForComponent = mcNumbers.map(mc => ({
        id: mc.id,
        number: mc.number,
        name: mc.companyName,
    }));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
                <p className="text-muted-foreground text-sm">
                    Connect your TMS with external services and manage API credentials
                </p>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">API Credentials</CardTitle>
                    <CardDescription>
                        Configure API keys for each integration. Samsara supports per-MC credentials,
                        while Telegram and QuickBooks are company-wide.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <IntegrationCredentialsManager mcNumbers={mcNumbersForComponent} />
                </CardContent>
            </Card>
        </div>
    );
}


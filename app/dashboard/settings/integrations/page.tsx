import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { IntegrationCredentialsManager } from '@/components/settings/IntegrationCredentialsManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { hasPermission } from '@/lib/permissions';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

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

    // Check if Google Sheets is configured via env var
    const isGoogleSheetsConfigured = !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

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

            {/* Google Sheets Integration Card */}
            <Link href="/dashboard/settings/integrations/google-sheets">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <img
                                    src="https://www.gstatic.com/images/branding/product/1x/sheets_48dp.png"
                                    alt="Google Sheets"
                                    className="h-8 w-8"
                                />
                                <div>
                                    <CardTitle className="text-base">Google Sheets</CardTitle>
                                    <CardDescription className="text-xs">
                                        Import CRM leads and data from Google Sheets
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${isGoogleSheetsConfigured
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                    }`}>
                                    {isGoogleSheetsConfigured ? 'Configured' : 'Not configured'}
                                </span>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </div>
                    </CardHeader>
                </Card>
            </Link>

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

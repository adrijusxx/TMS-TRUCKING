import { Suspense } from 'react';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import GoogleSheetsSettings from '@/components/settings/integrations/GoogleSheetsSettings';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
    title: 'Google Sheets Integration | TMS',
    description: 'Configure Google Sheets integration settings',
};

export default async function GoogleSheetsIntegrationPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    // Only admins can access integration settings
    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
        redirect('/dashboard');
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/settings/integrations"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Integrations
                </Link>
            </div>

            <div>
                <h1 className="text-2xl font-bold tracking-tight">Google Sheets Integration</h1>
                <p className="text-muted-foreground">
                    Configure your Google service account to import data from Google Sheets
                </p>
            </div>

            <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <GoogleSheetsSettings />
            </Suspense>
        </div>
    );
}

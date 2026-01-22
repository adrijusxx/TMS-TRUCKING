import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getGoogleServiceAccountEmail } from '@/lib/integrations/google/sheets';

/**
 * GET /api/settings/integrations/google-sheets
 * Returns the service account email for users to share their sheets with
 */
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const serviceAccountEmail = getGoogleServiceAccountEmail();

        return NextResponse.json({
            serviceAccountEmail,
            isConfigured: !!serviceAccountEmail,
        });
    } catch (error: any) {
        console.error('[Google Sheets Settings] GET error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch settings' },
            { status: 500 }
        );
    }
}

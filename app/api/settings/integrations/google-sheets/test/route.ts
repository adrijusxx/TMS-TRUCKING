import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { createGoogleSheetsClient } from '@/lib/integrations/google/sheets';

/**
 * POST /api/settings/integrations/google-sheets/test
 * Test connection to a Google Sheet using system credentials
 */
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { sheetId } = body;

        if (!sheetId) {
            return NextResponse.json(
                { error: 'Sheet ID or URL is required' },
                { status: 400 }
            );
        }

        // Create client with system credentials
        const client = await createGoogleSheetsClient();

        // Test connection
        const result = await client.testConnection(sheetId);

        if (result.success) {
            return NextResponse.json({
                success: true,
                rowCount: result.rowCount,
                message: `Successfully connected! Found ${result.rowCount} rows (excluding header).`,
            });
        } else {
            return NextResponse.json({
                success: false,
                error: result.error,
            });
        }
    } catch (error: any) {
        console.error('[Google Sheets Test] Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Connection test failed'
            },
            { status: 500 }
        );
    }
}

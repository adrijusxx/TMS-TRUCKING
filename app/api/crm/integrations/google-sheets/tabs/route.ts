import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { createGoogleSheetsClient } from '@/lib/integrations/google/sheets';

// GET /api/crm/integrations/google-sheets/tabs?sheetId=...
// Returns list of sheet tab names for a given spreadsheet
export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sheetId = request.nextUrl.searchParams.get('sheetId');
    if (!sheetId?.trim()) {
        return NextResponse.json({ error: 'sheetId is required' }, { status: 400 });
    }

    try {
        const client = await createGoogleSheetsClient();
        const tabs = await client.getSheetTabs(sheetId.trim());
        return NextResponse.json({ tabs });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to fetch sheet tabs' },
            { status: 500 }
        );
    }
}

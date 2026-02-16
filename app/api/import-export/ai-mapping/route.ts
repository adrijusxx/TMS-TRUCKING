import { auth } from '@/lib/auth';
import { ImportHelperService } from '@/lib/services/ImportHelperService';
import { NextRequest, NextResponse } from 'next/server';

const importHelper = new ImportHelperService();

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { headers, entityType } = body;

        if (!headers || !Array.isArray(headers) || headers.length === 0) {
            return NextResponse.json({ error: 'Invalid headers' }, { status: 400 });
        }

        if (!entityType) {
            return NextResponse.json({ error: 'Missing entityType' }, { status: 400 });
        }

        const mapping = await importHelper.suggestColumnMapping(headers, entityType);

        return NextResponse.json({ mapping });
    } catch (error: any) {
        console.error('AI Mapping Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to generate mapping' }, { status: 500 });
    }
}

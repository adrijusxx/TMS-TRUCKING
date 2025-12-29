import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ApiKeyService } from '@/lib/services/ApiKeyService';

/**
 * GET /api/super-admin/api-keys
 * List all API key configurations
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const keys = await ApiKeyService.listAll();

        console.log('[API Key GET] ApiKeyService returned:', {
            type: typeof keys,
            isArray: Array.isArray(keys),
            count: Array.isArray(keys) ? keys.length : 'N/A',
            raw: keys
        });

        // Ensure we always return an array to the frontend
        if (!Array.isArray(keys)) {
            console.error('[API Key GET] ApiKeyService.listAll() did not return an array:', keys);
            return NextResponse.json([]);
        }

        // Deep serialization to avoid any odd internal Proxy objects or circular refs
        const serialized = JSON.parse(JSON.stringify(keys));
        return NextResponse.json(serialized);
    } catch (error) {
        console.error('Error fetching API keys:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/super-admin/api-keys
 * Create or update an API key configuration
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const result = await ApiKeyService.setCredential(body);

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: 'UPDATE_API_KEY',
                entityType: 'ApiKeyConfig',
                entityId: result.id,
                metadata: {
                    provider: body.provider,
                    scope: body.scope,
                    configKey: body.configKey,
                    companyId: body.companyId,
                    mcNumberId: body.mcNumberId
                },
            },
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error saving API key:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

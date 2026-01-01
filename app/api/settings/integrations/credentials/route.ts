import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiCredentialSchema } from '@/lib/validations/integrations';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';
import { ApiKeyService } from '@/lib/services/ApiKeyService';
import { ApiKeyScope } from '@prisma/client';

/**
 * API Credentials Management
 * GET/POST/DELETE /api/settings/integrations/credentials
 * 
 * Manages API credentials for integrations with support for:
 * - GLOBAL scope (TMS-provider keys)
 * - COMPANY scope (shared across MCs)
 * - MC scope (per Motor Carrier)
 */

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) {
            return NextResponse.json(
                { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
                { status: 401 }
            );
        }

        if (!hasPermission(session.user.role as any, 'settings.view')) {
            return NextResponse.json(
                { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
                { status: 403 }
            );
        }

        const companyId = session.user.companyId;
        const { searchParams } = new URL(request.url);
        const provider = searchParams.get('provider');
        const mcNumberId = searchParams.get('mcNumberId');

        // Build where clause
        const where: any = {
            OR: [
                { companyId, scope: 'COMPANY' },
                { companyId, scope: 'MC' },
            ],
            isActive: true,
        };

        if (provider) {
            where.provider = provider;
        }
        if (mcNumberId) {
            where.mcNumberId = mcNumberId;
        }

        const credentials = await prisma.apiKeyConfig.findMany({
            where,
            include: {
                mcNumber: { select: { id: true, number: true, companyName: true } },
            },
            orderBy: [
                { provider: 'asc' },
                { scope: 'asc' },
                { configKey: 'asc' },
            ],
        });

        // Mask sensitive values
        const masked = credentials.map(cred => ({
            ...cred,
            configValue: cred.configValue ? '•'.repeat(Math.min(20, cred.configValue.length)) : '',
        }));

        return NextResponse.json({ success: true, data: masked });
    } catch (error) {
        console.error('Error fetching credentials:', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch credentials' } },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) {
            return NextResponse.json(
                { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
                { status: 401 }
            );
        }

        if (!hasPermission(session.user.role as any, 'settings.edit')) {
            return NextResponse.json(
                { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { provider, configKey, configValue, scope, mcNumberId, description } = apiCredentialSchema.parse(body);
        const companyId = session.user.companyId;

        // Validate MC belongs to company if MC scope
        if (scope === 'MC' && mcNumberId) {
            const mc = await prisma.mcNumber.findFirst({
                where: { id: mcNumberId, companyId },
            });
            if (!mc) {
                return NextResponse.json(
                    { success: false, error: { code: 'INVALID_MC', message: 'Motor Carrier not found' } },
                    { status: 400 }
                );
            }
        }

        // Use ApiKeyService to upsert
        const credential = await ApiKeyService.setCredential({
            provider,
            configKey,
            configValue,
            scope: scope as ApiKeyScope,
            companyId: scope !== 'GLOBAL' ? companyId : undefined,
            mcNumberId: scope === 'MC' ? mcNumberId : undefined,
            description,
        });

        return NextResponse.json({
            success: true,
            data: {
                ...credential,
                configValue: '•'.repeat(20), // Mask in response
            },
            message: `${provider} credential saved successfully`,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.issues } },
                { status: 400 }
            );
        }
        console.error('Error saving credential:', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to save credential' } },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) {
            return NextResponse.json(
                { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
                { status: 401 }
            );
        }

        if (!hasPermission(session.user.role as any, 'settings.edit')) {
            return NextResponse.json(
                { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, error: { code: 'MISSING_ID', message: 'Credential ID required' } },
                { status: 400 }
            );
        }

        // Verify credential belongs to company
        const credential = await prisma.apiKeyConfig.findFirst({
            where: {
                id,
                companyId: session.user.companyId,
            },
        });

        if (!credential) {
            return NextResponse.json(
                { success: false, error: { code: 'NOT_FOUND', message: 'Credential not found' } },
                { status: 404 }
            );
        }

        // Soft delete by setting isActive to false
        await prisma.apiKeyConfig.update({
            where: { id },
            data: { isActive: false },
        });

        return NextResponse.json({
            success: true,
            message: 'Credential removed successfully',
        });
    } catch (error) {
        console.error('Error deleting credential:', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete credential' } },
            { status: 500 }
        );
    }
}

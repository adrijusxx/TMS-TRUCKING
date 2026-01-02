/**
 * Load Location Tracking Cron
 * 
 * Polls Samsara every 30 minutes to update load status based on truck proximity
 * to pickup/delivery locations.
 * 
 * Schedule: 0,30 * * * * (every 30 minutes)
 */

import { NextRequest, NextResponse } from 'next/server';
import { processAllCompanies } from '@/lib/services/LoadLocationTrackingService';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for processing

/**
 * Verify cron secret if configured
 */
function verifyCronSecret(request: NextRequest): boolean {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) return true; // No secret configured = allow

    const authHeader = request.headers.get('authorization');
    if (!authHeader) return false;

    const token = authHeader.replace('Bearer ', '');
    return token === cronSecret;
}

export async function GET(request: NextRequest) {
    // Verify authorization
    if (!verifyCronSecret(request)) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    try {
        console.log('[CRON] Starting load location tracking...');
        const startTime = Date.now();

        const result = await processAllCompanies();

        const duration = Date.now() - startTime;
        console.log(`[CRON] Load location tracking completed in ${duration}ms:`, result);

        return NextResponse.json({
            success: true,
            message: 'Load location tracking completed',
            data: {
                companies: result.companies,
                loadsProcessed: result.totalProcessed,
                loadsUpdated: result.totalUpdated,
                errors: result.errors.length > 0 ? result.errors : undefined,
                durationMs: duration,
            },
        });
    } catch (error) {
        console.error('[CRON] Load location tracking failed:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

// Also support POST for webhook triggers
export async function POST(request: NextRequest) {
    return GET(request);
}

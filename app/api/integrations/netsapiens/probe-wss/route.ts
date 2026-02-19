import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const WebSocket = require('ws') as typeof import('ws').default;

interface ProbeResult {
    url: string;
    status: 'ok' | 'failed';
    error?: string;
    latencyMs?: number;
}

/**
 * POST /api/integrations/netsapiens/probe-wss
 * Probes multiple WSS URLs to find the working WebSocket endpoint.
 */
export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.companyId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasPermission(session.user.role as any, 'settings.view')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { server } = await request.json();
    if (!server) {
        return NextResponse.json({ error: 'Server hostname required' }, { status: 400 });
    }

    const candidates = [
        `wss://${server}/ws`,
        `wss://${server}:8089/ws`,
        `wss://${server}:443/ws`,
        `wss://${server}:5066/ws`,
        `wss://${server}:8089`,
        `wss://${server}:5066`,
        `wss://${server}:8088/ws`,
        `wss://${server}:7443/ws`,
    ];

    const probeOne = (url: string): Promise<ProbeResult> => {
        return new Promise((resolve) => {
            let resolved = false;
            const start = Date.now();
            const timer = setTimeout(() => {
                if (resolved) return;
                resolved = true;
                try { ws.close(); } catch { /* ignore */ }
                resolve({ url, status: 'failed', error: 'Timeout (5s)' });
            }, 5000);

            const ws = new WebSocket(url, ['sip'], { rejectUnauthorized: false });

            ws.on('open', () => {
                if (resolved) return;
                resolved = true;
                clearTimeout(timer);
                const latencyMs = Date.now() - start;
                ws.close();
                resolve({ url, status: 'ok', latencyMs });
            });

            ws.on('error', (err: Error) => {
                if (resolved) return;
                resolved = true;
                clearTimeout(timer);
                resolve({ url, status: 'failed', error: err.message });
            });

            ws.on('close', (code: number) => {
                if (resolved) return;
                resolved = true;
                clearTimeout(timer);
                resolve({ url, status: 'failed', error: `Closed (code: ${code})` });
            });
        });
    };

    // Probe all candidates in parallel
    const probeResults = await Promise.all(candidates.map(probeOne));

    return NextResponse.json({
        server,
        results: probeResults,
        recommended: probeResults.find((r) => r.status === 'ok')?.url || null,
    });
}

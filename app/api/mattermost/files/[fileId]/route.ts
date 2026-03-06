import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getMattermostQueryService } from '@/lib/services/MattermostQueryService';

/**
 * GET /api/mattermost/files/[fileId]
 * Download a file from Mattermost
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ fileId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { fileId } = await params;

        const queryService = getMattermostQueryService();
        const buffer = await queryService.downloadFile(fileId);

        return new NextResponse(buffer as any, {
            headers: {
                'Content-Type': 'application/octet-stream',
                'Cache-Control': 'public, max-age=31536000',
            },
        });
    } catch (error: any) {
        console.error('[API] Error downloading file:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to download file' },
            { status: 500 }
        );
    }
}

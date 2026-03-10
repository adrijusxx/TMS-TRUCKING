import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTelegramService } from '@/lib/services/TelegramService';
import { resolveTelegramScope } from '@/lib/services/telegram/TelegramScopeResolver';

/**
 * POST /api/telegram/upload
 * Upload and send a file/photo to a chat
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const chatId = formData.get('chatId') as string;
        const caption = formData.get('caption') as string | null;

        if (!file || !chatId) {
            return NextResponse.json(
                { error: 'File and chatId are required' },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const user = session.user as any;
        const scope = await resolveTelegramScope(user.companyId, user.mcNumberId);
        const telegramService = getTelegramService(scope);
        const message = await telegramService.sendPhoto(chatId, buffer, caption || undefined);

        return NextResponse.json({
            success: true,
            data: {
                id: message.id,
                date: new Date(),
                out: true,
                media: { type: 'photo' },
            }
        });
    } catch (error: any) {
        console.error('[API] Error uploading file:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to upload file' },
            { status: 500 }
        );
    }
}

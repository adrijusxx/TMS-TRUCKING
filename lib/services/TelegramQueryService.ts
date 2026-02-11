/**
 * TelegramQueryService
 * 
 * Handles read-only operations for Telegram:
 * - Fetching dialogs (conversations)
 * - Fetching message history
 * - Downloading media
 * - Retrieving user profiles
 * - Auto-linking drivers by phone number
 */

import { prisma } from '@/lib/prisma';
import { TelegramClient } from 'telegram';
import { Api } from 'telegram/tl';

export interface MediaInfo {
    type: string;
    messageId: number;
    chatId: string;
    isPhoto?: boolean;
    photoId?: string;
    isDocument?: boolean;
    fileName?: string;
    mimeType?: string;
    size?: number;
    isVoice?: boolean;
    duration?: number;
}

export class TelegramQueryService {
    /**
     * Get all dialogs (conversations) with auto-linking logic
     */
    async getDialogs(client: TelegramClient, limit: number = 50): Promise<any[]> {
        try {
            const dialogs = await client.getDialogs({ limit });
            const telegramIds = dialogs.map((d: any) => d.id?.toString()).filter(Boolean);

            // Batch fetch driver mappings
            const mappings = await prisma.telegramDriverMapping.findMany({
                where: { telegramId: { in: telegramIds } },
                select: { telegramId: true, aiAutoReply: true }
            });

            const aiSettingsMap = new Map();
            mappings.forEach(m => aiSettingsMap.set(m.telegramId, m.aiAutoReply));

            // Attempt to link unmapped dialogs by phone
            await this.autoLinkDrivers(dialogs, aiSettingsMap);

            return dialogs.map((dialog: any) => {
                const id = dialog.id?.toString() || '';
                return {
                    id,
                    title: dialog.title || dialog.name || 'Unknown',
                    unreadCount: dialog.unreadCount || 0,
                    lastMessage: dialog.message?.message || '',
                    lastMessageDate: dialog.message?.date ? new Date(dialog.message.date * 1000) : null,
                    isUser: dialog.isUser || false,
                    isGroup: dialog.isGroup || false,
                    isChannel: dialog.isChannel || false,
                    aiAutoReply: aiSettingsMap.get(id) || false,
                    phone: dialog.entity?.phone || null,
                };
            });
        } catch (error) {
            console.error('[TelegramQueryService] Failed to get dialogs:', error);
            throw error;
        }
    }

    /**
     * Internal helper for auto-linking drivers
     */
    private async autoLinkDrivers(dialogs: any[], aiSettingsMap: Map<string, boolean>) {
        const unmappedWithPhone = dialogs.filter((d: any) => {
            const id = d.id?.toString();
            return id && !aiSettingsMap.has(id) && d.entity?.phone;
        });

        if (unmappedWithPhone.length === 0) return;

        try {
            const drivers = await prisma.driver.findMany({
                where: { isActive: true, user: { phone: { not: null } } },
                select: { id: true, user: { select: { phone: true } } }
            });

            const normalize = (p: string) => p.replace(/\D/g, '');
            const driverPhoneMap = new Map<string, string>();
            drivers.forEach(d => {
                if (d.user?.phone) {
                    const norm = normalize(d.user.phone);
                    if (norm.length > 5) driverPhoneMap.set(norm, d.id);
                }
            });

            for (const d of unmappedWithPhone) {
                const rawTelegramPhone = (d.entity as any)?.phone;
                if (!rawTelegramPhone) continue;

                const telegramPhone = normalize(rawTelegramPhone);
                const matchedDriverId = driverPhoneMap.get(telegramPhone);

                if (matchedDriverId) {
                    const telegramId = d.id?.toString() || '';
                    if (!telegramId) continue;
                    await prisma.telegramDriverMapping.create({
                        data: { telegramId, driverId: matchedDriverId }
                    }).catch(() => { }); // Handle race conditions

                    aiSettingsMap.set(telegramId, false);
                    console.log(`[TelegramQueryService] Auto-linked chat ${d.title} to Driver ${matchedDriverId}`);
                }
            }
        } catch (linkError) {
            console.error('[TelegramQueryService] Auto-linking failed:', linkError);
        }
    }

    /**
     * Get messages from a chat
     */
    async getMessages(client: TelegramClient, chatId: string | number, limit: number = 50): Promise<any[]> {
        try {
            const messages = await client.getMessages(chatId, { limit });

            return messages.map((msg: any) => {
                let mediaInfo: MediaInfo | null = null;

                if (msg.media) {
                    const mediaType = msg.media.className;
                    mediaInfo = {
                        type: mediaType,
                        messageId: msg.id,
                        chatId: chatId.toString(),
                    };

                    if (mediaType === 'MessageMediaPhoto') {
                        mediaInfo.isPhoto = true;
                        mediaInfo.photoId = msg.media.photo?.id?.toString();
                    } else if (mediaType === 'MessageMediaDocument') {
                        const doc = msg.media.document;
                        mediaInfo.isDocument = true;
                        mediaInfo.fileName = doc?.attributes?.find((attr: any) => attr.className === 'DocumentAttributeFilename')?.fileName || 'file';
                        mediaInfo.mimeType = doc?.mimeType;
                        mediaInfo.size = doc?.size;

                        const isVoice = doc?.attributes?.some((attr: any) => attr.className === 'DocumentAttributeAudio' && attr.voice);
                        if (isVoice) {
                            mediaInfo.isVoice = true;
                            const audioAttr = doc.attributes.find((attr: any) => attr.className === 'DocumentAttributeAudio');
                            mediaInfo.duration = audioAttr?.duration;
                        }
                    }
                }

                return {
                    id: msg.id,
                    text: msg.message || '',
                    date: msg.date ? new Date(msg.date * 1000) : null,
                    out: msg.out || false,
                    senderId: msg.senderId?.toString() || '',
                    replyToMsgId: msg.replyTo?.replyToMsgId || null,
                    media: mediaInfo,
                };
            });
        } catch (error) {
            console.error('[TelegramQueryService] Failed to get messages:', error);
            throw error;
        }
    }

    /**
     * Download media from a message
     */
    async downloadMedia(client: TelegramClient, chatId: string | number, messageId: number): Promise<Buffer> {
        try {
            const messages = await client.getMessages(chatId, { ids: [messageId] });
            const message = messages[0];

            if (!message || !message.media) {
                throw new Error('Message not found or has no media');
            }

            const buffer = await client.downloadMedia(message);
            if (!buffer) throw new Error('Failed to download media');

            return Buffer.from(buffer);
        } catch (error) {
            console.error('[TelegramQueryService] Failed to download media:', error);
            throw error;
        }
    }

    /**
     * Get user profile information
     */
    async getUserProfile(client: TelegramClient, userId: string | number): Promise<any> {
        try {
            const user = await client.getEntity(userId);
            return {
                id: user.id?.toString(),
                firstName: (user as any).firstName || '',
                lastName: (user as any).lastName || '',
                username: (user as any).username || null,
                phone: (user as any).phone || null,
                bio: (user as any).about || null,
                isBot: (user as any).bot || false,
            };
        } catch (error) {
            console.error('[TelegramQueryService] Failed to get user profile:', error);
            throw error;
        }
    }
}

// Singleton helper
let instance: TelegramQueryService | null = null;
export function getTelegramQueryService(): TelegramQueryService {
    if (!instance) {
        instance = new TelegramQueryService();
    }
    return instance;
}

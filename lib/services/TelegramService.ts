import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { NewMessage, NewMessageEvent } from 'telegram/events';
import { Api } from 'telegram/tl';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// Media info interface
interface MediaInfo {
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

/**
 * Telegram Client API Service
 * Manages connection to Telegram using Client API (MTProto)
 * Handles session persistence, message listening, and sending
 */
export class TelegramService {
    private client: TelegramClient | null = null;
    private session: StringSession;
    private isConnected: boolean = false;
    private isConnecting: boolean = false;
    private messageHandlers: Array<(event: NewMessageEvent) => Promise<void>> = [];
    private pendingAuth: {
        phoneNumber?: string;
        phoneCodeHash?: string;
    } = {};

    constructor() {
        this.session = new StringSession('');
    }

    /**
     * Auto-connect if we have a saved session
     * Called automatically before any operation that requires connection
     */
    async autoConnect(): Promise<boolean> {
        // Already connected
        if (this.isConnected && this.client) {
            return true;
        }

        // Already connecting, wait
        if (this.isConnecting) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return this.isConnected;
        }

        // Check if we have a saved session
        const sessionData = await this.loadSession();
        if (!sessionData) {
            console.log('[Telegram] No saved session found');
            return false;
        }

        // Try to connect with saved session
        try {
            this.isConnecting = true;
            await this.connectWithSession();
            console.log('[Telegram] Auto-reconnected successfully');
            return true;
        } catch (error) {
            console.log('[Telegram] Auto-reconnect failed:', error);
            return false;
        } finally {
            this.isConnecting = false;
        }
    }

    /**
     * Initialize client (without connecting)
     * @param companyId Optional company ID for lookup
     */
    private async initializeClient(companyId?: string): Promise<void> {
        const { ApiKeyService } = await import('@/lib/services/ApiKeyService');

        // Fetch from hierarchy (Global/Company)
        const [apiIdStr, apiHash] = await Promise.all([
            ApiKeyService.getCredential('TELEGRAM', 'API_ID', { companyId }),
            ApiKeyService.getCredential('TELEGRAM', 'API_HASH', { companyId })
        ]);

        const apiId = apiIdStr ? parseInt(apiIdStr) : parseInt(process.env.TELEGRAM_API_ID || '0');
        const finalApiHash = apiHash || process.env.TELEGRAM_API_HASH || '';

        if (!apiId || !finalApiHash) {
            throw new Error('Telegram API credentials not configured (check ApiKeyConfig or environment variables)');
        }

        // Load existing session from database
        const sessionData = await this.loadSession();
        this.session = new StringSession(sessionData || '');

        // Create client with minimal settings for maximum compatibility
        this.client = new TelegramClient(this.session, apiId, finalApiHash, {
            connectionRetries: 3,
        });
    }

    /**
     * Connect with existing session
     */
    async connectWithSession(): Promise<void> {
        try {
            await this.initializeClient();

            if (!this.client) {
                throw new Error('Failed to initialize client');
            }

            console.log('[Telegram] Connecting with existing session...');

            await this.client.connect();

            // Check if we're authorized
            const authorized = await this.client.checkAuthorization();

            if (!authorized) {
                await this.client.disconnect();
                throw new Error('Session expired or invalid');
            }

            this.isConnected = true;
            console.log('[Telegram] Connected successfully with existing session!');

            // Set up message listener
            this.setupMessageListener();

            // Update connection status in database
            await this.updateConnectionStatus(true);
        } catch (error) {
            console.error('[Telegram] Failed to connect with session:', error);
            await this.updateConnectionStatus(false, error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }

    /**
     * Start authentication with phone number
     */
    async startAuth(phoneNumber: string): Promise<{ needsVerification: boolean; phoneCodeHash?: string }> {
        try {
            // Clear any old pending auth first
            await prisma.telegramSession.deleteMany({
                where: { id: 'pending-auth' },
            }).catch(() => { }); // Ignore if doesn't exist

            await this.initializeClient();

            if (!this.client) {
                throw new Error('Failed to initialize client');
            }

            console.log('[Telegram] Starting authentication for:', phoneNumber);

            await this.client.connect();

            // Send code request
            const result = await this.client.invoke(
                new Api.auth.SendCode({
                    phoneNumber: phoneNumber,
                    apiId: parseInt(process.env.TELEGRAM_API_ID || '0'),
                    apiHash: process.env.TELEGRAM_API_HASH || '',
                    settings: new Api.CodeSettings({}),
                })
            );

            // Type guard for phoneCodeHash
            const phoneCodeHash = 'phoneCodeHash' in result ? result.phoneCodeHash : undefined;
            if (!phoneCodeHash) {
                throw new Error('Failed to get phone code hash from Telegram');
            }

            // Store pending auth in database instead of memory
            await prisma.telegramSession.create({
                data: {
                    id: 'pending-auth',
                    sessionData: JSON.stringify({ phoneNumber, phoneCodeHash, timestamp: Date.now() }),
                    isActive: false,
                },
            });

            console.log('[Telegram] Verification code sent');

            return {
                needsVerification: true,
                phoneCodeHash,
            };
        } catch (error: any) {
            console.error('[Telegram] Failed to start auth:', error);
            if (this.client) {
                await this.client.disconnect();
            }
            throw error;
        }
    }

    /**
     * Verify authentication code
     */
    async verifyCode(code: string, phoneNumber: string): Promise<void> {
        try {
            // Retrieve pending auth from database
            const pendingAuthRecord = await prisma.telegramSession.findUnique({
                where: { id: 'pending-auth' },
            });

            if (!pendingAuthRecord || !pendingAuthRecord.sessionData) {
                throw new Error('No pending authentication found. Please start authentication first.');
            }

            const pendingAuth = JSON.parse(pendingAuthRecord.sessionData);

            if (!pendingAuth.phoneCodeHash) {
                throw new Error('Invalid authentication state');
            }

            // Re-initialize client if needed
            if (!this.client) {
                await this.initializeClient();
            }

            if (!this.client) {
                throw new Error('Failed to initialize client');
            }

            // Ensure client is connected
            if (!this.client.connected) {
                await this.client.connect();
            }

            console.log('[Telegram] Verifying code...');

            // Sign in with code
            const result = await this.client.invoke(
                new Api.auth.SignIn({
                    phoneNumber: phoneNumber,
                    phoneCodeHash: pendingAuth.phoneCodeHash,
                    phoneCode: code,
                })
            );

            console.log('[Telegram] Authentication successful!');

            this.isConnected = true;

            // Save session to database
            await this.saveSession();

            // Set up message listener
            this.setupMessageListener();

            // Update connection status in database
            await this.updateConnectionStatus(true);

            // Clean up pending auth
            await prisma.telegramSession.delete({
                where: { id: 'pending-auth' },
            }).catch(() => { }); // Ignore if already deleted

        } catch (error: any) {
            console.error('[Telegram] Failed to verify code:', error);

            // Check if 2FA password is required
            if (error.errorMessage === 'SESSION_PASSWORD_NEEDED') {
                throw new Error('Two-factor authentication is enabled. Please disable it temporarily or contact support.');
            }

            throw error;
        }
    }

    /**
     * Set up message listener for incoming messages
     */
    private setupMessageListener(): void {
        if (!this.client) return;

        this.client.addEventHandler(async (event: NewMessageEvent) => {
            try {
                // Process message through all registered handlers
                for (const handler of this.messageHandlers) {
                    await handler(event);
                }
            } catch (error) {
                console.error('[Telegram] Error processing message:', error);
            }
        }, new NewMessage({}));

        console.log('[Telegram] Message listener active');
    }

    /**
     * Register a message handler
     */
    onMessage(handler: (event: NewMessageEvent) => Promise<void>): void {
        this.messageHandlers.push(handler);
    }

    /**
     * Initialize AI processing for incoming messages
     */
    async initializeAIProcessing(companyId: string): Promise<void> {
        // Check if AI processing is enabled
        const settings = await prisma.telegramSettings.findUnique({
            where: { companyId },
        });

        if (!settings || !settings.aiAutoResponse) {
            console.log('[Telegram] AI processing disabled in settings');
            return;
        }

        // Dynamically import to avoid circular dependencies
        const { TelegramMessageProcessor } = await import('./TelegramMessageProcessor');
        const processor = new TelegramMessageProcessor(companyId);

        // Register the processor as a message handler
        this.onMessage(async (event) => {
            await processor.processMessage(event);
        });

        console.log('[Telegram] AI message processing initialized');
    }

    /**
     * Get all dialogs (conversations)
     */
    async getDialogs(limit: number = 50): Promise<any[]> {
        if (!this.client || !this.isConnected) {
            throw new Error('Telegram client not connected');
        }

        try {
            const dialogs = await this.client.getDialogs({ limit });

            return dialogs.map((dialog: any) => ({
                id: dialog.id?.toString() || '',
                title: dialog.title || dialog.name || 'Unknown',
                unreadCount: dialog.unreadCount || 0,
                lastMessage: dialog.message?.message || '',
                lastMessageDate: dialog.message?.date ? new Date(dialog.message.date * 1000) : null,
                isUser: dialog.isUser || false,
                isGroup: dialog.isGroup || false,
                isChannel: dialog.isChannel || false,
            }));
        } catch (error) {
            console.error('[Telegram] Failed to get dialogs:', error);
            throw error;
        }
    }

    /**
     * Get messages from a chat
     */
    async getMessages(chatId: string | number, limit: number = 50): Promise<any[]> {
        if (!this.client || !this.isConnected) {
            throw new Error('Telegram client not connected');
        }

        try {
            const messages = await this.client.getMessages(chatId, { limit });

            return messages.map((msg: any) => {
                let mediaInfo: MediaInfo | null = null;

                if (msg.media) {
                    const mediaType = msg.media.className;
                    mediaInfo = {
                        type: mediaType,
                        messageId: msg.id,
                        chatId: chatId.toString(),
                    };

                    // Add specific media details
                    if (mediaType === 'MessageMediaPhoto') {
                        mediaInfo.isPhoto = true;
                        mediaInfo.photoId = msg.media.photo?.id?.toString();
                    } else if (mediaType === 'MessageMediaDocument') {
                        const doc = msg.media.document;
                        mediaInfo.isDocument = true;
                        mediaInfo.fileName = doc?.attributes?.find((attr: any) => attr.className === 'DocumentAttributeFilename')?.fileName || 'file';
                        mediaInfo.mimeType = doc?.mimeType;
                        mediaInfo.size = doc?.size;

                        // Check if it's a voice message
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
            console.error('[Telegram] Failed to get messages:', error);
            throw error;
        }
    }

    /**
     * Download media from a message
     */
    async downloadMedia(chatId: string | number, messageId: number): Promise<Buffer> {
        if (!this.client || !this.isConnected) {
            throw new Error('Telegram client not connected');
        }

        try {
            const messages = await this.client.getMessages(chatId, { ids: [messageId] });
            const message = messages[0];

            if (!message || !message.media) {
                throw new Error('Message not found or has no media');
            }

            console.log('[Telegram] Downloading media for message', messageId);
            const buffer = await this.client.downloadMedia(message);

            if (!buffer) {
                throw new Error('Failed to download media');
            }

            return Buffer.from(buffer);
        } catch (error) {
            console.error('[Telegram] Failed to download media:', error);
            throw error;
        }
    }

    /**
     * Get user profile information
     */
    async getUserProfile(userId: string | number): Promise<any> {
        if (!this.client || !this.isConnected) {
            throw new Error('Telegram client not connected');
        }

        try {
            const user = await this.client.getEntity(userId);

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
            console.error('[Telegram] Failed to get user profile:', error);
            throw error;
        }
    }



    /**
     * Send a message to a chat
     */
    async sendMessage(
        chatId: string | number,
        text: string,
        options?: {
            replyTo?: number;
            parseMode?: 'html' | 'markdown';
        }
    ): Promise<Api.Message> {
        if (!this.client || !this.isConnected) {
            throw new Error('Telegram client not connected');
        }

        try {
            const message = await this.client.sendMessage(chatId, {
                message: text,
                parseMode: options?.parseMode,
                replyTo: options?.replyTo,
            });

            return message;
        } catch (error) {
            console.error('[Telegram] Failed to send message:', error);
            throw error;
        }
    }

    /**
     * Send a photo to a chat
     */
    async sendPhoto(
        chatId: string | number,
        photo: Buffer | string,
        caption?: string
    ): Promise<Api.Message> {
        if (!this.client || !this.isConnected) {
            throw new Error('Telegram client not connected');
        }

        try {
            const message = await this.client.sendFile(chatId, {
                file: photo,
                caption: caption,
            });

            return message;
        } catch (error) {
            console.error('[Telegram] Failed to send photo:', error);
            throw error;
        }
    }

    /**
     * Get user info by Telegram ID
     */
    async getUserInfo(userId: number): Promise<Api.User | null> {
        if (!this.client || !this.isConnected) {
            throw new Error('Telegram client not connected');
        }

        try {
            const user = await this.client.getEntity(userId);
            if (user instanceof Api.User) {
                return user;
            }
            return null;
        } catch (error) {
            console.error('[Telegram] Failed to get user info:', error);
            return null;
        }
    }

    /**
     * Load session from database
     */
    private async loadSession(): Promise<string | null> {
        try {
            const session = await prisma.telegramSession.findFirst({
                where: { isActive: true },
                orderBy: { createdAt: 'desc' },
            });

            if (session?.sessionData) {
                // Decrypt session data
                return this.decryptSession(session.sessionData);
            }

            return null;
        } catch (error) {
            console.error('[Telegram] Failed to load session:', error);
            return null;
        }
    }

    /**
     * Save session to database
     */
    private async saveSession(): Promise<void> {
        if (!this.client) return;

        try {
            const sessionString = this.session.save();
            const encryptedSession = this.encryptSession(sessionString);

            // Deactivate old sessions
            await prisma.telegramSession.updateMany({
                where: { isActive: true },
                data: { isActive: false },
            });

            // Create new session record
            await prisma.telegramSession.create({
                data: {
                    sessionData: encryptedSession,
                    isActive: true,
                    lastConnected: new Date(),
                },
            });

            console.log('[Telegram] Session saved to database');
        } catch (error) {
            console.error('[Telegram] Failed to save session:', error);
        }
    }

    /**
     * Encrypt session data using modern crypto API
     */
    private encryptSession(sessionData: string): string {
        const key = process.env.TELEGRAM_SESSION_ENCRYPTION_KEY || 'default_32_char_encryption_key!';
        // Create a 32-byte key from the provided key
        const keyBuffer = crypto.createHash('sha256').update(key).digest();
        // Create a random IV
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);
        let encrypted = cipher.update(sessionData, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        // Return IV + encrypted data
        return iv.toString('hex') + ':' + encrypted;
    }

    /**
     * Decrypt session data using modern crypto API
     */
    private decryptSession(encryptedData: string): string {
        const key = process.env.TELEGRAM_SESSION_ENCRYPTION_KEY || 'default_32_char_encryption_key!';
        // Create a 32-byte key from the provided key
        const keyBuffer = crypto.createHash('sha256').update(key).digest();
        // Split IV and encrypted data
        const parts = encryptedData.split(':');
        if (parts.length !== 2) {
            throw new Error('Invalid encrypted data format');
        }
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    /**
     * Update connection status in database
     */
    private async updateConnectionStatus(isConnected: boolean, error?: string): Promise<void> {
        try {
            await prisma.telegramSession.updateMany({
                where: { isActive: true },
                data: {
                    lastConnected: isConnected ? new Date() : undefined,
                    connectionError: error || null,
                },
            });
        } catch (err) {
            console.error('[Telegram] Failed to update connection status:', err);
        }
    }

    /**
     * Disconnect from Telegram
     */
    async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.disconnect();
            this.isConnected = false;

            // Deactivate session in database
            await prisma.telegramSession.updateMany({
                where: { isActive: true },
                data: { isActive: false },
            });

            await this.updateConnectionStatus(false);
            console.log('[Telegram] Disconnected');
        }
    }

    /**
     * Check if connected
     */
    isClientConnected(): boolean {
        return this.isConnected;
    }

    /**
     * Get connection status
     */
    async getConnectionStatus(): Promise<{
        isConnected: boolean;
        lastConnected: Date | null;
        error: string | null;
    }> {
        const session = await prisma.telegramSession.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
        });

        return {
            isConnected: this.isConnected,
            lastConnected: session?.lastConnected || null,
            error: session?.connectionError || null,
        };
    }
}

// Use globalThis to persist the instance across hot reloads in development
const globalForTelegram = globalThis as unknown as {
    telegramService: TelegramService | undefined;
};

export function getTelegramService(): TelegramService {
    if (!globalForTelegram.telegramService) {
        globalForTelegram.telegramService = new TelegramService();
    }
    return globalForTelegram.telegramService;
}

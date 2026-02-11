import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { NewMessage, NewMessageEvent } from 'telegram/events';
import { Api } from 'telegram/tl';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { getTelegramQueryService } from './TelegramQueryService';

/**
 * Telegram Client API Service
 * 
 * Manages connection to Telegram using Client API (MTProto).
 * Handles:
 * - Session Persistence & Encryption
 * - Authentication Flow (Phone/Code)
 * - Message Routing (Event Handlers)
 * - AI Integration Startup
 * 
 * NOTE: Query operations are moved to TelegramQueryService
 * NOTE: Notification logic is moved to TelegramNotificationService
 */
export class TelegramService {
    private client: TelegramClient | null = null;
    private session: StringSession;
    private isConnected: boolean = false;
    private isConnecting: boolean = false;
    private messageHandlers: Array<(event: NewMessageEvent) => Promise<void>> = [];

    constructor() {
        this.session = new StringSession('');
    }

    /**
     * Auto-connect if we have a saved session
     */
    async autoConnect(): Promise<boolean> {
        if (this.isConnected && this.client) return true;

        if (this.isConnecting) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return this.isConnected;
        }

        const sessionData = await this.loadSession();
        if (!sessionData) return false;

        try {
            this.isConnecting = true;
            await this.connectWithSession();
            return true;
        } catch (error) {
            console.error('[Telegram] Auto-reconnect failed:', error);
            return false;
        } finally {
            this.isConnecting = false;
        }
    }

    /**
     * Internal client initialization
     */
    private async initializeClient(companyId?: string): Promise<void> {
        const { ApiKeyService } = await import('@/lib/services/ApiKeyService');

        const [apiIdStr, apiHash] = await Promise.all([
            ApiKeyService.getCredential('TELEGRAM', 'API_ID', { companyId }),
            ApiKeyService.getCredential('TELEGRAM', 'API_HASH', { companyId })
        ]);

        const apiId = apiIdStr ? parseInt(apiIdStr) : parseInt(process.env.TELEGRAM_API_ID || '0');
        const finalApiHash = apiHash || process.env.TELEGRAM_API_HASH || '';

        if (!apiId || !finalApiHash) {
            throw new Error('Telegram API credentials not configured');
        }

        const sessionData = await this.loadSession();
        this.session = new StringSession(sessionData || '');

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
            if (!this.client) throw new Error('Failed to initialize client');

            await this.client.connect();
            const authorized = await this.client.checkAuthorization();

            if (!authorized) {
                await this.client.disconnect();
                throw new Error('Session expired or invalid');
            }

            this.isConnected = true;
            this.setupMessageListener();
            await this.updateConnectionStatus(true);

            // Auto-initialize AI if enabled
            const settings = await prisma.telegramSettings.findFirst();
            if (settings && settings.aiAutoResponse) {
                await this.initializeAIProcessing(settings.companyId);
            }
        } catch (error) {
            console.error('[Telegram] Connection failed:', error);
            await this.updateConnectionStatus(false, error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }

    /**
     * Start authentication with phone number
     */
    async startAuth(phoneNumber: string): Promise<{ needsVerification: boolean; phoneCodeHash?: string }> {
        try {
            await prisma.telegramSession.deleteMany({ where: { id: 'pending-auth' } }).catch(() => { });
            await this.initializeClient();
            if (!this.client) throw new Error('Client init failed');

            await this.client.connect();
            const result = await this.client.invoke(
                new Api.auth.SendCode({
                    phoneNumber: phoneNumber,
                    apiId: this.client.apiId,
                    apiHash: this.client.apiHash,
                    settings: new Api.CodeSettings({}),
                })
            );

            const phoneCodeHash = 'phoneCodeHash' in result ? result.phoneCodeHash : undefined;
            if (!phoneCodeHash) throw new Error('No phone code hash');

            await prisma.telegramSession.create({
                data: {
                    id: 'pending-auth',
                    sessionData: JSON.stringify({ phoneNumber, phoneCodeHash, timestamp: Date.now() }),
                    isActive: false,
                },
            });

            return { needsVerification: true, phoneCodeHash };
        } catch (error) {
            if (this.client) await this.client.disconnect();
            throw error;
        }
    }

    /**
     * Verify auth code
     */
    async verifyCode(code: string, phoneNumber: string): Promise<void> {
        const pendingAuthRecord = await prisma.telegramSession.findUnique({ where: { id: 'pending-auth' } });
        if (!pendingAuthRecord || !pendingAuthRecord.sessionData) throw new Error('No pending auth');

        const pendingAuth = JSON.parse(pendingAuthRecord.sessionData);
        if (!this.client) await this.initializeClient();
        if (!this.client) throw new Error('Client init failed');
        if (!this.client.connected) await this.client.connect();

        await this.client.invoke(
            new Api.auth.SignIn({
                phoneNumber,
                phoneCodeHash: pendingAuth.phoneCodeHash,
                phoneCode: code,
            })
        );

        this.isConnected = true;
        await this.saveSession();
        this.setupMessageListener();
        await this.updateConnectionStatus(true);
        await prisma.telegramSession.delete({ where: { id: 'pending-auth' } }).catch(() => { });
    }

    private setupMessageListener(): void {
        if (!this.client) return;
        this.client.addEventHandler(async (event: NewMessageEvent) => {
            for (const handler of this.messageHandlers) {
                await handler(event).catch(err => console.error('[Telegram] Handler error:', err));
            }
        }, new NewMessage({}));
    }

    onMessage(handler: (event: NewMessageEvent) => Promise<void>): void {
        this.messageHandlers.push(handler);
    }

    async initializeAIProcessing(companyId: string): Promise<void> {
        const settings = await prisma.telegramSettings.findUnique({ where: { companyId } });
        if (!settings || !settings.aiAutoResponse) return;

        const { TelegramMessageProcessor } = await import('./TelegramMessageProcessor');
        const processor = new TelegramMessageProcessor(companyId);
        this.onMessage(async (event) => processor.processMessage(event));
    }

    /** ============================================================
     * PROXY METHODS (DELEGATED TO SPECIALIZED SERVICES)
     * ============================================================ */

    async getDialogs(limit: number = 50) {
        if (!this.client || !this.isConnected) throw new Error('Not connected');
        return getTelegramQueryService().getDialogs(this.client, limit);
    }

    async getMessages(chatId: string | number, limit: number = 50) {
        if (!this.client || !this.isConnected) throw new Error('Not connected');
        return getTelegramQueryService().getMessages(this.client, chatId, limit);
    }

    async downloadMedia(chatId: string | number, messageId: number) {
        if (!this.client || !this.isConnected) throw new Error('Not connected');
        return getTelegramQueryService().downloadMedia(this.client, chatId, messageId);
    }

    async getUserProfile(userId: string | number) {
        if (!this.client || !this.isConnected) throw new Error('Not connected');
        return getTelegramQueryService().getUserProfile(this.client, userId);
    }

    async sendMessage(chatId: string | number, text: string, options?: { replyTo?: number; parseMode?: 'html' | 'markdown' }) {
        if (!this.client || !this.isConnected) throw new Error('Not connected');
        return this.client.sendMessage(chatId, { message: text, parseMode: options?.parseMode, replyTo: options?.replyTo });
    }

    async sendPhoto(chatId: string | number, photo: Buffer | string, caption?: string) {
        if (!this.client || !this.isConnected) throw new Error('Not connected');
        return this.client.sendFile(chatId, { file: photo, caption });
    }

    /** ============================================================
     * SESSION & SECURITY
     * ============================================================ */

    private async loadSession(): Promise<string | null> {
        const session = await prisma.telegramSession.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
        });
        return session?.sessionData ? this.decryptSession(session.sessionData) : null;
    }

    private async saveSession(): Promise<void> {
        if (!this.client) return;
        const sessionString = this.session.save();
        const encryptedSession = this.encryptSession(sessionString);
        await prisma.telegramSession.updateMany({ where: { isActive: true }, data: { isActive: false } });
        await prisma.telegramSession.create({ data: { sessionData: encryptedSession, isActive: true, lastConnected: new Date() } });
    }

    private encryptSession(data: string): string {
        const key = crypto.createHash('sha256').update(process.env.TELEGRAM_SESSION_ENCRYPTION_KEY || 'default').digest();
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        return iv.toString('hex') + ':' + cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
    }

    private decryptSession(data: string): string {
        const key = crypto.createHash('sha256').update(process.env.TELEGRAM_SESSION_ENCRYPTION_KEY || 'default').digest();
        const parts = data.split(':');
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(parts[0], 'hex'));
        return decipher.update(parts[1], 'hex', 'utf8') + decipher.final('utf8');
    }

    private async updateConnectionStatus(isConnected: boolean, error?: string): Promise<void> {
        await prisma.telegramSession.updateMany({
            where: { isActive: true },
            data: { lastConnected: isConnected ? new Date() : undefined, connectionError: error || null }
        }).catch(() => { });
    }

    async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.disconnect();
            this.isConnected = false;
            await prisma.telegramSession.updateMany({ where: { isActive: true }, data: { isActive: false } });
            await this.updateConnectionStatus(false);
        }
    }

    isClientConnected(): boolean { return this.isConnected; }

    async getConnectionStatus() {
        const session = await prisma.telegramSession.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'desc' } });
        return { isConnected: this.isConnected, lastConnected: session?.lastConnected || null, error: session?.connectionError || null };
    }
}

const globalForTelegram = globalThis as unknown as { telegramService_v6: TelegramService | undefined };

export function getTelegramService(): TelegramService {
    if (!globalForTelegram.telegramService_v6) {
        globalForTelegram.telegramService_v6 = new TelegramService();
    }
    return globalForTelegram.telegramService_v6;
}

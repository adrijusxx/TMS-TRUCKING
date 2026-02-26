import { NewMessageEvent } from 'telegram/events';
import { prisma } from '@/lib/prisma';
import { AIMessageService } from './AIMessageService';
import { getTelegramService } from './TelegramService';
import { TelegramCaseCreator } from '@/lib/managers/telegram/TelegramCaseCreator';

/** Patterns that can be classified without AI */
const SKIP_AI_PATTERNS = [
    /^https?:\/\//i,                          // URLs only
    /^(ok|okay|thanks|thank you|thx|ty|yes|no|sure|got it|understood|copy|10-4|👍|👌|✅)\.?$/i,
    /^\d{1,6}$/,                              // Just a number (truck number, etc.)
    /^[📍📎🖼️🏷️]$/,                          // Single emoji
];
const MIN_MESSAGE_LENGTH = 4;

/** Recent message buffer for batching rapid-fire messages from same sender */
const pendingMessages = new Map<string, { texts: string[]; timer: ReturnType<typeof setTimeout>; event: NewMessageEvent }>();
const BATCH_WINDOW_MS = 8000; // 8 seconds

/**
 * Telegram Message Processor
 * Processes incoming Telegram messages through the AI pipeline
 * Creates breakdown cases automatically and sends responses
 */
export class TelegramMessageProcessor {
    private companyId: string;
    private aiService: AIMessageService;
    private caseCreator: TelegramCaseCreator;

    constructor(companyId: string) {
        this.companyId = companyId;
        this.aiService = new AIMessageService(companyId);
        this.caseCreator = new TelegramCaseCreator(companyId);
    }

    /**
     * Check if a message can be classified without AI
     * Returns a lightweight fallback analysis if skippable, or null if AI is needed
     */
    private preFilter(text: string): import('./AIMessageService').AIAnalysis | null {
        const trimmed = text.trim();

        if (trimmed.length < MIN_MESSAGE_LENGTH || SKIP_AI_PATTERNS.some(p => p.test(trimmed))) {
            return {
                isBreakdown: false,
                isSafetyIncident: false,
                isMaintenanceRequest: false,
                category: 'OTHER',
                confidence: 0,
                urgency: 'LOW',
                requiresHumanReview: false,
                entities: { truckNumbers: [], locations: [], keywords: [] },
                sentiment: 'NEUTRAL',
                language: 'en',
            };
        }
        return null;
    }

    /**
     * Process an incoming Telegram message (with batching for rapid-fire messages)
     */
    async processMessage(event: NewMessageEvent): Promise<void> {
        const message = event.message;
        if (!message.message || message.isChannel) return;

        const senderId = message.senderId?.toString();
        if (!senderId) return;

        // Batch rapid-fire messages from the same sender
        const pending = pendingMessages.get(senderId);
        if (pending) {
            pending.texts.push(message.message);
            clearTimeout(pending.timer);
            pending.timer = setTimeout(() => this.processBatch(senderId), BATCH_WINDOW_MS);
            return;
        }

        // Start a new batch window
        pendingMessages.set(senderId, {
            texts: [message.message],
            event,
            timer: setTimeout(() => this.processBatch(senderId), BATCH_WINDOW_MS),
        });
    }

    /**
     * Process a batch of messages from the same sender
     */
    private async processBatch(senderId: string): Promise<void> {
        const batch = pendingMessages.get(senderId);
        if (!batch) return;
        pendingMessages.delete(senderId);

        const combinedText = batch.texts.join('\n');
        const event = batch.event;

        try {
            await this.processMessageInternal(event, senderId, combinedText);
        } catch (error) {
            console.error('[Telegram] Error processing batched message:', error);
        }
    }

    /**
     * Internal message processing logic
     */
    private async processMessageInternal(event: NewMessageEvent, senderId: string, messageText: string): Promise<void> {
        try {
            const message = event.message;

            // Extract chat title and sender name from the Telegram event
            const chat = message.chat as any;
            const sender = message.sender as any;
            const chatTitle = chat?.title || (chat?.firstName ? `${chat.firstName} ${chat.lastName || ''}`.trim() : undefined);
            const telegramSenderName = sender?.firstName ? `${sender.firstName} ${sender.lastName || ''}`.trim() : undefined;

            console.log(`[Telegram] Processing message from ${senderId}: ${messageText.substring(0, 80)}...`);

            // Pre-filter: skip AI for trivial messages (URLs, short acks, etc.)
            const quickResult = this.preFilter(messageText);
            if (quickResult) {
                console.log(`[Telegram] Pre-filter: skipped AI for trivial message from ${senderId}`);
                // Still log the communication but skip everything else
                await prisma.communication.create({
                    data: {
                        companyId: this.companyId,
                        type: 'MESSAGE',
                        channel: 'TELEGRAM',
                        direction: 'INBOUND',
                        content: messageText,
                        telegramMessageId: message.id,
                        telegramChatId: senderId,
                        status: 'DELIVERED',
                    } as any,
                });
                return;
            }

            // Find driver by Telegram ID
            const driverMapping = await prisma.telegramDriverMapping.findUnique({
                where: { telegramId: senderId },
                include: {
                    driver: {
                        include: {
                            user: true,
                            currentTruck: true,
                        },
                    },
                },
            });

            const driver = driverMapping?.driver;
            const driverName = driver?.user ? `${driver.user.firstName} ${driver.user.lastName}` : 'Unknown User';

            // Analyze message with AI
            const analysis = await this.aiService.analyzeMessage(messageText, {
                driverId: driver?.id || 'unlinked',
                driverName,
                currentTruck: driver?.currentTruck?.truckNumber || 'Unknown',
            });

            console.log(`[Telegram] AI Analysis: `, {
                isBreakdown: analysis.isBreakdown,
                isSafetyIncident: analysis.isSafetyIncident,
                isMaintenanceRequest: analysis.isMaintenanceRequest,
                category: analysis.category,
                confidence: analysis.confidence,
                urgency: analysis.urgency,
                driverLinked: !!driver,
            });

            // Get settings
            const settings = await prisma.telegramSettings.findUnique({
                where: { companyId: this.companyId },
            });

            if (!settings) {
                console.error('[Telegram] No settings found for company');
                return;
            }

            console.log(`[Telegram] Settings: autoCreateCases=${settings.autoCreateCases}, aiAutoResponse=${settings.aiAutoResponse}, threshold=${settings.confidenceThreshold}, requireStaffApproval=${settings.requireStaffApproval}`);

            let caseId: string | undefined;
            let caseNumber: string | undefined;

            // Auto-create cases based on detection
            if (driver && settings.autoCreateCases && analysis.confidence >= settings.confidenceThreshold) {
                if (analysis.isBreakdown) {
                    // Check for existing open breakdown for this truck to prevent duplicates
                    const existingBreakdown = await prisma.breakdown.findFirst({
                        where: {
                            truckId: driver.currentTruck?.id,
                            status: { in: ['REPORTED', 'IN_PROGRESS'] }
                        }
                    });

                    if (!existingBreakdown) {
                        const breakdown = await this.caseCreator.createBreakdownCase(driver.id, driver.currentTruck?.id, driver.currentTruck?.samsaraId, analysis, messageText);
                        caseId = breakdown.id;
                        caseNumber = breakdown.breakdownNumber;
                        console.log(`[Telegram] Created breakdown case: ${caseNumber}`);
                    } else {
                        console.log(`[Telegram] Skipped breakdown creation: Active case ${existingBreakdown.breakdownNumber} exists`);
                        caseId = existingBreakdown.id;
                        caseNumber = existingBreakdown.breakdownNumber;
                    }
                } else if (analysis.isSafetyIncident) {
                    const incident = await this.caseCreator.createSafetyIncident(driver.id, driver.currentTruck?.id, analysis, messageText);
                    caseId = incident.id;
                    caseNumber = incident.incidentNumber;
                    console.log(`[Telegram] Created safety incident: ${caseNumber}`);
                } else if (analysis.isMaintenanceRequest) {
                    const record = await this.caseCreator.createMaintenanceRequest(driver.id, driver.currentTruck?.id, analysis, messageText);
                    caseId = record.id;
                    caseNumber = record.maintenanceNumber || record.id;
                    console.log(`[Telegram] Created maintenance request: ${caseNumber}`);
                }
            } else if (!driver) {
                console.log(`[Telegram] Skipped case creation: Chat ${senderId} not linked to a driver profile`);
            } else if (!settings.autoCreateCases) {
                console.log('[Telegram] Skipped case creation: autoCreateCases is disabled');
            } else if (analysis.confidence < settings.confidenceThreshold) {
                console.log(`[Telegram] Skipped case creation: confidence ${analysis.confidence} < threshold ${settings.confidenceThreshold}`);
            }

            // Determine if this needs a review queue item
            const needsReview = !caseId && (analysis.isBreakdown || analysis.isSafetyIncident || analysis.isMaintenanceRequest);

            // Log communication (linked to breakdown if one was created/found)
            const communicationData = {
                companyId: settings.companyId,
                type: analysis.category === 'BREAKDOWN' ? 'BREAKDOWN_REPORT' : 'MESSAGE',
                channel: 'TELEGRAM',
                direction: 'INBOUND',
                content: messageText,
                telegramMessageId: message.id,
                telegramChatId: senderId,
                driverId: driver?.id,
                breakdownId: caseId || undefined,
                status: 'DELIVERED',
            };

            // Create Communication record
            // @ts-ignore
            const communication = await prisma.communication.create({
                data: communicationData as any
            });

            // Create AI Response Log linked to communication
            await prisma.aIResponseLog.create({
                data: {
                    communicationId: communication.id,
                    messageContent: messageText,
                    aiAnalysis: analysis as any,
                    confidence: analysis.confidence,
                    requiresReview: analysis.requiresHumanReview,
                    wasAutoSent: false, // Updated later if sent
                },
            });

            // Create review queue item if case was skipped but AI detected something actionable
            if (needsReview) {
                const reviewType = !driver ? 'DRIVER_LINK_NEEDED' : 'CASE_APPROVAL';
                const resolvedSenderName = driverName !== 'Unknown User' ? driverName : telegramSenderName;
                await this.createReviewItem({
                    type: reviewType as any,
                    telegramChatId: senderId,
                    chatTitle,
                    senderName: resolvedSenderName,
                    messageContent: messageText,
                    analysis,
                    communicationId: communication.id,
                    driverId: driver?.id,
                });
            }

            // Determine if we should auto-respond
            const shouldAutoRespond = await this.shouldAutoRespond(settings, analysis, driverMapping);

            if (shouldAutoRespond) {
                // Fetch conversation history (Safe fallback approach)
                let history: any[] = [];
                try {
                    const rawHistory = await prisma.communication.findMany({
                        where: {
                            channel: 'TELEGRAM',
                            companyId: this.companyId
                        },
                        orderBy: { createdAt: 'desc' },
                        take: 10,
                    });

                    const targetId = senderId.toString();
                    history = rawHistory.filter((msg: any) =>
                        (msg as any).senderId === targetId ||
                        (msg as any).recipientId === targetId ||
                        (msg as any).metadata?.senderId === targetId ||
                        (msg as any).metadata?.recipientId === targetId ||
                        (msg as any).telegramId === targetId
                    );
                } catch (err) {
                    console.warn('[Telegram] Failed to fetch history:', err);
                }

                const conversationHistory = history.reverse().map(msg => ({
                    role: (msg as any).direction === 'INBOUND' ? 'user' : 'assistant',
                    content: msg.content
                }));

                const responseContext = {
                    driverName: driverMapping?.driver?.user?.firstName || 'Driver',
                    caseNumber: caseNumber,
                    isAiAutoReplyEnabled: !!driverMapping?.aiAutoReply,
                    conversationHistory,
                    originalMessage: messageText
                };

                const response = await this.aiService.generateResponse(analysis, responseContext);
                console.log(`[Telegram] Generated response: "${response}" (Length: ${response?.length})`);

                if (response) {
                    console.log(`[Telegram] Attempting to send response to ${senderId}...`);
                    await this.sendResponse(senderId, response, communication.id, !settings.requireStaffApproval);
                } else {
                    console.warn(`[Telegram] Response generation returned empty/null.`);
                }
            } else if (analysis.requiresHumanReview || settings.requireStaffApproval) {
                // Queue for staff review (only if not already queued above)
                if (!needsReview) {
                    const reviewType = driver ? 'CASE_APPROVAL' : 'DRIVER_LINK_NEEDED';
                    await this.createReviewItem({
                        type: reviewType as any,
                        telegramChatId: senderId,
                        chatTitle,
                        senderName: driverName !== 'Unknown User' ? driverName : telegramSenderName,
                        messageContent: messageText,
                        analysis,
                        communicationId: communication.id,
                        driverId: driver?.id,
                    });
                }
                console.log('[Telegram] Message queued for staff review');
            }

        } catch (error) {
            console.error('[Telegram] Error processing message:', error);
        }
    }

    /**
     * Create a review queue item for staff to approve
     */
    private async createReviewItem(params: {
        type: 'CASE_APPROVAL' | 'DRIVER_LINK_NEEDED';
        telegramChatId: string;
        chatTitle?: string;
        senderName?: string;
        messageContent: string;
        analysis: any;
        communicationId: string;
        driverId?: string;
    }): Promise<void> {
        // Dedup: skip if a PENDING item of same type already exists for this chat
        const existing = await prisma.telegramReviewItem.findFirst({
            where: { telegramChatId: params.telegramChatId, type: params.type as any, status: 'PENDING' },
        });
        if (existing) {
            console.log(`[Telegram] Review item already exists for ${params.telegramChatId} (${params.type})`);
            return;
        }

        // Resolve chat title from driver mapping if not provided
        let chatTitle = params.chatTitle;
        if (!chatTitle && !params.senderName) {
            const mapping = await prisma.telegramDriverMapping.findUnique({
                where: { telegramId: params.telegramChatId },
                select: { firstName: true, lastName: true, username: true },
            });
            if (mapping) {
                const parts = [mapping.firstName, mapping.lastName].filter(Boolean);
                chatTitle = parts.length > 0 ? parts.join(' ') : (mapping.username ? `@${mapping.username}` : undefined);
            }
        }

        await prisma.telegramReviewItem.create({
            data: {
                companyId: this.companyId,
                type: params.type as any,
                telegramChatId: params.telegramChatId,
                chatTitle,
                senderName: params.senderName,
                messageContent: params.messageContent,
                messageDate: new Date(),
                aiCategory: params.analysis.category,
                aiConfidence: params.analysis.confidence,
                aiUrgency: params.analysis.urgency,
                aiAnalysis: params.analysis,
                communicationId: params.communicationId,
                driverId: params.driverId,
            },
        });
        console.log(`[Telegram] Review item created: type=${params.type}, chat=${params.telegramChatId}`);
    }

    /**
     * Determine if we should auto-respond based on settings and analysis
     */
    private async shouldAutoRespond(settings: any, analysis: any, driverMapping: any): Promise<boolean> {
        // 0. Check Explicit Disable (Hard Stop for this driver)
        if (driverMapping && driverMapping.aiAutoReply === false) {
            console.log(`[Telegram] Auto-Reply EXPLICITLY DISABLED for ${driverMapping.telegramId}`);
            return false;
        }

        // 1. Check Chat-specific AI Toggle (from Mapping) - Positive override
        if (driverMapping?.aiAutoReply) {
            console.log(`[Telegram] Auto-Reply enabled for ${driverMapping.telegramId} (Override HumanReview)`);
            return true;
        }

        // 2. Check Global Settings
        if (!settings.aiAutoResponse) {
            console.log('[Telegram] Auto-Reply OFF: aiAutoResponse is disabled globally');
            return false;
        }

        // 3. Human Review Check (if not overridden by driver toggle)
        if (analysis.requiresHumanReview) {
            return false;
        }

        // 4. Confidence Check
        if (analysis.confidence < (settings.confidenceThreshold || 0.7)) {
            return false;
        }

        return true;
    }

    /**
     * Send response to driver
     */
    private async sendResponse(
        chatId: string,
        responseText: string,
        originalCommId: string,
        wasAutoSent: boolean
    ): Promise<void> {
        try {
            const telegramService = getTelegramService();

            await telegramService.sendMessage(chatId, responseText);

            // Log outbound communication
            await prisma.communication.create({
                data: {
                    companyId: this.companyId,
                    channel: 'TELEGRAM',
                    direction: 'OUTBOUND',
                    type: 'MESSAGE',
                    content: responseText,
                    status: 'SENT',
                    telegramChatId: chatId,
                },
            });

            // Update AI response log
            await prisma.aIResponseLog.updateMany({
                where: { communicationId: originalCommId },
                data: {
                    wasAutoSent,
                    responseContent: responseText,
                    actualResponse: responseText,
                },
            });

            console.log(`[Telegram] Sent response to ${chatId}: ${responseText} `);
        } catch (error) {
            console.error('[Telegram] Failed to send response:', error);
        }
    }
}

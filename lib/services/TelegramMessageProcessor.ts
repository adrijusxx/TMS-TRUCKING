import { NewMessageEvent } from 'telegram/events';
import { prisma } from '@/lib/prisma';
import { AIMessageService } from './AIMessageService';
import { getTelegramService } from './TelegramService';
import { TelegramCaseCreator } from '@/lib/managers/telegram/TelegramCaseCreator';

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
     * Process an incoming Telegram message
     */
    async processMessage(event: NewMessageEvent): Promise<void> {
        try {
            const message = event.message;

            // Skip if not a text message or from a channel
            if (!message.message || message.isChannel) {
                return;
            }

            const senderId = message.senderId?.toString();
            if (!senderId) {
                console.log('[Telegram] Message from unknown sender, skipping');
                return;
            }

            console.log(`[Telegram] Processing message from ${senderId}: ${message.message} `);

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

            // We now support unlinked chats for AI replies (if manually enabled via toggle)
            const driver = driverMapping?.driver;
            const driverName = driver?.user ? `${driver.user.firstName} ${driver.user.lastName}` : 'Unknown User';

            // Analyze message with AI
            // If no driver, we pass generic context
            const analysis = await this.aiService.analyzeMessage(message.message, {
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
                        const breakdown = await this.caseCreator.createBreakdownCase(driver.id, driver.currentTruck?.id, driver.currentTruck?.samsaraId, analysis, message.message);
                        caseId = breakdown.id;
                        caseNumber = breakdown.breakdownNumber;
                        console.log(`[Telegram] Created breakdown case: ${caseNumber}`);
                    } else {
                        console.log(`[Telegram] Skipped breakdown creation: Active case ${existingBreakdown.breakdownNumber} exists`);
                        caseId = existingBreakdown.id;
                        caseNumber = existingBreakdown.breakdownNumber;
                    }
                } else if (analysis.isSafetyIncident) {
                    const incident = await this.caseCreator.createSafetyIncident(driver.id, driver.currentTruck?.id, analysis, message.message);
                    caseId = incident.id;
                    caseNumber = incident.incidentNumber;
                    console.log(`[Telegram] Created safety incident: ${caseNumber}`);
                } else if (analysis.isMaintenanceRequest) {
                    const record = await this.caseCreator.createMaintenanceRequest(driver.id, driver.currentTruck?.id, analysis, message.message);
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
                content: message.message,
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
                    messageContent: message.message, // Use message.message
                    aiAnalysis: analysis as any,
                    confidence: analysis.confidence,
                    requiresReview: analysis.requiresHumanReview,
                    wasAutoSent: false, // Updated later if sent
                },
            });

            // Create review queue item if case was skipped but AI detected something actionable
            if (needsReview) {
                const reviewType = !driver ? 'DRIVER_LINK_NEEDED' : 'CASE_APPROVAL';
                await this.createReviewItem({
                    type: reviewType as any,
                    telegramChatId: senderId,
                    senderName: driverName !== 'Unknown User' ? driverName : undefined,
                    messageContent: message.message,
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
                    // Fetch recent telegram messages for relevant context (broad query)
                    const rawHistory = await prisma.communication.findMany({
                        where: {
                            channel: 'TELEGRAM',
                            companyId: this.companyId
                        },
                        orderBy: { createdAt: 'desc' },
                        take: 20
                    });

                    // Filter in memory to bypass potential schema mismatch issues
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

                // Generate response context
                const responseContext = {
                    driverName: driverMapping?.driver?.user?.firstName || 'Driver',
                    caseNumber: caseNumber,
                    isAiAutoReplyEnabled: !!driverMapping?.aiAutoReply,
                    conversationHistory,
                    originalMessage: message.message
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
                    await this.createReviewItem({
                        type: 'CASE_APPROVAL',
                        telegramChatId: senderId,
                        senderName: driverName !== 'Unknown User' ? driverName : undefined,
                        messageContent: message.message,
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

        await prisma.telegramReviewItem.create({
            data: {
                companyId: this.companyId,
                type: params.type as any,
                telegramChatId: params.telegramChatId,
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

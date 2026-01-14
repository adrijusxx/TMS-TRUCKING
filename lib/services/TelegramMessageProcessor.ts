import { NewMessageEvent } from 'telegram/events';
import { Api } from 'telegram/tl';
import { prisma } from '@/lib/prisma';
import { AIMessageService } from './AIMessageService';
import { getTelegramService } from './TelegramService';
import { BreakdownType } from '@prisma/client';

/**
 * Telegram Message Processor
 * Processes incoming Telegram messages through the AI pipeline
 * Creates breakdown cases automatically and sends responses
 */
export class TelegramMessageProcessor {
    private companyId: string;
    private aiService: AIMessageService;

    constructor(companyId: string) {
        this.companyId = companyId;
        this.aiService = new AIMessageService(companyId);
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
                confidence: analysis.confidence,
                urgency: analysis.urgency,
            });

            // Get settings
            const settings = await prisma.telegramSettings.findUnique({
                where: { companyId: this.companyId },
            });

            if (!settings) {
                console.error('[Telegram] No settings found for company');
                return;
            }

            let caseId: string | undefined;
            let caseNumber: string | undefined;

            // Auto-create cases based on detection (Only if linked to a Driver)
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
                        const breakdown = await this.createBreakdownCase(driver.id, driver.currentTruck?.id, analysis, message.message);
                        caseId = breakdown.id;
                        caseNumber = breakdown.breakdownNumber;
                        console.log(`[Telegram] Created breakdown case: ${caseNumber}`);
                    } else {
                        console.log(`[Telegram] Skipped breakdown creation: Active case ${existingBreakdown.breakdownNumber} exists`);
                        caseId = existingBreakdown.id;
                        caseNumber = existingBreakdown.breakdownNumber;
                    }
                } else if (analysis.isSafetyIncident) {
                    const incident = await this.createSafetyIncident(driver.id, driver.currentTruck?.id, analysis, message.message);
                    caseId = incident.id;
                    caseNumber = incident.incidentNumber;
                    console.log(`[Telegram] Created safety incident: ${caseNumber}`);
                } else if (analysis.isMaintenanceRequest) {
                    const record = await this.createMaintenanceRequest(driver.id, driver.currentTruck?.id, analysis, message.message);
                    caseId = record.id;
                    caseNumber = record.maintenanceNumber || record.id;
                    console.log(`[Telegram] Created maintenance request: ${caseNumber}`);
                }
            } else if (!driver && analysis.confidence >= settings.confidenceThreshold) {
                console.log('[Telegram] Skipped case creation: User is not linked to a driver profile');
            }

            // Log communication
            // We log for both linked and unlinked users

            // Prepare common data
            const communicationData = {
                companyId: settings.companyId,
                type: analysis.category === 'BREAKDOWN' ? 'BREAKDOWN_REPORT' : 'MESSAGE', // Use AI category for type
                channel: 'TELEGRAM', // Explicitly set channel
                direction: 'INBOUND',
                content: message.message, // Use message.message for content
                telegramMessageId: message.id, // Use message.id for telegramMessageId
                telegramChatId: senderId, // For private chats, senderId is usually chatId
                // fromNumber: dialog.entity?.phone || driverMapping?.phoneNumber, // 'dialog' and 'phoneNumber' not available here
                driverId: driver?.id, // Optional
                status: 'DELIVERED', // Original status was DELIVERED
                // receivedAt: new Date(), // Original didn't have receivedAt
                // mediaUrls: mediaUrl ? [mediaUrl] : [], // 'mediaUrl' not available here
                // metadata: { // 'dialog' not available here
                //     senderName: dialog.title || 'Unknown',
                //     isGroup: dialog.isGroup,
                //     isChannel: dialog.isChannel
                // }
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
            } else if (analysis.requiresHumanReview || settings.requireStaffApproval) { // This `else if` was outside the `if (shouldAutoRespond)` block
                // Queue for staff review
                console.log('[Telegram] Message queued for staff review');
            }

        } catch (error) {
            console.error('[Telegram] Error processing message:', error);
        }
    }

    /**
     * Create a breakdown case from AI analysis
     */
    private async createBreakdownCase(
        driverId: string,
        truckId: string | undefined,
        analysis: any,
        originalMessage: string
    ) {
        const breakdownNumber = await this.generateBreakdownNumber();

        const priorityMap: Record<string, any> = {
            LOW: 'LOW',
            MEDIUM: 'MEDIUM',
            HIGH: 'HIGH',
            CRITICAL: 'CRITICAL',
        };

        const breakdown = await prisma.breakdown.create({
            data: {
                companyId: this.companyId,
                breakdownNumber,
                truckId: truckId || '',
                driverId,
                breakdownType: BreakdownType.OTHER,
                priority: priorityMap[analysis.urgency] || 'MEDIUM',
                problem: analysis.problemDescription || 'Unknown',
                description: originalMessage,
                location: analysis.location || 'Unknown',
                odometerReading: 0,
                status: 'REPORTED',
                reportedAt: new Date(),
            },
        });

        return breakdown;
    }

    /**
     * Create a safety incident from AI analysis
     */
    private async createSafetyIncident(
        driverId: string,
        truckId: string | undefined,
        analysis: any,
        originalMessage: string
    ) {
        const incidentNumber = await this.generateCaseNumber('SI', 'safetyIncident', 'incidentNumber');

        const incident = await prisma.safetyIncident.create({
            data: {
                companyId: this.companyId,
                incidentNumber,
                driverId,
                truckId: truckId || null,
                incidentType: 'OTHER', // Default, AI could refine this later
                severity: (analysis.urgency === 'CRITICAL' || analysis.urgency === 'HIGH') ? 'MAJOR' : 'MINOR',
                date: new Date(),
                location: analysis.location || 'Unknown',
                description: analysis.problemDescription || originalMessage,
                status: 'REPORTED',
            },
        });

        return incident;
    }

    /**
     * Create a maintenance request from AI analysis
     */
    private async createMaintenanceRequest(
        driverId: string,
        truckId: string | undefined,
        analysis: any,
        originalMessage: string
    ) {
        if (!truckId) {
            throw new Error('Truck ID is required for maintenance requests');
        }

        const recordNumber = await this.generateCaseNumber('MAINT', 'maintenanceRecord', 'maintenanceNumber');

        const record = await prisma.maintenanceRecord.create({
            data: {
                companyId: this.companyId,
                maintenanceNumber: recordNumber,
                truckId: truckId,
                type: 'REPAIR',
                description: analysis.problemDescription || originalMessage,
                cost: 0,
                odometer: 0, // Should be updated with real data if available
                date: new Date(),
                status: 'OPEN',
            },
        });

        return record;
    }

    /**
     * Generate unique case number for various models
     */
    private async generateCaseNumber(
        prefix: string,
        model: string,
        field: string
    ): Promise<string> {
        const year = new Date().getFullYear();
        const basePrefix = `${prefix}-${year}-`;

        // @ts-ignore - dynamic prisma access
        const lastRecord = await (prisma[model] as any).findFirst({
            where: {
                [field]: {
                    startsWith: basePrefix,
                },
            },
            orderBy: {
                [field]: 'desc',
            },
        });

        let nextNumber = 1;
        if (lastRecord) {
            const parts = lastRecord[field].split('-');
            const lastNum = parseInt(parts[parts.length - 1]);
            if (!isNaN(lastNum)) {
                nextNumber = lastNum + 1;
            }
        }

        return `${basePrefix}${nextNumber.toString().padStart(4, '0')}`;
    }

    /**
     * Generate unique breakdown number (DEPRECATED: using generateCaseNumber)
     */
    private async generateBreakdownNumber(): Promise<string> {
        return this.generateCaseNumber('BD', 'breakdown', 'breakdownNumber');
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
        if (!settings.enableAiAutoResponse) {
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

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

            if (!driverMapping) {
                console.log(`[Telegram] No driver mapping found for Telegram ID ${senderId} `);
                // TODO: Send registration instructions
                return;
            }

            const driver = driverMapping.driver;
            const driverName = `${driver.user.firstName} ${driver.user.lastName} `;

            // Analyze message with AI
            const analysis = await this.aiService.analyzeMessage(message.message, {
                driverId: driver.id,
                driverName,
                currentTruck: driver.currentTruck?.truckNumber,
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

            let breakdownId: string | undefined;
            let caseNumber: string | undefined;

            // Auto-create breakdown case if detected
            if (analysis.isBreakdown && settings.autoCreateCases && analysis.confidence >= settings.confidenceThreshold) {
                const breakdown = await this.createBreakdownCase(driver.id, driver.currentTruck?.id, analysis, message.message);
                breakdownId = breakdown.id;
                caseNumber = breakdown.breakdownNumber;

                console.log(`[Telegram] Created breakdown case: ${caseNumber} `);
            }

            // Log communication
            const communication = await prisma.communication.create({
                data: {
                    companyId: this.companyId,
                    driverId: driver.id,
                    breakdownId,
                    channel: 'TELEGRAM',
                    direction: 'INBOUND',
                    type: analysis.isBreakdown ? 'BREAKDOWN_REPORT' : 'MESSAGE',
                    content: message.message,
                    status: 'DELIVERED',
                    telegramMessageId: message.id,
                    telegramChatId: senderId,
                },
            });

            // Log AI analysis
            await prisma.aIResponseLog.create({
                data: {
                    communicationId: communication.id,
                    messageContent: message.message,
                    aiAnalysis: analysis as any,
                    confidence: analysis.confidence,
                    requiresReview: analysis.requiresHumanReview,
                },
            });

            // Determine if we should auto-respond
            const shouldAutoRespond = await this.shouldAutoRespond(settings, analysis);

            if (shouldAutoRespond) {
                // Generate response
                const response = await this.aiService.generateResponse(analysis, {
                    driverName,
                    caseNumber,
                });

                // Send response
                await this.sendResponse(senderId, response, communication.id, !settings.requireStaffApproval);
            } else if (analysis.requiresHumanReview || settings.requireStaffApproval) {
                // Queue for staff review
                console.log('[Telegram] Message queued for staff review');
                // TODO: Notify staff via notification system
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
        // Generate breakdown number
        const breakdownNumber = await this.generateBreakdownNumber();

        // Determine priority from urgency
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
                truckId: truckId || '', // Will need to handle missing truck
                driverId,
                breakdownType: BreakdownType.OTHER, // Default, can be refined
                priority: priorityMap[analysis.urgency] || 'MEDIUM',
                problem: analysis.problemDescription || 'Unknown',
                description: originalMessage,
                location: analysis.location || 'Unknown',
                odometerReading: 0, // Will be updated later
                status: 'REPORTED',
                reportedAt: new Date(),
            },
        });

        return breakdown;
    }

    /**
     * Generate unique breakdown number
     */
    private async generateBreakdownNumber(): Promise<string> {
        const year = new Date().getFullYear();
        const prefix = `BD - ${year} -`;

        // Find the last breakdown number for this year
        const lastBreakdown = await prisma.breakdown.findFirst({
            where: {
                breakdownNumber: {
                    startsWith: prefix,
                },
            },
            orderBy: {
                breakdownNumber: 'desc',
            },
        });

        let nextNumber = 1;
        if (lastBreakdown) {
            const lastNumber = parseInt(lastBreakdown.breakdownNumber.split('-')[2]);
            nextNumber = lastNumber + 1;
        }

        return `${prefix}${nextNumber.toString().padStart(4, '0')} `;
    }

    /**
     * Determine if we should auto-respond
     */
    private async shouldAutoRespond(settings: any, analysis: any): Promise<boolean> {
        // Don't auto-respond if disabled
        if (!settings.aiAutoResponse) {
            return false;
        }

        // Don't auto-respond if requires human review
        if (analysis.requiresHumanReview) {
            return false;
        }

        // Check business hours if required
        if (settings.businessHoursOnly) {
            const isBusinessHours = await this.aiService.isBusinessHours();
            if (!isBusinessHours) {
                // Send after-hours message instead
                return true; // Will use after-hours template
            }
        }

        // Check confidence threshold
        if (analysis.confidence < settings.confidenceThreshold) {
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

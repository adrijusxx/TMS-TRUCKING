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
            const driverName = driver.user ? `${driver.user.firstName} ${driver.user.lastName}` : 'Unknown Driver';

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

            let caseId: string | undefined;
            let caseNumber: string | undefined;

            // Auto-create cases based on detection
            if (settings.autoCreateCases && analysis.confidence >= settings.confidenceThreshold) {
                if (analysis.isBreakdown) {
                    const breakdown = await this.createBreakdownCase(driver.id, driver.currentTruck?.id, analysis, message.message);
                    caseId = breakdown.id;
                    caseNumber = breakdown.breakdownNumber;
                    console.log(`[Telegram] Created breakdown case: ${caseNumber}`);
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
            }

            // Log communication
            const communication = await prisma.communication.create({
                data: {
                    companyId: this.companyId,
                    driverId: driver.id,
                    breakdownId: analysis.isBreakdown ? caseId : undefined,
                    channel: 'TELEGRAM',
                    direction: 'INBOUND',
                    type: analysis.category === 'BREAKDOWN' ? 'BREAKDOWN_REPORT' : 'MESSAGE',
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

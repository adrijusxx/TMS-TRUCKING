import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

/**
 * AI Analysis Result Interface
 */
export interface AIAnalysis {
    isBreakdown: boolean;
    isSafetyIncident: boolean;
    isMaintenanceRequest: boolean;
    category: 'BREAKDOWN' | 'SAFETY' | 'MAINTENANCE' | 'PAYROLL' | 'ROUTE_ISSUE' | 'GENERAL' | 'OTHER';
    confidence: number; // 0-1
    truckNumber?: string;
    location?: string;
    problemDescription?: string;
    urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    suggestedResponse?: string;
    requiresHumanReview: boolean;
    entities: {
        truckNumbers: string[];
        locations: string[];
        keywords: string[];
    };
    sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'URGENT';
    language: 'en' | 'es' | 'other';
}

/**
 * AI Message Service
 * Analyzes driver messages using AI to detect breakdowns,
 * extract entities, and generate appropriate responses
 */
export class AIMessageService {
    private openai: OpenAI;
    private companyId: string;

    constructor(companyId: string) {
        this.companyId = companyId;
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }

    /**
     * Analyze a message from a driver
     */
    async analyzeMessage(
        messageContent: string,
        driverContext?: {
            driverId: string;
            driverName: string;
            currentTruck?: string;
            currentLocation?: string;
        }
    ): Promise<AIAnalysis> {
        try {
            const settings = await this.getSettings();

            const systemPrompt = this.buildSystemPrompt(settings);
            const userPrompt = this.buildUserPrompt(messageContent, driverContext);

            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                response_format: { type: 'json_object' },
                temperature: 0.3, // Lower temperature for more consistent analysis
            });

            const responseText = completion.choices[0]?.message?.content;
            if (!responseText) {
                throw new Error('No response from AI');
            }

            const analysis: AIAnalysis = JSON.parse(responseText);

            // Check for emergency keywords
            const hasEmergencyKeyword = this.checkEmergencyKeywords(
                messageContent,
                settings.emergencyKeywords
            );

            if (hasEmergencyKeyword) {
                analysis.urgency = 'CRITICAL';
                analysis.requiresHumanReview = true;
            }

            return analysis;
        } catch (error) {
            console.error('[AI] Failed to analyze message:', error);

            // Fallback analysis
            return {
                isBreakdown: false,
                isSafetyIncident: false,
                isMaintenanceRequest: false,
                category: 'OTHER',
                confidence: 0,
                urgency: 'LOW',
                suggestedResponse: undefined,
                requiresHumanReview: true,
                entities: {
                    truckNumbers: [],
                    locations: [],
                    keywords: [],
                },
                sentiment: 'NEUTRAL',
                language: 'en',
            };
        }
    }

    /**
     * Generate an auto-response based on analysis
     */
    async generateResponse(
        analysis: AIAnalysis,
        context: {
            driverName: string;
            caseNumber?: string;
            estimatedResponseTime?: string;
        }
    ): Promise<string> {
        try {
            const settings = await this.getSettings();

            // If case was created, use case created template
            if (context.caseNumber) {
                return settings.caseCreatedMessage?.replace('{caseNumber}', context.caseNumber) ||
                    `Case #${context.caseNumber} created. We'll contact you soon.`;
            }

            // If breakdown detected, generate custom response
            if (analysis.isBreakdown) {
                const systemPrompt = `You are a professional dispatcher for a trucking company. Generate a brief, reassuring response to a driver who reported a breakdown. Be professional, empathetic, and concise. Maximum 2 sentences.`;

                const userPrompt = `Driver ${context.driverName} reported: ${analysis.problemDescription || 'a breakdown'}. Generate a response acknowledging their message and letting them know help is on the way.`;

                const completion = await this.openai.chat.completions.create({
                    model: 'gpt-4-turbo-preview',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt },
                    ],
                    temperature: 0.7,
                    max_tokens: 100,
                });

                return completion.choices[0]?.message?.content || settings.autoAckMessage || 'We received your message. Our team will respond shortly.';
            }

            // Default acknowledgment
            return settings.autoAckMessage || 'We received your message. Our team will respond shortly.';
        } catch (error) {
            console.error('[AI] Failed to generate response:', error);
            const settings = await this.getSettings();
            return settings.autoAckMessage || 'We received your message. Our team will respond shortly.';
        }
    }

    /**
     * Build system prompt for message analysis
     */
    private buildSystemPrompt(settings: any): string {
        return `You are an AI assistant for a trucking company's TMS (Transportation Management System). Your job is to analyze messages from truck drivers to detect operational issues and extract relevant information.

Analyze the message and return a JSON object with the following structure:
{
  "isBreakdown": boolean, // true if this is a breakdown/mechanical issue that stops the truck
  "isSafetyIncident": boolean, // true if this is a safety hazard, accident, or policy violation
  "isMaintenanceRequest": boolean, // true if the truck needs repair but can still move
  "category": "BREAKDOWN" | "SAFETY" | "MAINTENANCE" | "PAYROLL" | "ROUTE_ISSUE" | "GENERAL" | "OTHER",
  "confidence": number, // 0-1
  "truckNumber": string | null,
  "location": string | null,
  "problemDescription": string | null,
  "urgency": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "suggestedResponse": string | null,
  "requiresHumanReview": boolean,
  "entities": {
    "truckNumbers": string[],
    "locations": string[],
    "keywords": string[]
  },
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "URGENT",
  "language": "en" | "es" | "other"
}

Issue Classification:
- **BREAKDOWN**: Mechanical failure stopping the truck (Engine, Transmission, Brakes, Tires, Electrical).
- **SAFETY**: Accidents, collisions, hazards, windshield cracks, lights out, DOT issues, medical emergencies.
- **MAINTENANCE**: Repairs needed but not urgent (oil change, small leaks, sensors, cosmetic damage).
- **PAYROLL**: Salary, settlements, advances, deduction questions.
- **ROUTE_ISSUE**: GPS problems, dock closed, wrong address, scale closed.

Emergency keywords for CRITICAL: ${settings.emergencyKeywords.join(', ')}

Be accurate. When in doubt, mark requiresHumanReview as true.`;
    }

    /**
     * Build user prompt with message and context
     */
    private buildUserPrompt(
        messageContent: string,
        driverContext?: {
            driverId: string;
            driverName: string;
            currentTruck?: string;
            currentLocation?: string;
        }
    ): string {
        let prompt = `Analyze this message from a driver:\n\n"${messageContent}"`;

        if (driverContext) {
            prompt += `\n\nDriver context:`;
            prompt += `\n- Name: ${driverContext.driverName}`;
            if (driverContext.currentTruck) {
                prompt += `\n- Current truck: ${driverContext.currentTruck}`;
            }
            if (driverContext.currentLocation) {
                prompt += `\n- Last known location: ${driverContext.currentLocation}`;
            }
        }

        return prompt;
    }

    /**
     * Check for emergency keywords
     */
    private checkEmergencyKeywords(message: string, keywords: string[]): boolean {
        const lowerMessage = message.toLowerCase();
        return keywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()));
    }

    /**
     * Get Telegram settings for the company
     */
    private async getSettings() {
        let settings = await prisma.telegramSettings.findUnique({
            where: { companyId: this.companyId },
        });

        // Create default settings if not exists
        if (!settings) {
            settings = await prisma.telegramSettings.create({
                data: {
                    companyId: this.companyId,
                    autoCreateCases: true,
                    aiAutoResponse: false,
                    requireStaffApproval: true,
                    confidenceThreshold: 0.8,
                    aiProvider: 'OPENAI',
                    businessHoursOnly: false,
                    timezone: 'America/Chicago',
                    emergencyKeywords: ['accident', 'injured', 'fire', 'police', 'emergency', 'crash', 'hurt'],
                },
            });
        }

        return settings;
    }

    /**
     * Check if currently within business hours
     */
    async isBusinessHours(): Promise<boolean> {
        const settings = await this.getSettings();

        if (!settings.businessHoursOnly) {
            return true; // Always business hours if not restricted
        }

        if (!settings.businessHoursStart || !settings.businessHoursEnd) {
            return true; // No hours configured
        }

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTime = currentHour * 60 + currentMinute;

        const [startHour, startMinute] = settings.businessHoursStart.split(':').map(Number);
        const [endHour, endMinute] = settings.businessHoursEnd.split(':').map(Number);

        const startTime = startHour * 60 + startMinute;
        const endTime = endHour * 60 + endMinute;

        return currentTime >= startTime && currentTime <= endTime;
    }

    /**
     * Translate message (if needed)
     */
    async translateMessage(message: string, targetLang: 'en' | 'es'): Promise<string> {
        try {
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: [
                    {
                        role: 'system',
                        content: `Translate the following message to ${targetLang === 'en' ? 'English' : 'Spanish'}. Maintain the tone and urgency. Only return the translation, nothing else.`,
                    },
                    { role: 'user', content: message },
                ],
                temperature: 0.3,
                max_tokens: 200,
            });

            return completion.choices[0]?.message?.content || message;
        } catch (error) {
            console.error('[AI] Translation failed:', error);
            return message;
        }
    }
}

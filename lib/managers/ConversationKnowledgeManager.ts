import { prisma } from '@/lib/prisma';
import { KnowledgeBaseService } from '@/lib/services/KnowledgeBaseService';
import OpenAI from 'openai';

/**
 * Conversation Knowledge Manager
 * Handles syncing communication logs into the AI Knowledge Base
 */
export class ConversationKnowledgeManager {
    private companyId: string;
    private kbService: KnowledgeBaseService;
    private openai: OpenAI;

    constructor(companyId: string) {
        this.companyId = companyId;
        this.kbService = new KnowledgeBaseService(companyId);
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }

    /**
     * Sync recent conversations to Knowledge Base
     * This "teaches" the AI from past interactions
     */
    async syncConversationsToKB(lookbackDays: number = 1): Promise<number> {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - lookbackDays);

            // 1. Fetch recent inbound messages with no prior KB sync
            // We look for Communications that haven't been summarized yet
            const communications = await prisma.communication.findMany({
                where: {
                    companyId: this.companyId,
                    createdAt: { gte: startDate },
                    direction: 'INBOUND',
                    // Optional: filter for resolved issues or high quality conversations
                },
                include: {
                    driver: {
                        include: { user: true }
                    }
                },
                orderBy: { createdAt: 'asc' }
            });

            if (communications.length === 0) {
                console.log(`[ConvKnowledge] No new conversations to sync for company ${this.companyId}`);
                return 0;
            }

            // 2. Group by driver/conversation to provide context
            const groupedMessages = this.groupByDriver(communications);
            let ingestedCount = 0;

            for (const [driverId, messages] of Object.entries(groupedMessages)) {
                const driverName = messages[0].driver?.user ?
                    `${messages[0].driver.user.firstName} ${messages[0].driver.user.lastName}` :
                    'Unknown Driver';

                // 3. Summarize the conversation to extract "knowledge"
                const knowledgeSnippet = await this.summarizeConversation(driverName, messages);

                if (knowledgeSnippet && knowledgeSnippet.length > 50) {
                    // 4. Index into Knowledge Base
                    await this.kbService.processTextSegment(
                        knowledgeSnippet,
                        `Interaction with ${driverName} on ${new Date().toLocaleDateString()}`,
                        {
                            type: 'CONVERSATION_SYNC',
                            driverId,
                            syncedAt: new Date().toISOString()
                        }
                    );
                    ingestedCount++;
                }
            }

            return ingestedCount;

        } catch (error) {
            console.error('[ConvKnowledge] Sync failed:', error);
            throw error;
        }
    }

    /**
     * Group communications by driver ID
     */
    private groupByDriver(comms: any[]): Record<string, any[]> {
        return comms.reduce((acc, comm) => {
            const key = comm.driverId || 'unknown';
            if (!acc[key]) acc[key] = [];
            acc[key].push(comm);
            return acc;
        }, {} as Record<string, any[]>);
    }

    /**
     * Use AI to turn messy chat history into structured knowledge
     */
    private async summarizeConversation(driverName: string, messages: any[]): Promise<string | null> {
        const historyText = messages.map(m => `DRIVER: ${m.content}`).join('\n');

        const prompt = `
You are a TMS Knowledge Curator. Review the following chat history between a driver and the system/dispatch.
Extract any important operational knowledge, policies mentioned, or problem-resolution patterns that might be useful for future AI responses.

DRIVER NAME: ${driverName}
CONVERSATION:
${historyText}

INSTRUCTIONS:
- Summarize the key issue and how it was handled (if evident).
- If the driver shared important info (e.g. "Gate 4 is broken at TQL warehouse"), preserve that detail.
- If it's just general chatter ("hello", "thanks"), return NULL.
- Return a concise knowledge snippet (1-3 paragraphs) formatted for a vector database.
- Do NOT include sensitive personal data.
`;

        const response = await this.openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
        });

        const result = response.choices[0]?.message?.content?.trim();
        return (result === 'NULL' || !result) ? null : result;
    }
}

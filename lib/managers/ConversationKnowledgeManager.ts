import { prisma } from '@/lib/prisma';
import { KnowledgeBaseService } from '@/lib/services/KnowledgeBaseService';
import { getTelegramService } from '@/lib/services/TelegramService';
import OpenAI from 'openai';

/**
 * Conversation Knowledge Manager
 * Handles syncing Telegram conversations into the AI Knowledge Base
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
     * Sync recent Telegram conversations to Knowledge Base
     * Fetches messages directly from Telegram API
     */
    async syncConversationsToKB(lookbackDays: number = 7): Promise<number> {
        try {
            const telegramService = getTelegramService();

            // Check if Telegram is connected
            const isConnected = await telegramService.autoConnect();
            if (!isConnected) {
                console.log(`[ConvKnowledge] Telegram not connected for company ${this.companyId}. Skipping.`);
                return 0;
            }

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - lookbackDays);

            // 1. Get all dialogs (conversations)
            console.log(`[ConvKnowledge] Fetching Telegram dialogs...`);
            const dialogs = await telegramService.getDialogs(50);

            if (dialogs.length === 0) {
                console.log(`[ConvKnowledge] No Telegram dialogs found.`);
                return 0;
            }

            console.log(`[ConvKnowledge] Found ${dialogs.length} dialogs. Processing...`);

            // Get today's date for deduplication
            const today = new Date().toISOString().split('T')[0];

            // Check which dialogs were already synced today
            const existingDocs = await prisma.knowledgeBaseDocument.findMany({
                where: {
                    companyId: this.companyId,
                    title: { contains: today }
                },
                select: { title: true }
            });
            const syncedTitles = new Set(existingDocs.map(d => d.title));
            console.log(`[ConvKnowledge] ${syncedTitles.size} conversations already synced today. Skipping duplicates.`);

            let ingestedCount = 0;

            // 2. Process each dialog
            for (const dialog of dialogs) {
                try {
                    // Skip channels and groups for now (focus on 1:1 chats)
                    if (dialog.isChannel || dialog.isGroup) continue;

                    // Skip if last message is older than cutoff
                    if (dialog.lastMessageDate && dialog.lastMessageDate < cutoffDate) continue;

                    // Skip if already synced today
                    const expectedTitle = `Telegram: ${dialog.title} - ${today}`;
                    if (syncedTitles.has(expectedTitle)) continue;

                    // 3. Fetch messages from this chat
                    const messages = await telegramService.getMessages(dialog.id, 100);

                    // Filter to messages within lookback period
                    const recentMessages = messages.filter(
                        (m: any) => m.date && m.date >= cutoffDate
                    );

                    if (recentMessages.length < 3) continue; // Skip chats with too few messages

                    // 4. Format messages for summarization
                    const formattedMessages = recentMessages.map((m: any) => ({
                        role: m.out ? 'DISPATCH' : 'CONTACT',
                        content: m.text || '[media]',
                        date: m.date
                    }));

                    // 5. Summarize and classify conversation
                    const result = await this.summarizeTelegramConversation(
                        dialog.title,
                        formattedMessages
                    );

                    if (result && result.summary.length > 50) {
                        // 6. Store in Knowledge Base with dated title and category
                        await this.kbService.processTextSegment(
                            result.summary,
                            `Telegram: ${dialog.title} - ${today}`,
                            {
                                type: 'TELEGRAM_SYNC',
                                category: result.category,
                                chatId: dialog.id,
                                chatTitle: dialog.title,
                                syncedAt: new Date().toISOString(),
                                messageCount: recentMessages.length
                            }
                        );
                        ingestedCount++;
                        console.log(`[ConvKnowledge] Synced [${result.category}]: ${dialog.title}`);
                    }
                } catch (dialogError) {
                    console.error(`[ConvKnowledge] Error processing dialog ${dialog.title}:`, dialogError);
                    // Continue with other dialogs
                }
            }

            console.log(`[ConvKnowledge] Sync complete. Ingested ${ingestedCount} conversations.`);
            return ingestedCount;

        } catch (error) {
            console.error('[ConvKnowledge] Sync failed:', error);
            throw error;
        }
    }

    /**
     * Use AI to clean and classify Telegram conversation
     */
    private async summarizeTelegramConversation(
        contactName: string,
        messages: Array<{ role: string; content: string; date: Date }>
    ): Promise<{ summary: string; category: string } | null> {
        const historyText = messages
            .map(m => `${m.role}: ${m.content}`)
            .join('\n');

        const prompt = `
You are a TMS Knowledge Curator. Review the following Telegram conversation.
Your goal is to create a CLEAN, SEARCHABLE TRANSCRIPT for AI training.
DO NOT SUMMARIZE. Preserve the exact instructions, addresses, codes, and operational details.

CONTACT: ${contactName}
CONVERSATION:
${historyText}

INSTRUCTIONS:
1. "content": Create a REFINED TRANSCRIPT.
   - Remove "hello", "good morning", "thanks", "ok", "bye" (unless it's the only confirmation).
   - Remove timestamps.
   - CORRECTION: Fix obvious typos in addresses or numbers if clear from context.
   - KEEP: All gate codes, pickup numbers, addresses, rates, truck numbers, and driver operational updates.
   - FORMAT: "Speaker: Message" (New lines for each).

2. "category": Classify into ONE category:
   - DISPATCH (Load assignments, routing, pickup/delivery)
   - BREAKDOWN (Truck issues, repairs, tires)
   - COMPLIANCE (CDL, medical cards, inspections)
   - ONBOARDING (New driver setup, orientation)
   - SETTLEMENT (Pay, deductions, advances)
   - GENERAL (Other)

3. If conversation is empty or just "hello"/"ok", return null.

Return RAW JSON (no markdown):
{ "content": "Dispatcher: Load 1234 picked up at 10am...", "category": "DISPATCH" }
`;

        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.1, // Lower temperature for factual transcript
                max_tokens: 1000,
            });

            let result = response.choices[0]?.message?.content?.trim();
            if (!result || result === 'null') return null;

            // Strip markdown code blocks if present
            result = result.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

            try {
                const parsed = JSON.parse(result);
                if (parsed.content && parsed.category) {
                    // Map 'content' to 'summary' key to match interface or update interface
                    return { summary: parsed.content, category: parsed.category };
                }
            } catch {
                // Formatting failed, save raw result
                return { summary: result, category: 'GENERAL' };
            }
            return null;
        } catch (error) {
            console.error('[ConvKnowledge] AI summarization failed:', error);
            return null;
        }
    }
}

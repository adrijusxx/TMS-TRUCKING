import { prisma } from '@/lib/prisma';
import { KnowledgeBaseService } from '@/lib/services/KnowledgeBaseService';
import { getMattermostService } from '@/lib/services/MattermostService';
import OpenAI from 'openai';

/**
 * Conversation Knowledge Manager
 * Handles syncing Mattermost conversations into the AI Knowledge Base
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
     * Sync recent Mattermost conversations to Knowledge Base
     * Fetches messages directly from Mattermost API
     */
    async syncConversationsToKB(lookbackDays: number = 7): Promise<number> {
        try {
            const mattermostService = getMattermostService();

            // Check if Mattermost is connected
            const isConnected = await mattermostService.autoConnect();
            if (!isConnected) {
                console.log(`[ConvKnowledge] Mattermost not connected for company ${this.companyId}. Skipping.`);
                return 0;
            }

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - lookbackDays);

            // Load teamId from Mattermost settings
            const settings = await prisma.mattermostSettings.findFirst({
                where: { companyId: this.companyId },
            });
            if (!settings?.teamId) {
                console.log(`[ConvKnowledge] No Mattermost teamId configured for company ${this.companyId}. Skipping.`);
                return 0;
            }

            // 1. Get all channels (conversations)
            console.log(`[ConvKnowledge] Fetching Mattermost channels...`);
            const channels = await mattermostService.getChannels(settings.teamId);

            if (channels.length === 0) {
                console.log(`[ConvKnowledge] No Mattermost channels found.`);
                return 0;
            }

            console.log(`[ConvKnowledge] Found ${channels.length} channels. Processing...`);

            // Get today's date for deduplication
            const today = new Date().toISOString().split('T')[0];

            // Check which channels were already synced today
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

            // 2. Process each channel
            for (const channel of channels) {
                try {
                    // Skip if already synced today
                    const expectedTitle = `Mattermost: ${channel.title} - ${today}`;
                    if (syncedTitles.has(expectedTitle)) continue;

                    // 3. Fetch posts from this channel
                    const posts = await mattermostService.getChannelPosts(channel.id);

                    // Filter to messages within lookback period
                    const recentMessages = posts.filter(
                        (m: any) => m.date && m.date >= cutoffDate
                    );

                    if (recentMessages.length < 3) continue; // Skip channels with too few messages

                    // 4. Format messages for summarization
                    const formattedMessages = recentMessages.map((m: any) => ({
                        role: m.out ? 'DISPATCH' : 'CONTACT',
                        content: m.text || '[media]',
                        date: m.date
                    }));

                    // 5. Summarize and classify conversation
                    const result = await this.summarizeConversation(
                        channel.title,
                        formattedMessages
                    );

                    if (result && result.summary.length > 50) {
                        // 6. Store in Knowledge Base with dated title and category
                        await this.kbService.processTextSegment(
                            result.summary,
                            `Mattermost: ${channel.title} - ${today}`,
                            {
                                type: 'MATTERMOST_SYNC',
                                category: result.category,
                                chatId: channel.id,
                                chatTitle: channel.title,
                                syncedAt: new Date().toISOString(),
                                messageCount: recentMessages.length
                            }
                        );
                        ingestedCount++;
                        console.log(`[ConvKnowledge] Synced [${result.category}]: ${channel.title}`);
                    }
                } catch (channelError) {
                    console.error(`[ConvKnowledge] Error processing channel ${channel.title}:`, channelError);
                    // Continue with other channels
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
     * Use AI to clean and classify Mattermost conversation
     */
    private async summarizeConversation(
        contactName: string,
        messages: Array<{ role: string; content: string; date: Date }>
    ): Promise<{ summary: string; category: string } | null> {
        const historyText = messages
            .map(m => `${m.role}: ${m.content}`)
            .join('\n');

        const prompt = `
You are a TMS Knowledge Curator. Review the following Mattermost conversation.
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

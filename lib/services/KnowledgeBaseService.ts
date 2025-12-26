import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import pdf from 'pdf-parse';

export class KnowledgeBaseService {
    private openai: OpenAI;
    private companyId: string;

    constructor(companyId: string) {
        this.companyId = companyId;
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }

    /**
     * Process and index a document
     */
    async processDocument(
        fileBuffer: Buffer,
        filename: string,
        fileType: string
    ): Promise<string> {
        try {
            // 1. Create Document Record
            const doc = await prisma.knowledgeBaseDocument.create({
                data: {
                    companyId: this.companyId,
                    title: filename,
                    filename,
                    fileType,
                    fileSize: fileBuffer.length,
                    url: 'local', // In a real app, upload to S3/Blob and put URL here
                    status: 'PROCESSING',
                },
            });

            // 2. Extract Text
            let text = '';
            if (fileType === 'application/pdf') {
                const data = await pdf(fileBuffer);
                text = data.text;
            } else {
                text = fileBuffer.toString('utf-8');
            }

            // 3. Chunk Text
            const chunks = this.chunkText(text);

            // 4. Generate Embeddings & Store
            // Process in batches to avoid rate limits
            const batchSize = 10;
            for (let i = 0; i < chunks.length; i += batchSize) {
                const batch = chunks.slice(i, i + batchSize);

                const embeddingResponse = await this.openai.embeddings.create({
                    model: 'text-embedding-3-small',
                    input: batch,
                });

                const embeddings = embeddingResponse.data;

                // Store chunks
                await prisma.$transaction(
                    batch.map((chunkContent, idx) =>
                        prisma.documentChunk.create({
                            data: {
                                documentId: doc.id,
                                content: chunkContent,
                                chunkIndex: i + idx,
                                embedding: embeddings[idx].embedding,
                            }
                        })
                    )
                );
            }

            // 5. Update Status
            await prisma.knowledgeBaseDocument.update({
                where: { id: doc.id },
                data: { status: 'READY' },
            });

            return doc.id;

        } catch (error: any) {
            console.error('[KnowledgeBase] Error processing document:', error);
            // Try to update status to failed if we created the doc
            // Note: In a real job queue, this would be robustly handled
            throw error;
        }
    }

    /**
     * Search knowledge base
     */
    async search(query: string, limit = 5): Promise<any[]> {
        // 1. Generate query embedding
        const response = await this.openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: query,
        });
        const queryEmbedding = response.data[0].embedding;

        // 2. Fetch all chunks for this company (Naive approach for now)
        // For production with pgvector, we would do a raw SQL query here using vector cosine distance
        // Since we don't have pgvector extension guaranteed, we'll fetch chunks and calculate cosine similarity in JS.
        // Optimization: Only fetch chunks from "READY" documents.

        // Fetch limited fields to save memory
        const documents = await prisma.knowledgeBaseDocument.findMany({
            where: { companyId: this.companyId, status: 'READY' },
            include: { chunks: true } // Fetches all chunks. CAUTION: Heavy if DB is huge.
        });

        const allChunks: any[] = [];
        documents.forEach(doc => {
            doc.chunks.forEach(chunk => {
                allChunks.push({
                    ...chunk,
                    documentTitle: doc.title,
                    documentId: doc.id
                });
            });
        });

        if (allChunks.length === 0) return [];

        // 3. Calculate Similarity (Cosine)
        const scoredChunks = allChunks.map(chunk => ({
            ...chunk,
            score: this.cosineSimilarity(queryEmbedding, chunk.embedding)
        }));

        // 4. Sort and return top K
        return scoredChunks
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    private cosineSimilarity(vecA: number[], vecB: number[]): number {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    private chunkText(text: string, chunkSize = 800, overlap = 100): string[] {
        const words = text.split(/\s+/);
        const chunks: string[] = [];
        let currentChunk: string[] = [];
        let currentLength = 0;

        for (const word of words) {
            currentChunk.push(word);
            currentLength += word.length + 1; // +1 for space

            if (currentLength >= chunkSize) {
                chunks.push(currentChunk.join(' '));
                // Keep overlap
                const overlapWords = [];
                let overlapLength = 0;
                for (let i = currentChunk.length - 1; i >= 0; i--) {
                    overlapLength += currentChunk[i].length + 1;
                    overlapWords.unshift(currentChunk[i]);
                    if (overlapLength >= overlap) break;
                }
                currentChunk = overlapWords;
                currentLength = overlapLength;
            }
        }

        if (currentChunk.length > 0) {
            chunks.push(currentChunk.join(' '));
        }

        return chunks;
    }
}

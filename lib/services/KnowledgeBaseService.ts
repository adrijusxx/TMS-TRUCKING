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

            // 3. Chunk Text & Embed
            await this.processText(text, doc.id);

            // 4. Update Status
            await prisma.knowledgeBaseDocument.update({
                where: { id: doc.id },
                data: { status: 'READY' },
            });

            return doc.id;

        } catch (error: any) {
            console.error('[KnowledgeBase] Error processing document:', error);
            throw error;
        }
    }

    /**
     * Process direct text segment for indexing
     */
    async processTextSegment(
        text: string,
        title: string,
        metadata?: any
    ): Promise<string> {
        try {
            // 1. Create Document Record
            const doc = await prisma.knowledgeBaseDocument.create({
                data: {
                    companyId: this.companyId,
                    title: title,
                    filename: 'text_segment.txt',
                    fileType: 'text/plain',
                    fileSize: Buffer.byteLength(text),
                    url: 'internal',
                    status: 'PROCESSING',
                    metadata: metadata,
                },
            });

            // 2. Chunk & Embed
            await this.processText(text, doc.id);

            // 3. Update Status
            await prisma.knowledgeBaseDocument.update({
                where: { id: doc.id },
                data: { status: 'READY' },
            });

            return doc.id;
        } catch (error) {
            console.error('[KnowledgeBase] Error processing text segment:', error);
            throw error;
        }
    }

    /**
     * Helper to chunk and embed text for a document
     */
    private async processText(text: string, documentId: string): Promise<void> {
        const chunks = this.chunkText(text);
        const batchSize = 10;

        for (let i = 0; i < chunks.length; i += batchSize) {
            const batch = chunks.slice(i, i + batchSize);

            const embeddingResponse = await this.openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: batch,
            });

            const embeddings = embeddingResponse.data;

            await prisma.$transaction(
                batch.map((chunkContent, idx) =>
                    prisma.documentChunk.create({
                        data: {
                            documentId: documentId,
                            content: chunkContent,
                            chunkIndex: i + idx,
                            embedding: embeddings[idx].embedding,
                        }
                    })
                )
            );
        }
    }

    /**
     * Search knowledge base - MEMORY EFFICIENT VERSION
     * Uses batched streaming to avoid loading all embeddings at once
     */
    async search(query: string, limit = 5): Promise<any[]> {
        try {
            // 1. Generate query embedding
            const response = await this.openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: query,
            });
            const queryEmbedding = response.data[0].embedding;

            // 2. Get document IDs for this company (lightweight query)
            const documents = await prisma.knowledgeBaseDocument.findMany({
                where: { companyId: this.companyId, status: 'READY' },
                select: { id: true, title: true },
            });

            if (documents.length === 0) return [];

            const docMap = new Map(documents.map(d => [d.id, d.title]));
            const documentIds = documents.map(d => d.id);

            // 3. Count total chunks to set expectations
            const totalChunks = await prisma.documentChunk.count({
                where: { documentId: { in: documentIds } },
            });

            if (totalChunks === 0) return [];

            // 4. Process chunks in batches to avoid memory issues
            // Keep a min-heap of top K results
            const BATCH_SIZE = 100; // Process 100 chunks at a time
            const MAX_CHUNKS = 500; // Safety limit - don't process more than 500 chunks
            const topResults: Array<{ score: number; chunk: any }> = [];

            let processedCount = 0;
            let skip = 0;

            while (processedCount < Math.min(totalChunks, MAX_CHUNKS)) {
                // Fetch batch of chunks
                const chunkBatch = await prisma.documentChunk.findMany({
                    where: { documentId: { in: documentIds } },
                    select: {
                        id: true,
                        documentId: true,
                        content: true,
                        chunkIndex: true,
                        embedding: true,
                    },
                    skip,
                    take: BATCH_SIZE,
                    orderBy: { id: 'asc' },
                });

                if (chunkBatch.length === 0) break;

                // Calculate similarity for this batch
                for (const chunk of chunkBatch) {
                    const embedding = chunk.embedding as number[];
                    if (!embedding || embedding.length === 0) continue;

                    const score = this.cosineSimilarity(queryEmbedding, embedding);

                    // Keep only top K results
                    if (topResults.length < limit) {
                        topResults.push({
                            score,
                            chunk: {
                                id: chunk.id,
                                documentId: chunk.documentId,
                                documentTitle: docMap.get(chunk.documentId) || 'Unknown',
                                content: chunk.content,
                                chunkIndex: chunk.chunkIndex,
                            },
                        });
                        topResults.sort((a, b) => a.score - b.score); // Min at front
                    } else if (score > topResults[0].score) {
                        // Replace minimum if new score is higher
                        topResults[0] = {
                            score,
                            chunk: {
                                id: chunk.id,
                                documentId: chunk.documentId,
                                documentTitle: docMap.get(chunk.documentId) || 'Unknown',
                                content: chunk.content,
                                chunkIndex: chunk.chunkIndex,
                            },
                        };
                        topResults.sort((a, b) => a.score - b.score);
                    }
                }

                processedCount += chunkBatch.length;
                skip += BATCH_SIZE;

                // Clear batch from memory
                chunkBatch.length = 0;
            }

            // Return sorted by score (highest first)
            return topResults
                .sort((a, b) => b.score - a.score)
                .map(r => ({ ...r.chunk, score: r.score }));

        } catch (error: any) {
            console.error('[KnowledgeBase] Search error:', error.message);
            // Don't crash - return empty results
            return [];
        }
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

/**
 * Lead Document Bridge Manager
 *
 * When a lead is hired and converted to a driver, this bridges
 * lead documents into the Driver Qualification File (DQF) system.
 */

import { PrismaClient } from '@prisma/client';

// Maps lead document types → DQF document types
const LEAD_TO_DQF_MAP: Record<string, { dqfType: string; docType: string }> = {
    CDL_LICENSE: { dqfType: 'CDL_COPY', docType: 'DRIVER_LICENSE' },
    MEDICAL_CARD: { dqfType: 'MEDICAL_EXAMINERS_CERTIFICATE', docType: 'MEDICAL_CARD' },
    MVR: { dqfType: 'MVR_RECORD', docType: 'OTHER' },
    APPLICATION: { dqfType: 'APPLICATION', docType: 'OTHER' },
    DRUG_TEST: { dqfType: 'DRUG_TEST_RESULT', docType: 'OTHER' },
};

interface BridgeInput {
    leadId: string;
    driverId: string;
    companyId: string;
    userId: string;
}

interface BridgeResult {
    bridgedCount: number;
    skippedCount: number;
    errors: string[];
}

export class LeadDocumentBridgeManager {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async bridgeDocuments(input: BridgeInput): Promise<BridgeResult> {
        const { leadId, driverId, companyId, userId } = input;
        const result: BridgeResult = { bridgedCount: 0, skippedCount: 0, errors: [] };

        // Fetch all lead documents
        const leadDocs = await this.prisma.leadDocument.findMany({
            where: { leadId },
        });

        if (!leadDocs.length) return result;

        // Get or create the DQF
        const dqf = await this.getOrCreateDQF(driverId, companyId);
        if (!dqf) {
            result.errors.push('Failed to create DQF for driver');
            return result;
        }

        for (const leadDoc of leadDocs) {
            const mapping = LEAD_TO_DQF_MAP[leadDoc.documentType];
            if (!mapping) {
                result.skippedCount++;
                continue;
            }

            try {
                // Check if this DQF document type already exists
                const existing = await this.prisma.dQFDocument.findUnique({
                    where: { dqfId_documentType: { dqfId: dqf.id, documentType: mapping.dqfType as any } },
                });

                if (existing) {
                    result.skippedCount++;
                    continue;
                }

                // Create a Document record (generic doc storage)
                const doc = await this.prisma.document.create({
                    data: {
                        companyId,
                        type: mapping.docType as any,
                        title: `${leadDoc.documentType} (from recruiting)`,
                        fileName: leadDoc.fileName,
                        fileUrl: leadDoc.fileUrl,
                        fileSize: leadDoc.fileSize,
                        mimeType: leadDoc.mimeType,
                        driverId,
                        expiryDate: leadDoc.expirationDate,
                        uploadedBy: userId,
                        metadata: { bridgedFromLeadId: leadId, originalDocId: leadDoc.id },
                    },
                });

                // Create the DQF document link
                await this.prisma.dQFDocument.create({
                    data: {
                        dqfId: dqf.id,
                        documentId: doc.id,
                        documentType: mapping.dqfType as any,
                        status: 'COMPLETE',
                        expirationDate: leadDoc.expirationDate,
                    },
                });

                result.bridgedCount++;
            } catch (err) {
                result.errors.push(`Failed to bridge ${leadDoc.documentType}: ${(err as Error).message}`);
            }
        }

        // Recalculate DQF status
        await this.updateDQFStatus(dqf.id);

        return result;
    }

    private async getOrCreateDQF(driverId: string, companyId: string) {
        const existing = await this.prisma.driverQualificationFile.findUnique({
            where: { driverId },
        });
        if (existing) return existing;

        return this.prisma.driverQualificationFile.create({
            data: { companyId, driverId, status: 'INCOMPLETE' },
        });
    }

    private async updateDQFStatus(dqfId: string) {
        const requiredTypes = [
            'APPLICATION', 'ROAD_TEST', 'PREVIOUS_EMPLOYMENT_VERIFICATION',
            'ANNUAL_REVIEW', 'MEDICAL_EXAMINERS_CERTIFICATE', 'CDL_COPY', 'MVR_RECORD',
        ];

        const docs = await this.prisma.dQFDocument.findMany({
            where: { dqfId },
        });

        const now = new Date();
        const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        const hasExpired = docs.some((d) => d.expirationDate && d.expirationDate < now);
        const hasExpiring = docs.some((d) => d.expirationDate && d.expirationDate < thirtyDays && d.expirationDate >= now);
        const completedTypes = new Set(docs.map((d) => d.documentType));
        const allRequired = requiredTypes.every((t) => completedTypes.has(t as any));

        let status: 'COMPLETE' | 'INCOMPLETE' | 'EXPIRING' | 'EXPIRED' = 'INCOMPLETE';
        if (hasExpired) status = 'EXPIRED';
        else if (allRequired && hasExpiring) status = 'EXPIRING';
        else if (allRequired) status = 'COMPLETE';

        await this.prisma.driverQualificationFile.update({
            where: { id: dqfId },
            data: { status },
        });
    }
}

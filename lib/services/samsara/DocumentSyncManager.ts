/**
 * Samsara Document Sync Manager
 * 
 * Synchronizes Proof of Delivery (POD) and other driver-submitted documents
 * from Samsara to TMS Loads.
 */

import { prisma } from '@/lib/prisma';
import { getSamsaraDocuments } from '@/lib/integrations/samsara';
import { DocumentType } from '@prisma/client';

export class SamsaraDocumentSyncManager {
    /**
     * Poll Samsara for new documents and link to loads
     */
    async syncDocuments(companyId: string): Promise<{ syncedCount: number; errors: string[] }> {
        const errors: string[] = [];
        let syncedCount = 0;

        try {
            // Fetch documents from last 24 hours
            const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const documents = await getSamsaraDocuments(companyId, startTime);

            if (!documents || documents.length === 0) {
                return { syncedCount: 0, errors: [] };
            }

            for (const samsaraDoc of documents) {
                try {
                    // 1. Identify context (Driver/Vehicle)
                    const driverId = samsaraDoc.driverId;
                    const vehicleId = samsaraDoc.vehicleId;

                    if (!driverId) continue;

                    const driver = await prisma.driver.findFirst({
                        where: {
                            companyId,
                            deletedAt: null,
                            OR: [
                                { licenseNumber: driverId },
                                { hosRecords: { some: { eldRecordId: driverId, eldProvider: 'Samsara' } } }
                            ]
                        },
                    });

                    if (!driver) continue;

                    // 3. Find active load for this driver/vehicle at the time of submission
                    const submissionTime = new Date(samsaraDoc.createdAt);
                    const activeLoad = await prisma.load.findFirst({
                        where: {
                            companyId,
                            driverId: driver.id,
                            status: { in: ['ASSIGNED', 'EN_ROUTE_PICKUP', 'AT_PICKUP', 'EN_ROUTE_DELIVERY', 'AT_DELIVERY'] },
                            deletedAt: null,
                        },
                        orderBy: { createdAt: 'desc' },
                    });

                    if (!activeLoad) continue;

                    // 4. Check if document already exists
                    const existing = await prisma.document.findFirst({
                        where: {
                            loadId: activeLoad.id,
                            fileName: samsaraDoc.id || samsaraDoc.name, // Use Samsara ID as filename reference
                        },
                    });

                    if (existing) continue;

                    // 5. Create document record
                    // Note: Samsara document PDF URLs are usually behind authentication.
                    // We store the reference and title.
                    await prisma.document.create({
                        data: {
                            companyId,
                            loadId: activeLoad.id,
                            driverId: driver.id,
                            title: samsaraDoc.name || 'Samsara Document',
                            description: `Synced from Samsara. Type: ${samsaraDoc.documentType?.name || 'Unknown'}`,
                            type: this.mapDocumentType(samsaraDoc.documentType?.name),
                            fileName: samsaraDoc.id,
                            fileUrl: samsaraDoc.pdfUrl || '', // Placeholder or direct URL if available
                            fileSize: 0,
                            mimeType: 'application/pdf',
                            uploadedBy: 'SAMSARA_SYSTEM',
                        },
                    });

                    syncedCount++;
                } catch (err: any) {
                    errors.push(`Doc ${samsaraDoc.id}: ${err.message}`);
                }
            }
        } catch (error: any) {
            errors.push(`Fetch failed: ${error.message}`);
        }

        return { syncedCount, errors };
    }

    /**
     * Map Samsara document types to our DocumentType enum
     */
    private mapDocumentType(samsaraType?: string): DocumentType {
        if (!samsaraType) return DocumentType.OTHER;

        const type = samsaraType.toLowerCase();
        if (type.includes('pod') || type.includes('delivery')) return DocumentType.POD;
        if (type.includes('bol') || type.includes('lading')) return DocumentType.BOL;
        if (type.includes('invoice')) return DocumentType.INVOICE;
        if (type.includes('rate') || type.includes('confirmation')) return DocumentType.RATE_CONFIRMATION;
        if (type.includes('lumper')) return DocumentType.LUMPER;
        if (type.includes('detention')) return DocumentType.DETENTION;
        if (type.includes('license')) return DocumentType.DRIVER_LICENSE;
        if (type.includes('medical')) return DocumentType.MEDICAL_CARD;
        if (type.includes('insurance')) return DocumentType.INSURANCE;
        if (type.includes('registration')) return DocumentType.REGISTRATION;
        if (type.includes('inspection')) return DocumentType.INSPECTION;
        if (type.includes('lease')) return DocumentType.LEASE_AGREEMENT;
        if (type.includes('w9')) return DocumentType.W9;

        return DocumentType.OTHER;
    }
}

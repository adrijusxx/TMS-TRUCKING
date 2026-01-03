'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Schema for compliance updates
const updateComplianceSchema = z.object({
    driverId: z.string(),
    type: z.enum(['cdl', 'medCard', 'mvr', 'drugTest', 'annualReview', 'dqf']),
    data: z.any(), // Flexible data based on type
    documentId: z.string().optional(), // ID of uploaded document if any
});

export async function updateDriverCompliance(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session) {
        return { success: false, message: 'Unauthorized' };
    }

    const rawData = {
        driverId: formData.get('driverId'),
        type: formData.get('type'),
        data: JSON.parse(formData.get('data') as string),
        documentId: formData.get('documentId'),
    };

    const validation = updateComplianceSchema.safeParse(rawData);

    if (!validation.success) {
        return { success: false, message: 'Invalid data', errors: validation.error.flatten() };
    }

    const { driverId, type, data, documentId } = validation.data;
    const companyId = session.user.companyId;

    try {
        switch (type) {
            case 'cdl':
                // Upsert CDL Record
                await prisma.cDLRecord.upsert({
                    where: { driverId },
                    create: {
                        companyId,
                        driverId,
                        cdlNumber: data.number,
                        expirationDate: new Date(data.expiry),
                        issueState: data.state,
                        documentId: documentId || undefined,
                    },
                    update: {
                        cdlNumber: data.number,
                        expirationDate: new Date(data.expiry),
                        issueState: data.state,
                        ...(documentId ? { documentId } : {}),
                    },
                });
                break;

            case 'medCard':
                // Upsert Medical Card (using findFirst/create pattern as it's not unique by driverId in schema effectively, mostly it is but let's be safe or just create new one if history needed? Schema puts driverId on it. upsert on id? no id. create new one usually.)
                // wait, schema: medicalCards MedicalCard[]
                // Let's create a new one to keep history, or update latest?
                // For simple edit, let's update the latest if exists, or create new.
                const latestMed = await prisma.medicalCard.findFirst({
                    where: { driverId },
                    orderBy: { expirationDate: 'desc' }
                });

                if (latestMed && !data.createNew) {
                    await prisma.medicalCard.update({
                        where: { id: latestMed.id },
                        data: {
                            cardNumber: data.number || 'N/A', // Schema requires it
                            expirationDate: new Date(data.expiry),
                            ...(documentId ? { documentId } : {}),
                        }
                    })
                } else {
                    await prisma.medicalCard.create({
                        data: {
                            companyId,
                            driverId,
                            cardNumber: data.number || 'N/A',
                            expirationDate: new Date(data.expiry),
                            documentId: documentId || undefined,
                        }
                    });
                }
                break;

            case 'mvr':
                // MVR is usually a record of a pull. 
                await prisma.mVRRecord.create({
                    data: {
                        companyId,
                        driverId,
                        pullDate: new Date(data.date),
                        state: data.state || 'UNKNOWN',
                        nextPullDueDate: new Date(new Date(data.date).setFullYear(new Date(data.date).getFullYear() + 1)), // Auto set next year
                        documentId: documentId || undefined,
                    }
                });
                break;

            case 'drugTest':
                await prisma.drugAlcoholTest.create({
                    data: {
                        companyId,
                        driverId,
                        testDate: new Date(data.date),
                        testType: data.testType || 'RANDOM',
                        result: data.result || 'NEGATIVE',
                        documentId: documentId || undefined,
                    }
                });
                break;

            case 'annualReview':
                await prisma.annualReview.create({
                    data: {
                        companyId,
                        driverId,
                        reviewDate: new Date(data.date),
                        dueDate: new Date(new Date(data.date).setFullYear(new Date(data.date).getFullYear() + 1)),
                        reviewYear: new Date(data.date).getFullYear(),
                        status: data.status || 'COMPLETED',
                        // documentId linked via Document relation? Schema: documents Document[]
                        // Need to connect if documentId provided
                        ...(documentId ? { documents: { connect: { id: documentId } } } : {})
                    }
                });
                break;
        }

        revalidatePath('/dashboard/safety/compliance');
        return { success: true, message: 'Record updated successfully' };
    } catch (error) {
        console.error('Error updating compliance:', error);
        return { success: false, message: 'Failed to update record' };
    }
}

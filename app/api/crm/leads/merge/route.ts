/**
 * POST /api/crm/leads/merge — Merge duplicate leads
 * Keeps the "primary" lead and soft-deletes the "secondary" lead.
 * Moves notes, activities, and documents from secondary to primary.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const MergeSchema = z.object({
    primaryId: z.string().min(1),
    secondaryId: z.string().min(1),
});

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const parsed = MergeSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 });
        }

        const { primaryId, secondaryId } = parsed.data;
        if (primaryId === secondaryId) {
            return NextResponse.json({ error: 'Cannot merge a lead with itself' }, { status: 400 });
        }

        const companyId = session.user.companyId;

        const [primary, secondary] = await Promise.all([
            prisma.lead.findFirst({ where: { id: primaryId, companyId, deletedAt: null } }),
            prisma.lead.findFirst({ where: { id: secondaryId, companyId, deletedAt: null } }),
        ]);

        if (!primary || !secondary) {
            return NextResponse.json({ error: 'One or both leads not found' }, { status: 404 });
        }

        await prisma.$transaction(async (tx) => {
            // Move notes from secondary to primary
            await tx.leadNote.updateMany({
                where: { leadId: secondaryId },
                data: { leadId: primaryId },
            });

            // Move activities from secondary to primary
            await tx.leadActivity.updateMany({
                where: { leadId: secondaryId },
                data: { leadId: primaryId },
            });

            // Move documents from secondary to primary
            await tx.leadDocument.updateMany({
                where: { leadId: secondaryId },
                data: { leadId: primaryId },
            });

            // Create a merge activity on the primary lead
            await tx.leadActivity.create({
                data: {
                    leadId: primaryId,
                    type: 'NOTE',
                    content: `Merged with lead ${secondary.leadNumber} (${secondary.firstName} ${secondary.lastName})`,
                    userId: session.user.id,
                },
            });

            // Fill in any missing fields on primary from secondary
            const fillFields: Record<string, any> = {};
            if (!primary.email && secondary.email) fillFields.email = secondary.email;
            if (!primary.address && secondary.address) fillFields.address = secondary.address;
            if (!primary.city && secondary.city) fillFields.city = secondary.city;
            if (!primary.state && secondary.state) fillFields.state = secondary.state;
            if (!primary.zip && secondary.zip) fillFields.zip = secondary.zip;
            if (!primary.cdlNumber && secondary.cdlNumber) fillFields.cdlNumber = secondary.cdlNumber;
            if (!primary.cdlClass && secondary.cdlClass) fillFields.cdlClass = secondary.cdlClass;
            if (!primary.yearsExperience && secondary.yearsExperience) fillFields.yearsExperience = secondary.yearsExperience;

            if (Object.keys(fillFields).length > 0) {
                await tx.lead.update({ where: { id: primaryId }, data: fillFields });
            }

            // Soft-delete the secondary lead
            await tx.lead.update({
                where: { id: secondaryId },
                data: { deletedAt: new Date() },
            });
        });

        const updatedPrimary = await prisma.lead.findUnique({
            where: { id: primaryId },
            include: { assignedTo: { select: { firstName: true, lastName: true } } },
        });

        return NextResponse.json({ lead: updatedPrimary });
    } catch (error) {
        console.error('[CRM Leads Merge] Error:', error);
        return NextResponse.json({ error: 'Failed to merge leads' }, { status: 500 });
    }
}

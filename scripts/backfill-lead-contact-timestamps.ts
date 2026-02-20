/**
 * Backfill Lead Contact Timestamps
 *
 * One-time script to populate lastCallAt and lastSmsAt from existing LeadActivity records.
 * Run with: npx tsx scripts/backfill-lead-contact-timestamps.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BATCH_SIZE = 50;

async function main() {
    const totalLeads = await prisma.lead.count({ where: { deletedAt: null } });
    console.log(`Found ${totalLeads} leads to process`);

    let processed = 0;
    let updated = 0;

    while (processed < totalLeads) {
        const leads = await prisma.lead.findMany({
            where: { deletedAt: null },
            select: { id: true },
            skip: processed,
            take: BATCH_SIZE,
        });

        for (const lead of leads) {
            const [lastCall, lastSms] = await Promise.all([
                prisma.leadActivity.findFirst({
                    where: { leadId: lead.id, type: 'CALL' },
                    orderBy: { createdAt: 'desc' },
                    select: { createdAt: true },
                }),
                prisma.leadActivity.findFirst({
                    where: { leadId: lead.id, type: 'SMS' },
                    orderBy: { createdAt: 'desc' },
                    select: { createdAt: true },
                }),
            ]);

            if (lastCall || lastSms) {
                await prisma.lead.update({
                    where: { id: lead.id },
                    data: {
                        lastCallAt: lastCall?.createdAt ?? undefined,
                        lastSmsAt: lastSms?.createdAt ?? undefined,
                    },
                });
                updated++;
            }
        }

        processed += leads.length;
        console.log(`Processed ${processed}/${totalLeads} leads (${updated} updated)`);
    }

    console.log(`Done. Updated ${updated} of ${totalLeads} leads.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

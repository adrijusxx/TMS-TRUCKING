/**
 * GET  /api/crm/recruiter-assignment  — Fetch config + recruiter profiles
 * PUT  /api/crm/recruiter-assignment  — Save config + upsert recruiter profiles
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { LeadAssignmentManager } from '@/lib/managers/LeadAssignmentManager';
import { z } from 'zod';

const manager = new LeadAssignmentManager();

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const companyId = session.user.companyId;

    const [config, recruiters] = await Promise.all([
        manager.getConfig(companyId),
        manager.listRecruiters(companyId),
    ]);

    return NextResponse.json({ config, recruiters });
}

const RecruiterSchema = z.object({
    userId: z.string(),
    isActive: z.boolean().optional(),
    weight: z.number().int().min(1).max(10).optional(),
    maxCapacity: z.number().int().min(1).max(500).optional(),
});

const PutSchema = z.object({
    config: z.object({
        enabled: z.boolean(),
        strategy: z.enum(['ROUND_ROBIN', 'WEIGHTED', 'LEAST_LOADED']),
        assignOnSources: z.array(z.string()).default([]),
    }),
    recruiters: z.array(RecruiterSchema),
});

export async function PUT(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = PutSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 });
    }

    const companyId = session.user.companyId;
    const { config, recruiters } = parsed.data;

    await manager.saveConfig(companyId, config);

    // Upsert each recruiter profile
    await Promise.all(
        recruiters.map((r) =>
            manager.upsertRecruiter(companyId, r.userId, {
                isActive: r.isActive,
                weight: r.weight,
                maxCapacity: r.maxCapacity,
            })
        )
    );

    const [updatedConfig, updatedRecruiters] = await Promise.all([
        manager.getConfig(companyId),
        manager.listRecruiters(companyId),
    ]);

    return NextResponse.json({ config: updatedConfig, recruiters: updatedRecruiters });
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const resolveSchema = z.object({
    email: z.string().email(),
});

/**
 * Resolve which companies have an account for a given email.
 * Public endpoint (no auth required) — only returns companyId + companyName.
 * Used by the login page to show a company selector when email exists in multiple companies.
 *
 * POST /api/auth/resolve-companies
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = resolveSchema.parse(body);
        const normalizedEmail = email.toLowerCase().trim();

        const users = await prisma.user.findMany({
            where: { email: normalizedEmail, isActive: true, deletedAt: null },
            select: {
                companyId: true,
                company: { select: { name: true } },
            },
        });

        // Deduplicate by companyId (shouldn't have dupes, but defensive)
        const seen = new Set<string>();
        const companies = users
            .filter((u) => {
                if (seen.has(u.companyId)) return false;
                seen.add(u.companyId);
                return true;
            })
            .map((u) => ({
                companyId: u.companyId,
                companyName: u.company.name,
            }));

        return NextResponse.json({ companies });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { companies: [], error: 'Invalid email format' },
                { status: 400 }
            );
        }

        console.error('Resolve companies error:', error);
        return NextResponse.json(
            { companies: [], error: 'Something went wrong' },
            { status: 500 }
        );
    }
}

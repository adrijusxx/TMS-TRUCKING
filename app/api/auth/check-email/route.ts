import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const checkEmailSchema = z.object({
    email: z.string().email(),
});

/**
 * Check if an email is already registered
 * POST /api/auth/check-email
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = checkEmailSchema.parse(body);

        const normalizedEmail = email.toLowerCase().trim();

        // Email is unique per-company, not globally.
        // For registration (new company), email is always available.
        // Return count of existing accounts for informational purposes.
        const existingCount = await prisma.user.count({
            where: { email: normalizedEmail, deletedAt: null },
        });

        return NextResponse.json({
            available: true, // Always available for new company registration
            existingAccounts: existingCount,
            message: existingCount > 0
                ? `This email is registered with ${existingCount} other ${existingCount === 1 ? 'company' : 'companies'}. You can still create a new company account.`
                : 'Email is available',
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { available: false, message: 'Invalid email format' },
                { status: 400 }
            );
        }

        console.error('Email check error:', error);
        return NextResponse.json(
            { available: true, message: 'Unable to verify email' },
            { status: 500 }
        );
    }
}

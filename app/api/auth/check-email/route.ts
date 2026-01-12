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

        const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: { id: true },
        });

        return NextResponse.json({
            available: !existingUser,
            message: existingUser ? 'This email is already registered' : 'Email is available',
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

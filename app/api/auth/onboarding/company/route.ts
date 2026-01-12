import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { onboardingStep2Schema } from '@/lib/validations/onboarding';

/**
 * PATCH /api/auth/onboarding/company
 * 
 * Step 2: Update company details after initial account creation.
 * Requires authenticated user (from step 1).
 */
export async function PATCH(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { userId, ...companyData } = body;

        // Validate company data
        const validated = onboardingStep2Schema.parse(companyData);

        // Get the user's company
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { company: true },
        });

        if (!user || !user.companyId) {
            return NextResponse.json(
                { success: false, error: { code: 'NOT_FOUND', message: 'User or company not found' } },
                { status: 404 }
            );
        }

        // Update company details
        const updatedCompany = await prisma.company.update({
            where: { id: user.companyId },
            data: {
                name: validated.companyName,
                dotNumber: validated.dotNumber,
                phone: validated.phone || user.company.phone,
                address: validated.address || user.company.address,
                city: validated.city || user.company.city,
                state: validated.state || user.company.state,
                zip: validated.zip || user.company.zip,
            },
        });

        // Update the MC number
        await prisma.mcNumber.updateMany({
            where: {
                companyId: user.companyId,
                isDefault: true,
            },
            data: {
                number: validated.mcNumber,
                companyName: validated.companyName,
            },
        });

        // Update user's onboarding step
        await prisma.user.update({
            where: { id: session.user.id },
            data: { onboardingStep: 2 },
        });

        return NextResponse.json({
            success: true,
            data: {
                companyId: updatedCompany.id,
                companyName: updatedCompany.name,
            },
        });
    } catch (error) {
        console.error('[Onboarding Company] Error:', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update company' } },
            { status: 500 }
        );
    }
}

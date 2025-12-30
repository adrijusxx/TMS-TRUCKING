import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/super-admin/companies/[id]
 * Get company details
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const company = await prisma.company.findUnique({
            where: { id },
            include: {
                mcNumbers: true,
                users: true,
                subscription: {
                    include: {
                        addOns: true,
                    },
                },
            },
        });

        if (!company) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        return NextResponse.json(company);
    } catch (error) {
        console.error('Error fetching company:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * PATCH /api/super-admin/companies/[id]
 * Update company details or subscription
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const {
            name, dotNumber, email, phone, address, city, state, zip, isActive,
            subscriptionStatus, manualOverride, manualModules, planId // Added planId
        } = body;

        // Update company
        const updatedCompany = await prisma.company.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(dotNumber && { dotNumber }),
                ...(email && { email }),
                ...(phone && { phone }),
                ...(address && { address }),
                ...(city && { city }),
                ...(state && { state }),
                ...(zip && { zip }),
                ...(isActive !== undefined && { isActive }),
                // subscriptionStatus is deprecated in favor of Subscription model but kept for compat if needed
            },
        });

        // Update subscription if needed
        if (manualOverride !== undefined || manualModules || subscriptionStatus || planId) {
            await prisma.subscription.update({
                where: { companyId: id },
                data: {
                    ...(manualOverride !== undefined && { manualOverride }),
                    ...(manualModules && { manualModules }),
                    ...(subscriptionStatus && { status: subscriptionStatus }),
                    ...(planId && { planId }), // Update planId
                },
            });
        }

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: 'UPDATE_COMPANY',
                entityType: 'Company',
                entityId: id,
                metadata: body,
            },
        });

        return NextResponse.json(updatedCompany);
    } catch (error) {
        console.error('Error updating company:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE /api/super-admin/companies/[id]
 * Delete company
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Check if company exists
        const company = await prisma.company.findUnique({
            where: { id },
        });

        if (!company) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        // Soft delete is preferred in trucking. If User wants total deletion, we can do it but usually it's destructive.
        // For now we'll do soft delete if isActive is enough, or just delete if it's a test company.
        // The user said "data deletion of certain mc profile, certain mc deletion".
        // I will implement a hard delete but with caution, cleaning up primary blockers.

        await prisma.$transaction(async (tx) => {
            // 1. Delete ApiKeyConfigs
            await tx.apiKeyConfig.deleteMany({ where: { companyId: id } });

            // 2. Delete AuditLogs associated with this company (if any metadata refers to it) or just leave them?
            // Usually audit logs are kept, but if they are tied to users being deleted, they might fail.

            // 3. Delete Subscriptions
            await tx.subscription.deleteMany({ where: { companyId: id } });

            // 4. Delete UserCompany links
            await tx.userCompany.deleteMany({ where: { companyId: id } });

            // 5. Delete Users who have this company as primary
            // WARNING: This is very destructive.
            // We delete users first because they reference MC Numbers.
            await tx.user.deleteMany({ where: { companyId: id } });

            // 6. Delete MC Numbers
            await tx.mcNumber.deleteMany({ where: { companyId: id } });

            // 7. Finally delete the company
            await tx.company.delete({ where: { id } });
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: 'DELETE_COMPANY',
                entityType: 'Company',
                entityId: id,
                metadata: { companyName: company.name },
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting company:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

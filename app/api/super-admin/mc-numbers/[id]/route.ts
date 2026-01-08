import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

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

        const mcNumber = await prisma.mcNumber.findUnique({
            where: { id },
        });

        if (!mcNumber) {
            return NextResponse.json({ error: 'MC Number not found' }, { status: 404 });
        }

        return NextResponse.json(mcNumber);
    } catch (error) {
        console.error('Error fetching MC number:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

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

        const mcNumber = await prisma.mcNumber.update({
            where: { id },
            data: body,
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: 'UPDATE_MC_NUMBER',
                entityType: 'McNumber',
                entityId: id,
                metadata: { number: mcNumber.number },
            },
        });

        return NextResponse.json(mcNumber);
    } catch (error) {
        console.error('Error updating MC number:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

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

        // Check if it exists
        const mcNumber = await prisma.mcNumber.findUnique({
            where: { id },
        });

        if (!mcNumber) {
            return NextResponse.json({ error: 'MC Number not found' }, { status: 404 });
        }

        // Hard delete with manual cascading for relations that don't have onDelete: Cascade
        await prisma.$transaction(async (tx) => {
            // 1. Nullify optional references in core entities
            // This preserves the data within the Company but removes the MC assignment
            const filter = { where: { mcNumberId: id }, data: { mcNumberId: null } };

            await tx.load.updateMany(filter);
            await tx.truck.updateMany(filter);
            await tx.trailer.updateMany(filter);
            await tx.driver.updateMany(filter);
            await tx.fuelEntry.updateMany(filter);
            // await tx.loadTemplate.updateMany(filter); // Model removed
            await tx.breakdown.updateMany(filter);
            await tx.payment.updateMany(filter);
            await tx.tariff.updateMany(filter);
            await tx.expenseCategory.updateMany(filter);
            await tx.expenseType.updateMany(filter);
            await tx.classification.updateMany(filter);
            await tx.documentTemplate.updateMany(filter);
            await tx.defaultConfiguration.updateMany(filter);

            // 2. Handle Users
            // Remove this MC from anyone's access list
            const usersWithAccess = await tx.user.findMany({
                where: { mcAccess: { has: id } },
                select: { id: true, mcAccess: true },
            });

            for (const u of usersWithAccess) {
                await tx.user.update({
                    where: { id: u.id },
                    data: {
                        mcAccess: u.mcAccess.filter((mcId) => mcId !== id),
                    },
                });
            }

            // Delete users who have this as their primary MC
            // WARNING: This is destructive, matching the Company Delete policy.
            await tx.user.deleteMany({
                where: { mcNumberId: id },
            });

            // 3. Finally delete the MC Number
            // NOTE: ApiKeyConfig has onDelete: Cascade in schema, so it will be handled by DB
            await tx.mcNumber.delete({
                where: { id },
            });
        });

        // Audit log (outside transaction for simplicity, or we could move it in)
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: 'DELETE_MC_NUMBER',
                entityType: 'McNumber',
                entityId: id,
                metadata: { number: mcNumber.number },
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting MC number:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

import { auth } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const undoSchema = z.object({
    batchId: z.string().min(1),
});

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { batchId } = undoSchema.parse(body);

        const batch = await prisma.importBatch.findUnique({
            where: {
                id: batchId,
            },
        });

        if (!batch) {
            return new NextResponse("Batch not found", { status: 404 });
        }

        if (batch.companyId !== session.user.companyId) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        if (batch.status === "ROLLED_BACK") {
            return new NextResponse("Batch already rolled back", { status: 400 });
        }

        // Perform Rollback
        // We use a transaction to ensure all or nothing
        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // 1. Delete entities created in this batch
            // We attempt to delete records from all tables matching this batchId.
            // Order matters for referential integrity (e.g., delete Loads before Drivers if Drivers are created by Load import)

            // Start with dependent entities
            await tx.load.deleteMany({ where: { importBatchId: batchId } });

            // Clean up settlements for imported drivers before deleting them
            await tx.settlement.deleteMany({ where: { driver: { importBatchId: batchId } } });
            await tx.driverAdvance.deleteMany({ where: { driver: { importBatchId: batchId } } });

            // Then reference entities
            await tx.driver.deleteMany({ where: { importBatchId: batchId } });
            await tx.truck.deleteMany({ where: { importBatchId: batchId } });
            await tx.trailer.deleteMany({ where: { importBatchId: batchId } });
            await tx.customer.deleteMany({ where: { importBatchId: batchId } });
            await tx.vendor.deleteMany({ where: { importBatchId: batchId } });
            await tx.location.deleteMany({ where: { importBatchId: batchId } });

            // 2. Update Batch Status
            await tx.importBatch.update({
                where: { id: batchId },
                data: {
                    status: "ROLLED_BACK",
                },
            });
        });

        return NextResponse.json({ success: true, message: "Batch rolled back successfully" });
    } catch (error) {
        console.error("[IMPORT_UNDO_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
